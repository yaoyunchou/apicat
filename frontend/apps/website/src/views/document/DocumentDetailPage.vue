<template>
  <div class="ac-header-operate" v-if="hasDocument && httpDoc">
    <div class="ac-header-operate__main">
      <p class="ac-header-operate__title">{{ httpDoc.title }}</p>
    </div>

    <div class="ac-header-operate__btns">
      <el-button type="primary" v-if="isManager || isWriter" @click="() => goDocumentEditPage()">{{ $t('app.common.edit') }}</el-button>
      <template v-if="isManager || isWriter">
        <el-tooltip effect="dark" content="分享该文档" placement="bottom">
          <Iconfont icon="ac-share cursor-pointer" :size="18" @click="handleShare()" />
        </el-tooltip>
      </template>

      <template v-else>
        <el-tooltip effect="dark" content="分享该文档" placement="bottom" v-if="!isPrivate && isReader">
          <Iconfont icon="ac-share cursor-pointer" :size="18" @click="handleShare()" />
        </el-tooltip>
      </template>

      <el-tooltip effect="dark" content="导出该文档" placement="bottom" v-if="isManager || isWriter">
        <Iconfont icon="ac-export cursor-pointer" :size="18" @click="handleExport()" />
      </el-tooltip>

      <el-tooltip effect="dark" content="历史记录" placement="bottom" v-if="isManager || isWriter">
        <Iconfont class="cursor-pointer ac-history" :size="24" @click="goDocumentHistoryRecord" />
      </el-tooltip>
    </div>
  </div>

  <Result v-show="!hasDocument && !isLoading">
    <template #icon>
      <img class="h-auto w-260px mb-26px" src="@/assets/images/icon-empty.png" alt="" />
    </template>
  </Result>

  <div :class="[ns.b(), { 'h-20vh': !httpDoc && hasDocument }]" v-loading="isLoading">
    <div class="ac-editor mt-10px" v-if="httpDoc">
      <RequestMethodRaw class="mb-10px" :doc="httpDoc" :urls="urlServers" />
      <RequestParamRaw class="mb-10px" :doc="httpDoc" :definitions="definitions" />
      <ResponseParamTabsRaw :doc="httpDoc" :definitions="definitions" :project-id="project_id" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { HttpDocument } from '@/typings'
import { useNamespace } from '@/hooks/useNamespace'
import ResponseParamTabsRaw from '@/components/ResponseParamTabsRaw.vue'
import { useGoPage } from '@/hooks/useGoPage'
import useProjectStore from '@/store/project'
import { storeToRefs } from 'pinia'
import { getCollectionDetail } from '@/api/collection'
import { useParams } from '@/hooks/useParams'
import useDefinitionStore from '@/store/definitionSchema'
import uesGlobalParametersStore from '@/store/globalParameters'
import useDefinitionResponseStore from '@/store/definitionResponse'
import { ProjectDetailModalsContextKey } from '@/layouts/ProjectDetailLayout/constants'
import { getDocumentHistoryPath } from '@/router'

const projectStore = useProjectStore()
const definitionStore = useDefinitionStore()
const globalParametersStore = uesGlobalParametersStore()
const definitionResponseStore = useDefinitionResponseStore()

const route = useRoute()
const router = useRouter()
const { project_id } = useParams()
const { goDocumentEditPage } = useGoPage()

const [isLoading, getCollectionDetailApi] = getCollectionDetail()
const { urlServers, isManager, isWriter, isPrivate, isReader } = storeToRefs(projectStore)

const { definitions } = storeToRefs(definitionStore)

const hasDocument = ref(false)
const ns = useNamespace('document')
const httpDoc: Ref<HttpDocument | null> = ref(null)
const projectDetailModals = inject(ProjectDetailModalsContextKey)

const getDetail = async (docId: string) => {
  const doc_id = parseInt(docId, 10)

  isLoading.value = true

  if (isNaN(doc_id)) {
    hasDocument.value = false
    httpDoc.value = null
    isLoading.value = false
    return
  }

  try {
    hasDocument.value = true
    httpDoc.value = await getCollectionDetailApi({ project_id, collection_id: doc_id })
  } catch (error) {
    //
  }
}

const handleExport = () => projectDetailModals?.exportDocument()

const handleShare = () => projectDetailModals?.shareDocument(project_id, route.params.doc_id as string)

const goDocumentHistoryRecord = () => router.push(getDocumentHistoryPath(project_id, route.params.doc_id as string))

globalParametersStore.$onAction(({ name, after }) => {
  // 删除全局参数
  if (name === 'deleteGlobalParameter') {
    after(() => getDetail(route.params.doc_id as string))
  }
})

definitionStore.$onAction(({ name, after }) => {
  // 删除全局模型
  if (name === 'deleteDefinition') {
    after(() => getDetail(route.params.doc_id as string))
  }
})

definitionResponseStore.$onAction(({ name, after }) => {
  if (name === 'deleteDefinition') {
    after(() => getDetail(route.params.doc_id as string))
  }
})

watch(
  () => route.params.doc_id,
  async () => {
    await getDetail(route.params.doc_id as string)
  },
  {
    immediate: true,
  }
)
</script>
