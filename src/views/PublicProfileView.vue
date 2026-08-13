<!--
  @component PublicProfileView
  @description 공개 프로필 페이지. 다른 유저의 공개 정보(닉네임, 자기소개,
  관심 토픽, 기술 스택, 희망 역할, 외부 링크/파일)를 조회한다.
-->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicProfile } from '@/api/profile'
import type { PublicProfileData } from '@/api/profile'
import TechStackChip from '@/components/TechStackChip.vue'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import PdfViewer from '@/components/PdfViewer.vue'

const route = useRoute()
const userId = Number(route.params.id)

const profile = ref<PublicProfileData | null>(null)
const loading = ref(true)
const error = ref('')

/** 숙련도 한글 변환 */
function proficiencyLabel(level: string): string {
  const map: Record<string, string> = {
    LEARNING: '학습 중',
    BEGINNER: '입문',
    INTERMEDIATE: '중급',
    ADVANCED: '고급',
  }
  return map[level] || level
}

/* ────── 파일 미리보기 ────── */
const filePreviewOpen = ref(false)

function openFilePreview() {
  filePreviewOpen.value = true
}

function closeFilePreview() {
  filePreviewOpen.value = false
}

onMounted(async () => {
  try {
    const res = await fetchPublicProfile(userId)
    profile.value = res.data
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 404) {
      error.value = '프로필을 찾을 수 없습니다.'
    } else {
      error.value = '프로필을 불러오지 못했어요.'
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto min-h-[calc(100vh-76px)] max-w-[1440px] px-12 pt-8">
    <!-- 로딩 -->
    <div v-if="loading" class="flex flex-col gap-4 pt-12">
      <div class="h-[204px] animate-pulse rounded-xl bg-bg-muted" />
      <div class="flex gap-6">
        <div class="h-[560px] flex-1 animate-pulse rounded-xl bg-bg-muted" />
        <div class="h-[560px] w-[474px] animate-pulse rounded-xl bg-bg-muted" />
      </div>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="flex flex-col items-center pt-20">
      <div
        class="flex h-[104px] w-[104px] items-center justify-center rounded-full border border-border"
      >
        <span class="text-[34px] text-text-secondary">!</span>
      </div>
      <p class="mt-6 text-[22px] font-bold text-text">{{ error }}</p>
      <router-link
        to="/projects"
        class="mt-8 flex h-[46px] w-[220px] items-center justify-center rounded-full bg-text text-sm font-bold text-white"
      >
        프로젝트 찾기
      </router-link>
    </div>

    <!-- 프로필 콘텐츠 -->
    <template v-else-if="profile">
      <!-- 상단 프로필 헤더 -->
      <div class="rounded-xl border border-border bg-bg-card px-6 py-10">
        <div class="flex items-start gap-6">
          <!-- 아바타 -->
          <DefaultAvatar :size="94" :image-url="profile.profileImage?.url ?? null" />

          <div>
            <h1 class="text-[28px] font-bold text-text">{{ profile.nickname }}</h1>
            <p v-if="profile.roles.length" class="mt-1 text-sm text-text-secondary">
              {{ profile.roles.map((r) => r.roleName).join(' · ') }}
            </p>
            <p v-if="profile.introduction" class="mt-3 text-sm text-text-secondary">
              {{ profile.introduction }}
            </p>
          </div>
        </div>
      </div>

      <!-- 좌측 + 우측 -->
      <div class="mt-6 flex gap-6">
        <!-- 좌측: 토픽 + 기술 + 역할 -->
        <div class="flex-1 rounded-xl border border-border bg-white px-6 py-8">
          <!-- 관심 토픽 -->
          <section>
            <h2 class="text-base font-bold text-text">관심 토픽</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="topic in profile.topics"
                :key="topic.topicId"
                class="rounded-full bg-text px-4 py-2 text-[13px] text-white"
              >
                {{ topic.topicName }}
              </span>
              <span v-if="!profile.topics.length" class="text-sm text-text-secondary">
                등록된 토픽이 없습니다.
              </span>
            </div>
          </section>

          <!-- 기술 스택 -->
          <section class="mt-8">
            <h2 class="text-base font-bold text-text">기술 스택</h2>
            <div class="mt-4 flex flex-col gap-2">
              <div
                v-for="ts in profile.techStacks"
                :key="ts.techStackId"
                class="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <TechStackChip :name="ts.techStackName as any" size="sm" />
                <span
                  class="rounded-full border border-border bg-white px-3 py-1 text-xs text-text"
                >
                  {{ proficiencyLabel(ts.proficiencyLevel) }}
                </span>
              </div>
              <p v-if="!profile.techStacks.length" class="text-sm text-text-secondary">
                등록된 기술 스택이 없습니다.
              </p>
            </div>
          </section>

          <!-- 희망 역할 -->
          <section class="mt-8">
            <h2 class="text-base font-bold text-text">희망 역할</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="role in profile.roles"
                :key="role.roleId"
                class="rounded-full bg-text px-4 py-2 text-[13px] text-white"
              >
                {{ role.roleName }}
              </span>
              <span v-if="!profile.roles.length" class="text-sm text-text-secondary">
                등록된 역할이 없습니다.
              </span>
            </div>
          </section>
        </div>

        <!-- 우측: 공개 자료 -->
        <div class="w-[474px] shrink-0 rounded-xl border border-border bg-bg-card px-6 py-8">
          <h2 class="text-base font-bold text-text">공개 자료</h2>

          <div class="mt-4 flex flex-col gap-3">
            <!-- 외부 링크 -->
            <div
              v-if="profile.externalLinkUrl"
              class="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3"
            >
              <span class="text-sm text-text">외부 링크</span>
              <a
                :href="profile.externalLinkUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs font-bold text-text-secondary transition-colors hover:text-text"
              >
                새 창
              </a>
            </div>

            <!-- 파일 -->
            <div
              v-if="profile.publicMaterial"
              class="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3"
            >
              <span class="text-sm text-text">{{ profile.publicMaterial.originalName }}</span>
              <button
                class="text-xs font-bold text-text-secondary transition-colors hover:text-text"
                @click="openFilePreview"
              >
                미리보기
              </button>
            </div>

            <p
              v-if="!profile.externalLinkUrl && !profile.publicMaterial"
              class="text-sm text-text-secondary"
            >
              등록된 공개 자료가 없습니다.
            </p>
          </div>

          <!-- 공개 원칙 -->
          <div class="mt-8">
            <h3 class="text-sm font-medium text-text">공개 원칙</h3>
            <p class="mt-2 text-[13px] leading-relaxed text-text-secondary">
              외부 링크는 브라우저에서 열고, 파일은 사이트 내 미리보기로 제공하며 다운로드는
              지원하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- 파일 미리보기 모달 -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="filePreviewOpen && profile?.publicMaterial"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          @click.self="closeFilePreview"
        >
          <div class="flex h-[90vh] w-full max-w-[900px] flex-col rounded-xl bg-white">
            <div class="flex items-start justify-between px-6 py-5">
              <div>
                <div class="flex items-center gap-3">
                  <h2 class="text-lg font-bold text-text">파일 미리보기</h2>
                  <button
                    class="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-text hover:bg-bg-muted"
                    @click="closeFilePreview"
                  >
                    닫기
                  </button>
                </div>
                <p class="mt-3 text-xs text-text-secondary">
                  사이트 내에서 파일을 열람할 수 있습니다. 다운로드는 지원하지 않습니다.
                </p>
              </div>
            </div>
            <PdfViewer :url="profile.publicMaterial.url" class="h-[calc(100%-100px)]" />
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>
