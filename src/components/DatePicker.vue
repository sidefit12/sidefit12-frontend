<!--
  @component DatePicker
  @description 커스텀 날짜 선택 드롭다운. 월별 캘린더 표시.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  minDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '날짜 선택',
  minDate: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토']

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const d = new Date(props.modelValue)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
})

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const days: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return days
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function selectDay(day: number) {
  const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  emit('update:modelValue', dateStr)
  open.value = false
}

function isDisabled(day: number): boolean {
  if (!props.minDate) return false
  const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return dateStr < props.minDate
}

function isSelected(day: number): boolean {
  if (!props.modelValue) return false
  const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return dateStr === props.modelValue
}
</script>

<template>
  <div class="relative">
    <button
      class="flex h-[48px] w-full items-center justify-between rounded-lg border border-border bg-white px-4 text-[13px] text-text"
      @click="open = !open"
    >
      <span :class="displayValue ? 'text-text' : 'text-[#8d8d8d]'">
        {{ displayValue || placeholder }}
      </span>
      <span class="text-text-secondary">⌄</span>
    </button>

    <transition name="dropdown">
      <div
        v-if="open"
        class="absolute bottom-[52px] left-0 z-50 w-[280px] rounded-xl border border-border bg-white p-4 shadow-lg"
      >
        <!-- 헤더 -->
        <div class="flex items-center justify-between">
          <button class="text-sm text-text hover:text-text-secondary" @click="prevMonth">‹</button>
          <span class="text-sm font-bold text-text">{{ viewYear }}년 {{ viewMonth + 1 }}월</span>
          <button class="text-sm text-text hover:text-text-secondary" @click="nextMonth">›</button>
        </div>

        <!-- 요일 -->
        <div class="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-text-secondary">
          <span v-for="d in daysOfWeek" :key="d">{{ d }}</span>
        </div>

        <!-- 날짜 -->
        <div class="mt-1 grid grid-cols-7 gap-1">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="flex size-8 items-center justify-center"
          >
            <button
              v-if="day"
              :disabled="isDisabled(day)"
              :class="[
                'flex size-8 items-center justify-center rounded-full text-xs transition-all',
                isSelected(day)
                  ? 'bg-text font-bold text-white'
                  : isDisabled(day)
                    ? 'text-border cursor-not-allowed'
                    : 'text-text hover:bg-bg-muted',
              ]"
              @click="selectDay(day)"
            >
              {{ day }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
  </div>
</template>
