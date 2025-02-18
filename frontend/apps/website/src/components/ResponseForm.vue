<template>
  <el-space direction="vertical" fill warp class="w-full">
    <el-form :inline="true">
      <el-form-item :label="$t('app.response.table.name')">
        <el-input v-model="model.name" maxlength="50" />
      </el-form-item>

      <el-form-item :label="$t('app.response.table.code')">
        <el-select v-model="model.code" :placeholder="$t('app.response.table.code')" filterable>
          <el-option v-for="code in HttpCodeList" :label="code.code + ' ' + code.desc" :value="code.code" />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('app.response.table.desc')">
        <el-input v-model="model.description" maxlength="300" />
      </el-form-item>
      <el-form-item>
        <el-checkbox :checked="model.header ? true : false" @change="toggleHeader">header</el-checkbox>
      </el-form-item>
    </el-form>

    <el-space direction="vertical" fill v-if="model.header" :size="14">
      <el-text>Header</el-text>
      <SimpleEditor v-model="model.header" allow-mock />
    </el-space>

    <el-space direction="vertical" fill :size="4" v-for="(_, ct) in model.content" :key="ct">
      <div class="flex justify-between w-full my-8px">
        <el-text>Content</el-text>
        <el-select :modelValue="contentDefaultType" @change="changeContentType">
          <template #prefix>Content-Type</template>
          <el-option v-for="(_, cti) in contentTypes" :key="cti" :label="cti" :value="cti" />
        </el-select>
      </div>
      <Editor :definitions="definitions" v-model="model.content[ct].schema" v-if="isJsonschema" />
      <p class="my-10px" v-if="model.content[ct].schema.example">
        {{ $t('app.response.tips.responseExample') }}
        <el-tag disable-transitions effect="plain">format:{{ contentTypes[ct] }}</el-tag>
      </p>
      <CodeEditor v-if="model.content[ct].schema.example" v-model="model.content[ct].schema.example" :lang="contentTypes[ct]" />
      <ResponseExamplesForm v-model:examples="examples" :lang="contentTypes[ct]"/>
    </el-space>
  </el-space>
</template>

<script lang="ts">
export declare interface APICatResponse {
  id?: number | string
  name?: string
  code: number
  description: string
  content: Record<string, { schema: JSONSchema }>
  header?: APICatSchemaObject[]
}

export const contentTypes: Record<string, string> = {
  'application/json': 'json',
  'application/xml': 'xml',
  'text/html': 'html',
  'text/plain': 'raw',
  'application/octet-stream': 'raw',
}
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { HttpCodeList } from '@apicat/shared'
import type { APICatSchemaObject, DefinitionSchema, JSONSchema } from './APIEditor/types'
import SimpleEditor from './APIEditor/SimpleEditor.vue'
import Editor from './APIEditor/Editor.vue'
import CodeEditor from './APIEditor/CodeEditor.vue'
import { computed } from 'vue'
import { CheckboxValueType } from 'element-plus'
import { APICatCommonResponse } from '@/typings'
import ResponseExamplesForm from '@/views/component/ResponseExamples.vue'

const props = defineProps<{
  modelValue: APICatResponse | APICatCommonResponse
  // 引用模型的集合
  definitions?: DefinitionSchema[]
}>()

const emit = defineEmits(['update:modelValue'])
const model: any = useVModel(props, 'modelValue', emit)

const toggleHeader = (b: CheckboxValueType) => {
  if (b) {
    model.value.header = []
  } else {
    model.value.header = undefined
  }
}

const contentDefaultType = computed(() => {
  for (let x in props.modelValue.content) {
    return x
  }
  return 'application/json'
})

const isJsonschema = computed(() => contentDefaultType.value == 'application/json' || contentDefaultType.value == 'application/xml')

const examples = computed({
  get:()=>{
    return model.value.content[contentDefaultType.value].examples || {}
  },
  set:(value: Record<string, any>)=>{
    model.value.content[contentDefaultType.value].examples = value
  }
})
const changeContentType = (v: string) => {
  const oldtype = contentDefaultType.value
  model.value.content[v] = model.value.content[oldtype]
  delete model.value.content[oldtype]
}
</script>
