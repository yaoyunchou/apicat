<template>
  <div :class="nsEditor.b()">
    <div :class="[nsRow.b(), nsRow.m('header')]">
      <div :class="nsRow.e('content')">
        <div :class="[nsRow.e('item'), nsRow.e('name')]">{{ $t('editor.table.paramName') }}</div>
        <div :class="[nsRow.e('item'), nsRow.e('type')]">{{ $t('editor.table.paramType') }}</div>
        <div :class="[nsRow.e('item'), nsRow.e('required')]">{{ $t('editor.table.required') }}</div>
        <div :class="[nsRow.e('item'), nsRow.e('example')]">{{ $t('editor.table.paramExample') }}</div>
        <div :class="[nsRow.e('item'), nsRow.e('description')]">{{ $t('editor.table.paramDesc') }}</div>
        <div :class="[nsRow.e('item'), nsRow.e('mock')]">{{ $t('editor.table.paramMock') }}</div>
        <div :class="[nsRow.e('item'), nsRow.e('operation')]" v-if="!readonly"></div>
      </div>
    </div>
    <EditorRow :level="1" :data="root" :readonly="readonly" />
    <div :class="[nsRow.b()]" v-if="!readonly">
      <div :class="nsRow.e('content')" class="px-20px">
        <el-button @click="() => importSchemaModalRef?.show()">Code 导入</el-button>
      </div>
    </div>
  </div>
  <ImportSchemaModal ref="importSchemaModalRef" @ok="handleImportSuccess" />
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import EditorRow from './EditorRow.vue'
import { JSONSchema, DefinitionSchema, Tree, allowMockTypes } from './types'
import { constNodeType, typename } from './types'
import { useNamespace } from '@/hooks'
import { RefPrefixKeys } from '@/commons'
import { cloneDeep } from 'lodash-es'
import { guessMockRule } from '../MockRules/utils'
import ImportSchemaModal from './ImportSchemaModal.vue'

const props = withDefaults(
  defineProps<{
    // 根schema
    modelValue: JSONSchema
    // 引用模型的集合
    definitions?: DefinitionSchema[]
    readonly?: boolean
  }>(),
  {
    definitions: () => [],
  }
)

const nsEditor = useNamespace('schema-editor')
const nsRow = useNamespace('schema-row')

const emits = defineEmits(['update:modelValue'])
// const expandKeys = ref<Set<string>>(new Set([constNodeType.root]))
const localSchema = ref()
const root = computed(() => convertTreeData(undefined, constNodeType.root, constNodeType.root, localSchema.value))
const importSchemaModalRef = ref<InstanceType<typeof ImportSchemaModal>>()

watch(
  () => [props.modelValue, props.definitions],
  () => {
    // recompute root
    localSchema.value = props.modelValue
    // expandKeys.value.clear()
    // setDefaultExpandKeys(root.value)
  },
  {
    immediate: true,
  }
)

// provide('expandKeys', expandKeys.value)
provide('definitions', () => props.definitions)
provide('change', changeEvent)

// // 默认展开所有
// function setDefaultExpandKeys(tree: Tree) {
//   const child = tree.children || []
//   if (child && child.length) {
//     expandKeys.value.add(tree.key)
//   }
//   for (let i = 0; i < child.length; i++) {
//     setDefaultExpandKeys(child[i])
//   }
// }

function changeEvent(root?: JSONSchema) {
  if (root) {
    emits('update:modelValue', root)
  } else {
    emits('update:modelValue', localSchema.value)
  }
}

function isRefSelf(tree: Tree, refId: string): boolean {
  let parent: any = tree.parent

  while (parent) {
    if (parent.schema.$ref) {
      const parentRefId = parent.schema.$ref.match(RefPrefixKeys.DefinitionSchema.reg)?.[1]
      if (parentRefId === refId) {
        return true
      }
    }
    parent = parent.parent
  }

  return false
}

function convertTreeData(parent: Tree | undefined, key: string, label: string, schema: JSONSchema): Tree {
  const item: Tree = {
    key,
    label,
    schema,
    parent,
    type: '',
  }
  if (schema.$ref != undefined) {
    const id = schema.$ref.match(RefPrefixKeys.DefinitionSchema.reg)?.[1]
    const refId = parseInt(id as string, 10)
    const refschema = props.definitions?.find((v) => v.id === refId)
    if (refschema && refschema.schema) {
      item.refObj = refschema

      if (schema._id === refId) {
        item.isSelf = true
        return item
      }

      //clone definition schema
      schema = cloneDeep(refschema.schema)

      // object ref self
      if (refId === parent?.schema._id || isRefSelf(item, id!)) {
        item.isSelf = true
        return item
      }
    }
  }

  item.type = typename(schema.type)

  switch (item.type) {
    case 'object':
      let children: Tree[] = []
      const ps = schema.properties
      if (ps) {
        const orders = schema['x-apicat-orders'] || Object.keys(ps)
        for (let k of orders) {
          if (k != 'additionalMetadata') {
            const p = key + '.' + k
            children.push(convertTreeData(item, p, k, ps[k]))
          }
        }
        schema['x-apicat-orders'] = orders
      } else {
        schema.properties = {}
      }
      if (!schema.required) schema.required = []
      if (!schema['x-apicat-orders']) schema['x-apicat-orders'] = []
      item.children = children
      break
    case 'array':
      if (schema.items) {
        item.children = [convertTreeData(item, `${key}.${constNodeType.items}`, constNodeType.items, schema.items as JSONSchema)]
      }
  }

  // default mock
  const mock = item.schema['x-apicat-mock']
  if (!mock && allowMockTypes.includes(item.type)) {
    item.schema['x-apicat-mock'] = guessMockRule({ name: item.label, mockType: item.type })
  }

  // default expand children
  // if (item.children && item.children.length) {
  //   expandKeys.value.add(key)
  // }

  return item
}

const handleImportSuccess = (jsonSchema: JSONSchema) => {
  localSchema.value = jsonSchema
  changeEvent()
}
// 处理拖拽
provide('drop', dropHandler)
function dropHandler(offset: number, to: Tree, source: string) {
  const p = to.parent
  if (!p) {
    return
  }
  const container = to.parent?.schema
  if (container && checkValidObject(container)) {
    const from = findTreeFromKey(root.value, source)
    if (from) {
      const orders = container['x-apicat-orders'] || []
      if (from.parent?.key === to.parent?.key) {
        // 同一目录下 只需要变换位置
        const s = orders.filter((v) => v !== from.label)
        let i = s.indexOf(to.label)
        if (offset > 0) i += 1
        s.splice(i < 0 ? 0 : i, 0, from.label)
        container['x-apicat-orders'] = s
      } else {
        // 添加新的同时删除老的
        if (container.properties) {
          container.properties[from.label] = getSchemaSource(from)
          let i = orders.indexOf(to.label)
          if (offset > 0) i += 1
          orders.splice(i < 0 ? 0 : i, 0, from.label)
          const p = from.parent?.schema
          if (p) {
            p['x-apicat-orders'] = p['x-apicat-orders']?.filter((v) => v != from.label)
            delete p.properties?.[from.label]
          }
        }
      }
    }
    changeEvent()
  }
}

function findTreeFromKey(n: Tree, k: string): Tree | undefined {
  if (n.children) {
    for (let v of n.children) {
      if (v.key === k) {
        return v
      }
      const n = findTreeFromKey(v, k)
      if (n) {
        return n
      }
    }
  }
  return undefined
}

function getSchemaSource(t: Tree) {
  if (t.refObj) {
    return {
      $ref: `${RefPrefixKeys.DefinitionSchema.key}${t.refObj.id}`,
      description: t.schema.description,
    }
  }
  return t.schema
}

function checkValidObject(schema: JSONSchema) {
  return schema.type === 'object' && schema.properties && schema.required && schema['x-apicat-orders']
}
</script>

<style lang="scss">
@use './editor-row.scss';
</style>
