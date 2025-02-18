<template>
  <div :class="[ns.b(), { [ns.m('hover')]: !isGuest }]">
    <div :class="ns.e('img')" v-if="isGuest">
      <router-link to="/">
        <img src="@/assets/images/logo-square.svg" :alt="projectDetailInfo?.title" />
      </router-link>
    </div>

    <template v-else>
      <div :class="ns.e('img')" v-if="isIterationRoute">
        <img src="@/assets/images/logo-square.svg" :alt="projectDetailInfo?.title" />
        <router-link to="/iterations">
          <el-icon :class="ns.e('back')"><ac-icon-ep-arrow-left-bold /></el-icon>
        </router-link>
      </div>

      <el-popover placement="bottom" width="250px" v-else>
        <template #reference>
          <div :class="ns.e('img')">
            <img src="@/assets/images/logo-square.svg" :alt="projectDetailInfo?.title" />
            <router-link to="/main">
              <el-icon :class="ns.e('back')"><ac-icon-ep-arrow-left-bold /></el-icon>
            </router-link>
          </div>
        </template>

        <PopperMenu :menus="allMenus" class="clear-popover-space" @menu-click="onMenuItemClick" />
      </el-popover>
    </template>

    <template v-if="isIterationRoute">
      <div class="pr-2 overflow-hidden">
        <div :title="projectDetailInfo?.title" class="flex-y-center">
          <p class="text-base truncate">{{ projectDetailInfo?.title }}</p>
          <el-tooltip effect="dark" content="私有项目" placement="bottom" v-if="isPrivate">
            <el-icon class="ml-4px"><ac-icon-ep-lock /></el-icon>
          </el-tooltip>
        </div>
        <p class="text-sm truncate" :title="iterationInfo?.title">{{ iterationInfo?.title }}</p>
      </div>
    </template>

    <template v-else>
      <div :class="ns.e('title')" :title="projectDetailInfo?.title">
        {{ projectDetailInfo?.title }}
        <el-tooltip effect="dark" content="私有项目" placement="bottom" v-if="isPrivate">
          <el-icon :class="ns.e('icon')"><ac-icon-ep-lock /></el-icon>
        </el-tooltip>
      </div>
    </template>
  </div>

  <ProjectSettingModal ref="projectSettingModalRef" />
</template>
<script setup lang="ts">
import { useProjectStore } from '@/store/project'
import { useNamespace } from '@/hooks/useNamespace'
import ProjectSettingModal from '@/views/project/ProjectSettingModal.vue'
import { Menu } from '@/components/typings'
import { getProjectNavigateList, ProjectNavigateListEnum } from '@/commons/constant'
import { storeToRefs } from 'pinia'
import { AsyncMsgBox } from '@/components/AsyncMessageBox'
import { useI18n } from 'vue-i18n'
import { quitProject } from '@/api/project'
import { useUserStore } from '@/store/user'
import { ProjectDetailModalsContextKey } from '../constants'
import { useIterationStore } from '@/store/iteration'

const { t } = useI18n()
const ns = useNamespace('project-info')
const projectSettingModalRef = ref<InstanceType<typeof ProjectSettingModal>>()
const projectStore = useProjectStore()
const iterationStore = useIterationStore()
const { isIterationRoute, iterationInfo } = storeToRefs(iterationStore)

const { projectDetailInfo, isManager, isPrivate, isGuest, isReader } = storeToRefs(projectStore)
const projectDetailModals = inject(ProjectDetailModalsContextKey)

const allMenus = computed(() => {
  const menus = getProjectNavigateList()

  let sortMenus: Menu[] = []

  Object.keys(menus).forEach((key: string) => {
    const item: Menu = { ...(menus[key] as any), key }
    switch (key) {
      case ProjectNavigateListEnum.ProjectShare:
        item.action = handlerShareProject
        break

      case ProjectNavigateListEnum.QuitProject:
        item.action = handlerQuitProject
        break
    }

    sortMenus.push(item)
  })

  sortMenus.sort((pre, next) => pre.sort - next.sort)

  // 管理员移除退出项目
  if (isManager.value) {
    sortMenus = sortMenus.filter((item: Menu) => item.key !== ProjectNavigateListEnum.QuitProject)
  }

  // 移除分享项目链接
  if (isPrivate.value && (isGuest.value || isReader.value)) {
    sortMenus = sortMenus.filter((item: Menu) => item.key !== ProjectNavigateListEnum.ProjectShare)
  }

  return sortMenus
})

const handlerShareProject = () => projectDetailModals?.shareProject(projectDetailInfo.value?.id! as string)

const handlerQuitProject = async () => {
  AsyncMsgBox({
    title: t('app.project.tips.quitProjectTitle'),
    content: t('app.project.tips.quitProject'),
    onOk: async () => {
      try {
        await quitProject(projectDetailInfo.value?.id! as string)
        projectStore.clearCurrentProjectInfo()
        useUserStore().goHome()
      } catch (error) {}
    },
  })
}

const onMenuItemClick = async (menu: Menu) => {
  if (menu.action) {
    return await menu.action()
  }
  unref(projectSettingModalRef)!.show(menu.key)
}
</script>

<style lang="scss" scoped>
@use '@/styles/mixins/mixins' as *;
@use '@/styles/variable' as *;

// 项目信息
@include b(project-info) {
  height: $doc-header-height;
  width: $doc-layout-left-width;
  padding: 0 $doc-layout-padding;
  @apply flex items-center fixed left-0 top-0 z-50 bg-gray-100;

  @include e(img) {
    @apply flex-none w-32px h-32px mr-10px cursor-pointer;
  }

  @include e(back) {
    @apply w-32px h-32px rounded-4px hidden bg-#dddddd text-12px;
  }

  @include e(title) {
    @apply truncate text-16px relative pr-20px;
  }

  @include e(icon) {
    @apply absolute right-0 top-50% -mt-8px;
  }

  @include m(hover) {
    @include e(img) {
      &:hover {
        img {
          @apply hidden;
        }
        @include e(back) {
          @apply inline-flex;
        }
      }
    }
  }
}
</style>
