import useProjectStore from '@/store/project'
import type { Router } from 'vue-router'
import { MAIN_PATH, NOT_FOUND_PATH, PROJECT_DETAIL_PATH_NAME, PROJECT_SHARE_VALIDATION_NAME } from '../constant'
import { ProjectInfo } from '@/typings'
import { Cookies } from '@/commons'
import { ShareSecretKeyError } from '@/api/error'

export const setupGetProjectInfoFilter = (router: Router) => {
  router.beforeEach(async (to, from, next) => {
    const projectStore = useProjectStore()

    if (to.matched.find((item: any) => item.name === PROJECT_DETAIL_PATH_NAME)) {
      const project_id = to.params.project_id
      if (!projectStore.projectDetailInfo || projectStore.projectDetailInfo.id !== project_id) {
        try {
          const projectInfo: ProjectInfo = await projectStore.getProjectDetailInfo(project_id as string)

          if (!projectInfo) {
            return next(NOT_FOUND_PATH)
          }

          return next()
        } catch (error) {
          // 密钥错误
          if (error instanceof ShareSecretKeyError) {
            Cookies.remove(Cookies.KEYS.SHARE_PROJECT + project_id)
            return next({
              name: PROJECT_SHARE_VALIDATION_NAME,
              params: { project_id },
            })
          }

          return next(MAIN_PATH)
        }
      }
    } else {
      projectStore.$patch({ projectDetailInfo: null })
    }

    next()
  })
}

export const setupGetProjectAuthInfoFilter = (router: Router) => {
  router.beforeEach(async (to, from, next) => {
    const projectStore = useProjectStore()

    if (to.matched.find((route) => route.name === PROJECT_DETAIL_PATH_NAME)) {
      // 同一个项目，无需再次获取权限信息
      if (projectStore.projectAuthInfo && projectStore.projectAuthInfo.project_id === to.params.project_id) {
        return next()
      }

      try {
        await projectStore.getProjectAuthInfo(to.params.project_id as string)
        return next()
      } catch (error) {
        return next(MAIN_PATH)
      }
    } else {
      projectStore.$patch({ projectAuthInfo: null })
    }

    next()
  })
}
