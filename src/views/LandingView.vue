<!--
  @component LandingView
  @description 비로그인 유저용 랜딩 페이지. 서비스 소개 + 회원가입 유도.
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-[calc(100vh-76px)]">
    <!-- 히어로 섹션 -->
    <section class="relative overflow-hidden bg-text py-24">
      <!-- 배경 장식 (움직이는 볼트 원) -->
      <div
        class="glow-left absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full bg-primary/20 blur-3xl"
      />
      <div
        class="glow-right absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl"
      />

      <div class="relative mx-auto max-w-[1200px] px-12">
        <div class="hero-fade flex flex-col items-start">
          <span class="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-text">
            SIDE PROJECT MATCHING
          </span>
          <h1 class="hero-fade delay-1 mt-6 text-[48px] font-bold leading-tight text-white">
            나와 잘 맞는 프로젝트를<br />더 빠르게 발견하세요.
          </h1>
          <p class="hero-fade delay-2 mt-5 max-w-[600px] text-lg leading-relaxed text-white/70">
            관심 토픽·기술 스택·희망 역할을 기준으로<br />
            AI가 추천 이유까지 알려드려요.
          </p>
          <div class="hero-fade delay-3 mt-10 flex gap-4">
            <button
              class="h-[52px] rounded-full bg-primary px-8 text-sm font-bold text-text transition-transform hover:scale-105"
              @click="router.push('/login')"
            >
              시작하기
            </button>
            <button
              class="h-[52px] rounded-full bg-white px-8 text-sm font-bold text-text transition-transform hover:scale-105"
              @click="router.push('/projects')"
            >
              프로젝트 둘러보기
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 기능 소개 -->
    <section class="mx-auto max-w-[1200px] px-12 py-20">
      <h2 class="section-fade text-center text-[32px] font-bold text-text">어떻게 사용하나요?</h2>
      <p class="section-fade delay-1 mt-3 text-center text-sm text-text-secondary">
        3가지 핵심 기능으로 사이드 프로젝트 팀원을 찾아보세요.
      </p>

      <div class="mt-14 grid grid-cols-3 gap-8">
        <!-- 카드 1 -->
        <div class="feature-card rounded-xl border border-border bg-white p-8">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <span class="text-lg font-bold text-text">AI</span>
          </div>
          <h3 class="mt-5 text-lg font-bold text-text">AI 맞춤 추천</h3>
          <p class="mt-2 text-sm leading-relaxed text-text-secondary">
            프로필 기반으로 역할·토픽·기술 스택 일치도를 분석해 나에게 맞는 프로젝트를 추천합니다.
          </p>
        </div>

        <!-- 카드 2 -->
        <div class="feature-card delay-1 rounded-xl border border-border bg-white p-8">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-text">
            <svg
              class="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
          <h3 class="mt-5 text-lg font-bold text-text">프로젝트 탐색</h3>
          <p class="mt-2 text-sm leading-relaxed text-text-secondary">
            토픽·기술·역할·진행 방식 필터로 모집 중인 프로젝트를 빠르게 탐색할 수 있습니다.
          </p>
        </div>

        <!-- 카드 3 -->
        <div class="feature-card delay-2 rounded-xl border border-border bg-white p-8">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <span class="text-lg font-bold text-text">✓</span>
          </div>
          <h3 class="mt-5 text-lg font-bold text-text">지원·팀 매칭</h3>
          <p class="mt-2 text-sm leading-relaxed text-text-secondary">
            지원 메시지와 프로필을 검토한 뒤 팀원을 승인하면 협업 채널이 자동으로 연결됩니다.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-fade {
  opacity: 0;
  transform: translateY(16px);
  animation: fade-up 0.5s ease-out 0.2s forwards;
}
.hero-fade.delay-1 {
  animation-delay: 0.4s;
}
.hero-fade.delay-2 {
  animation-delay: 0.6s;
}
.hero-fade.delay-3 {
  animation-delay: 0.8s;
}

.section-fade {
  opacity: 0;
  transform: translateY(12px);
  animation: fade-up 0.4s ease-out 0.3s forwards;
}
.section-fade.delay-1 {
  animation-delay: 0.5s;
}

.feature-card {
  opacity: 0;
  transform: translateY(20px);
  animation: fade-up 0.4s ease-out 0.6s forwards;
}
.feature-card.delay-1 {
  animation-delay: 0.75s;
}
.feature-card.delay-2 {
  animation-delay: 0.9s;
}

@keyframes fade-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.glow-left {
  animation: float-left 8s ease-in-out infinite;
}

.glow-right {
  animation: float-right 10s ease-in-out infinite;
}

@keyframes float-left {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(40px, 30px);
  }
}

@keyframes float-right {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-50px, -40px);
  }
}
</style>
