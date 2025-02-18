<template>
  <div :class="[ns.b(), ns.m(type)]">
    <div :class="ns.e('header')">
      <h3 class="text-base font-medium" @click="handleTitleClick">
        <span class="flex items-center">
          <el-icon class="cursor-pointer text-zinc-500 transition-all duration-0.3s mr-6px" :class="{ 'rotate-90': isShow }"><ac-icon-ep-caret-right /></el-icon>
          {{ title }}
        </span>
      </h3>
      <slot name="extra" :isShow="isShow"></slot>
    </div>
    <div v-show="isShow" :class="ns.e('content')">
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useNamespace } from '@/hooks'

interface Props {
  title: string
  type?: 'card' | 'default'
  expand?: boolean
}

const emits = defineEmits(['onExpand'])
const props = withDefaults(defineProps<Props>(), {
  title: '',
  type: 'default',
  expand: true,
})

const ns = useNamespace('toggle-heading')
const [isShow, toggle] = useToggle(props.expand)

const handleTitleClick = () => {
  toggle()
  emits('onExpand', unref(isShow))
}

defineExpose({
  expand: () => toggle(true),
})
</script>
<style lang="scss" scoped>
@use '@/styles/mixins/mixins.scss' as *;

@include b(toggle-heading) {
  @include m(card) {
    @apply flex flex-col;

    @include e(header) {
      @apply bg-gray-200 rounded px-6px;
      flex: 100%;

      h3 {
        @apply cursor-pointer flex-1;
      }
    }

    @include e(content) {
      @apply p-0;
    }

    h3 {
      @apply text-16px font-normal flex h-30px items-center;
    }
  }

  @include e(header) {
    @apply flex items-center justify-between mb-5px;

    h3 > span {
      @apply cursor-pointer;
    }
  }

  @include e(content) {
    @apply pl-16px;
  }

  & + & {
    @apply mt-20px;
  }
}
</style>
