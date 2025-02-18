<template>
  <div class="flex flex-col h-full">
    <div :class="[ns.b(), ns.m('header')]">
      <div v-for="menu in menus" :key="menu.name" :class="[ns.e('item'), activeClass(menu.id)]" @click="handleItemClick(menu.id)">
        <Iconfont v-if="menu.iconfont" :icon="menu.iconfont" :size="18" />
        <el-icon v-if="menu.elIcon" :size="18"><component :is="menu.elIcon" /></el-icon>
        <span>{{ menu.name }}</span>
      </div>

      <div :class="ns.e('segment')">
        <p>项目分组</p>
        <el-icon v-if="!isNormalUser" @click="onCreateProjectGroup" class="cursor-pointer"><ac-icon-ep-plus /></el-icon>
      </div>
    </div>

    <div class="flex-1 overflow-scroll mb-10px scroll-content">
      <Draggable tag="ul" :class="ns.b()" :list="groups" @end="onDragEnd">
        <li v-for="item in groups" :key="item.id" :class="[ns.e('item'),ns.em('item','more'), activeClass(item.id!)]" @click="handleItemClick(item.id!)">
          <div class="w-full flex-y-center">
            <span :class="ns.e('dot')"></span>
            <span :class="ns.e('title')">{{ item.name }}</span>
          </div>
          <el-icon @click.stop="onMoreMenuClick($event, item)"><ac-icon-ep-more-filled /></el-icon>
        </li>
      </Draggable>
    </div>
  </div>

  <el-popover :virtual-ref="popoverRefEl" trigger="click" virtual-triggering :visible="isShowPopoverMenu" width="auto">
    <PopperMenu :menus="popoverMenus" size="small" class="clear-popover-space" @menu-click="" />
  </el-popover>
</template>

<script setup lang="ts">
import { useNamespace } from '@/hooks'
import { useUserStore } from '@/store/user'
import { ProjectGroup, ProjectGroupSelectKey, SwitchProjectGroupInfo } from '@/typings'
import AcIconAdd from '~icons/fe/plus'
import AcIconMyProject from '~icons/mdi/folder-outline'
import AcIconMyFollowedProject from '~icons/clarity/star-line'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { usePopover } from '@/hooks/usePopover'
import { VueDraggableNext as Draggable } from 'vue-draggable-next'

const emits = defineEmits<{
  (event: 'create-project'): void
  (event: 'create-group'): void
  (event: 'switch-group', info: SwitchProjectGroupInfo): void
  (event: 'update:selected', key: ProjectGroupSelectKey): void
  (event: 'delete-group', group: ProjectGroup): void
  (event: 'rename-group', group: ProjectGroup): void
  (event: 'sort-group'): void
}>()

const props = withDefaults(
  defineProps<{
    selected: ProjectGroupSelectKey
    groups?: ProjectGroup[]
  }>(),
  {
    selected: 'all',
    groups: () => [],
  }
)

const userStore = useUserStore()
const { isNormalUser } = storeToRefs(userStore)
const { groups, selected } = toRefs(props)
const ns = useNamespace('group-list')
const { t } = useI18n()

let currentModifyProjectGroup: ProjectGroup | null = null

const {
  isShow: isShowPopoverMenu,
  popoverRefEl,
  showPopover,
  hidePopover,
} = usePopover({
  onHide: () => {
    currentModifyProjectGroup = null
  },
})

const selectedRef = ref<ProjectGroupSelectKey>(props.selected)
let selectedHistory: ProjectGroupSelectKey = props.selected

// 导航菜单
const menus = computed(() => {
  let allMenus: Array<{ name: string; id: ProjectGroupSelectKey; iconfont?: string; elIcon?: any }> = [
    { name: '所有项目', id: 'all', iconfont: 'ac-xiangmu' },
    { name: '关注的项目', id: 'followed', elIcon: markRaw(AcIconMyFollowedProject) },
    { name: '我的项目', id: 'my', elIcon: markRaw(AcIconMyProject) },
    { name: t('app.project.createModal.title'), id: 'create', elIcon: markRaw(AcIconAdd) },
  ]

  // 普通成员移除创建入口
  if (isNormalUser.value) {
    allMenus = allMenus.filter((menu) => menu.id !== 'create')
  }

  return allMenus
})

// popover菜单
const popoverMenus = [
  {
    text: '重命名',
    onClick: () => {
      currentModifyProjectGroup && emits('rename-group', currentModifyProjectGroup)
      hidePopover()
    },
  },
  {
    text: '删除',
    onClick: () => {
      currentModifyProjectGroup && emits('delete-group', currentModifyProjectGroup)
      hidePopover()
    },
  },
]

// 点击项目分组
const handleItemClick = (key: ProjectGroupSelectKey) => {
  selectedRef.value = key
}

watch(selected, (val) => handleItemClick(val))

watch(selectedRef, (key) => {
  if (key !== 'create') {
    selectedHistory = key
    let title: string | undefined
    if (typeof key === 'string') {
      title = menus.value.find((menu) => menu.id === key)?.name
    } else {
      title = groups.value.find((menu) => menu.id === key)?.name
    }
    emits('switch-group', { key, title: title ?? '所有项目' })
    emits('update:selected', key)
    return
  }

  emits('create-project')
})

const onDragEnd = () => emits('sort-group')

const onCreateProjectGroup = () => emits('create-group')

const activeClass = (key: ProjectGroupSelectKey) => (selectedRef.value === key ? 'active' : '')

// 点击更多菜单
const onMoreMenuClick = (e: MouseEvent, group: ProjectGroup) => {
  currentModifyProjectGroup = group
  showPopover(e.target as HTMLElement)
}

// 导航回退
const goBackSelected = () => {
  selectedRef.value = selectedHistory
}

// 移除选中导航（所有导航不选中）
const removeSelected = () => {
  selectedRef.value = null
}

// 导航选中（默认选中所有）
const goSelected = (key: ProjectGroupSelectKey = 'all') => {
  selectedHistory = key
  goBackSelected()
}

defineExpose({
  goSelected,
  removeSelected,
  goBackSelected,
})
</script>
