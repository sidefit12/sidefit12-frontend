<!--
  @component SignupView
  @description 이메일 회원가입 페이지.
  Step 1: 이메일 인증 → Step 2: 기본정보 + 약관 → 완료 모달
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  checkEmailAvailability,
  checkNicknameAvailability,
  sendVerificationCode,
  confirmVerificationCode,
  signUp,
} from '@/api/signup'

const router = useRouter()

/* ────── 상태 ────── */
const step = ref<'verify' | 'form' | 'done'>('verify')
const submitting = ref(false)
const errorMessage = ref('')

// Step 1: 이메일 인증
const email = ref('')
const emailChecked = ref(false)
const emailError = ref('')
const verificationCode = ref('')
const verificationToken = ref('')
const codeSent = ref(false)
const codeSending = ref(false)
const codeSentAnim = ref(false)
const codeVerified = ref(false)
const codeError = ref('')

// Step 2: 기본 정보
const nickname = ref('')
const nicknameChecked = ref(false)
const nicknameChecking = ref(false)
const nicknameError = ref('')
const password = ref('')
const passwordConfirm = ref('')
const passwordError = ref('')

// 약관
const termsService = ref(false)
const termsPrivacy = ref(false)
const termsMarketing = ref(false)

const canSubmit = computed(
  () =>
    nicknameChecked.value &&
    password.value.length >= 8 &&
    password.value === passwordConfirm.value &&
    termsService.value &&
    termsPrivacy.value,
)

/* ────── Step 1 액션 ────── */

async function handleCheckEmail() {
  emailError.value = ''
  if (!email.value) {
    emailError.value = '이메일을 입력해 주세요.'
    return
  }
  try {
    const res = await checkEmailAvailability(email.value)
    if (res.data.available) {
      emailChecked.value = true
    } else {
      emailError.value = '이미 사용 중인 이메일입니다.'
    }
  } catch {
    emailError.value = '이메일 확인에 실패했어요.'
  }
}

async function handleSendCode() {
  codeError.value = ''
  codeSending.value = true
  codeSentAnim.value = false
  try {
    await sendVerificationCode(email.value)
    codeSent.value = true
    codeSentAnim.value = true
    setTimeout(() => {
      codeSentAnim.value = false
    }, 2000)
  } catch {
    codeError.value = '인증 코드 발송에 실패했어요.'
  } finally {
    codeSending.value = false
  }
}

async function handleConfirmCode() {
  codeError.value = ''
  if (verificationCode.value.length < 6) {
    codeError.value = '6자리 인증 코드를 입력해 주세요.'
    return
  }
  try {
    const res = await confirmVerificationCode(email.value, verificationCode.value)
    if (res.data.verified) {
      codeVerified.value = true
      verificationToken.value = res.data.verificationToken
      step.value = 'form'
    } else {
      codeError.value = '인증 코드가 올바르지 않아요.'
    }
  } catch {
    codeError.value = '인증 코드 확인에 실패했어요.'
  }
}

/* ────── Step 2 액션 ────── */

async function handleCheckNickname() {
  nicknameError.value = ''
  if (nickname.value.length < 2 || nickname.value.length > 15) {
    nicknameError.value = '닉네임은 2~15자로 입력해 주세요.'
    return
  }
  nicknameChecking.value = true
  try {
    const res = await checkNicknameAvailability(nickname.value)
    if (res.data.available) {
      nicknameChecked.value = true
    } else {
      nicknameError.value = '이미 사용 중인 닉네임입니다.'
    }
  } catch {
    nicknameError.value = '닉네임 확인에 실패했어요.'
  } finally {
    nicknameChecking.value = false
  }
}

function validatePassword() {
  passwordError.value = ''
  if (password.value.length < 8) {
    passwordError.value = '비밀번호는 8자 이상이어야 합니다.'
  } else if (password.value !== passwordConfirm.value && passwordConfirm.value) {
    passwordError.value = '비밀번호가 일치하지 않습니다.'
  }
}

async function handleSignUp() {
  errorMessage.value = ''
  validatePassword()
  if (passwordError.value) return

  submitting.value = true
  try {
    const res = await signUp({
      email: email.value,
      nickname: nickname.value,
      password: password.value,
      passwordConfirm: passwordConfirm.value,
      verificationToken: verificationToken.value,
      termsServiceRequired: termsService.value,
      termsPrivacyRequired: termsPrivacy.value,
      termsMarketingOptional: termsMarketing.value,
    })

    // 자동 로그인
    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    step.value = 'done'
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    errorMessage.value = err.response?.data?.message ?? '회원가입에 실패했어요. 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

function goToOnboarding() {
  router.push('/onboarding')
}
</script>

<template>
  <div
    class="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1440px] flex-col items-center px-12 pt-10"
  >
    <!-- 헤더 -->
    <h1 class="text-[32px] font-bold text-text">회원가입</h1>
    <p class="mt-2 text-sm text-text-secondary">
      계정을 만든 뒤 관심 토픽·기술·희망 역할을 설정합니다.
    </p>

    <!-- ═══ Step 1: 이메일 인증 ═══ -->
    <transition name="fade-in-up" mode="out-in">
      <div
        v-if="step === 'verify'"
        key="verify"
        class="mt-8 w-full max-w-[700px] rounded-xl border border-border bg-white p-8"
      >
        <h2 class="text-lg font-bold text-text">이메일 인증</h2>

        <!-- 이메일 입력 + 중복 확인 -->
        <label class="mt-6 block text-[13px] text-text-secondary">이메일</label>
        <div class="mt-2 flex gap-3">
          <input
            v-model="email"
            type="email"
            placeholder="name@example.com"
            :disabled="emailChecked"
            class="h-12 flex-1 rounded-lg border border-border px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none disabled:bg-bg-muted"
          />
          <button
            type="button"
            :disabled="emailChecked"
            class="h-12 shrink-0 rounded-full border border-border px-5 text-sm font-bold text-text disabled:opacity-50"
            @click="handleCheckEmail"
          >
            {{ emailChecked ? '확인 완료' : '중복 확인' }}
          </button>
        </div>
        <p v-if="emailError" class="mt-2 text-[13px] text-[#d43f21]">{{ emailError }}</p>

        <!-- 인증 코드 -->
        <transition name="fade-in-up">
          <div v-if="emailChecked" class="mt-5">
            <div class="flex items-end gap-3">
              <div class="flex-1">
                <label class="block text-[13px] text-text-secondary">인증 코드</label>
                <input
                  v-model="verificationCode"
                  type="text"
                  maxlength="6"
                  placeholder="6자리 코드 입력"
                  :disabled="codeVerified"
                  class="mt-2 h-12 w-full rounded-lg border border-border px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none disabled:bg-bg-muted"
                />
              </div>
              <button
                v-if="!codeSent"
                type="button"
                :disabled="codeSending"
                class="h-12 shrink-0 rounded-full bg-text px-5 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-60"
                @click="handleSendCode"
              >
                <span v-if="codeSending" class="flex items-center gap-2">
                  <span
                    class="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  />
                  발송 중
                </span>
                <span v-else>인증 코드 발송</span>
              </button>
              <button
                v-else-if="!codeVerified"
                type="button"
                class="h-12 shrink-0 rounded-full bg-text px-5 text-sm font-bold text-white transition-transform hover:scale-105"
                @click="handleConfirmCode"
              >
                확인
              </button>
              <span v-else class="flex h-12 items-center text-sm font-bold text-primary-dark">
                ✓ 인증 완료
              </span>
            </div>
            <!-- 발송 성공 토스트 -->
            <transition name="fade-in-up">
              <p v-if="codeSentAnim" class="mt-2 text-[13px] font-bold text-text">
                ✓ 인증 코드를 발송했어요. 이메일을 확인해 주세요.
              </p>
            </transition>
            <p v-if="codeError" class="mt-2 text-[13px] text-[#d43f21]">{{ codeError }}</p>
            <button
              v-if="codeSent && !codeVerified"
              type="button"
              class="mt-2 text-[13px] text-text-secondary hover:text-text"
              @click="handleSendCode"
            >
              코드 재발송
            </button>
          </div>
        </transition>
      </div>

      <!-- ═══ Step 2: 기본 정보 + 약관 ═══ -->
      <div
        v-else-if="step === 'form'"
        key="form"
        class="mt-8 w-full max-w-[700px] rounded-xl border border-border bg-white p-8"
      >
        <h2 class="text-lg font-bold text-text">기본 정보</h2>

        <form class="mt-6" @submit.prevent="handleSignUp">
          <!-- 닉네임 -->
          <label class="block text-[13px] text-text-secondary">닉네임</label>
          <div class="mt-2 flex gap-3">
            <input
              v-model="nickname"
              type="text"
              placeholder="2~15자"
              maxlength="15"
              :disabled="nicknameChecked"
              class="h-12 flex-1 rounded-lg border border-border px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none disabled:bg-bg-muted"
              @input="nicknameChecked = false"
            />
            <button
              type="button"
              :disabled="nicknameChecked || nicknameChecking"
              class="h-12 shrink-0 rounded-full border border-border px-5 text-sm font-bold text-text transition-all hover:scale-105 disabled:opacity-50"
              @click="handleCheckNickname"
            >
              <span v-if="nicknameChecking" class="flex items-center gap-2">
                <span
                  class="inline-block size-4 animate-spin rounded-full border-2 border-text border-t-transparent"
                />
                확인 중
              </span>
              <span v-else-if="nicknameChecked">✓ 사용 가능</span>
              <span v-else>중복 확인</span>
            </button>
          </div>
          <p v-if="nicknameError" class="mt-2 text-[13px] text-[#d43f21]">{{ nicknameError }}</p>
          <transition name="fade-in-up">
            <p v-if="nicknameChecked" class="mt-2 text-[13px] font-bold text-text">
              ✓ 사용 가능한 닉네임입니다.
            </p>
          </transition>

          <!-- 비밀번호 (닉네임 확인 후 표시) -->
          <transition name="fade-in-up">
            <div v-if="nicknameChecked" class="mt-5">
              <label class="block text-[13px] text-text-secondary">비밀번호</label>
              <input
                v-model="password"
                type="password"
                placeholder="영문·숫자 포함 8자 이상"
                class="mt-2 h-12 w-full rounded-lg border border-border px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
                @blur="validatePassword"
              />

              <label class="mt-5 block text-[13px] text-text-secondary">비밀번호 확인</label>
              <input
                v-model="passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                class="mt-2 h-12 w-full rounded-lg border border-border px-4 text-sm text-text placeholder:text-[#8d8d8d] focus:border-text focus:outline-none"
                @blur="validatePassword"
              />
              <p v-if="passwordError" class="mt-2 text-[13px] text-[#d43f21]">
                {{ passwordError }}
              </p>
            </div>
          </transition>

          <!-- 약관 동의 -->
          <h3 class="mt-8 text-base font-bold text-text">약관 동의</h3>

          <label
            class="mt-4 flex h-12 cursor-pointer items-center rounded-lg border border-border px-4"
          >
            <input v-model="termsService" type="checkbox" class="mr-3 size-4 accent-text" />
            <span class="text-sm text-text">
              <span class="font-bold text-[#d43f21]">[필수]</span> 서비스 이용약관 동의
            </span>
          </label>

          <label
            class="mt-3 flex h-12 cursor-pointer items-center rounded-lg border border-border px-4"
          >
            <input v-model="termsPrivacy" type="checkbox" class="mr-3 size-4 accent-text" />
            <span class="text-sm text-text">
              <span class="font-bold text-[#d43f21]">[필수]</span> 개인정보 처리방침 동의
            </span>
          </label>

          <label
            class="mt-3 flex h-12 cursor-pointer items-center rounded-lg border border-border px-4"
          >
            <input v-model="termsMarketing" type="checkbox" class="mr-3 size-4 accent-text" />
            <span class="text-sm text-text">
              <span class="text-text-secondary">[선택]</span> 프로젝트 추천 개선 정보 수신
            </span>
          </label>

          <!-- 에러 -->
          <p v-if="errorMessage" class="mt-4 text-[13px] text-[#d43f21]">{{ errorMessage }}</p>

          <!-- 가입 버튼 -->
          <button
            type="submit"
            :disabled="!canSubmit || submitting"
            class="mt-8 flex h-[46px] w-full items-center justify-center rounded-full bg-text text-sm font-bold text-white disabled:opacity-40"
          >
            {{ submitting ? '가입 처리 중...' : '회원가입' }}
          </button>
        </form>

        <p class="mt-4 text-[11px] text-text-secondary">
          이메일과 닉네임은 대소문자를 구분하지 않고 중복을 확인합니다.
        </p>
      </div>

      <!-- ═══ Step 3: 완료 ═══ -->
      <div
        v-else-if="step === 'done'"
        key="done"
        class="mt-8 flex w-full max-w-[700px] flex-col items-center rounded-xl border border-border bg-white py-16"
      >
        <div
          class="check-bounce flex size-[104px] items-center justify-center rounded-full bg-primary-dark"
        >
          <span class="text-4xl text-text">✓</span>
        </div>
        <h2 class="hero-animate hero-animate-delay-1 mt-6 text-2xl font-bold text-text">
          회원가입이 완료되었어요
        </h2>
        <p class="hero-animate hero-animate-delay-2 mt-3 text-sm text-text-secondary">
          추천에 필요한 관심 토픽과 기술, 희망 역할을 설정합니다.
        </p>
        <button
          class="hero-animate hero-animate-delay-3 mt-8 flex h-[46px] items-center justify-center rounded-full bg-text px-8 text-sm font-bold text-white transition-transform hover:scale-105"
          @click="goToOnboarding"
        >
          온보딩 시작
        </button>
      </div>
    </transition>
  </div>
</template>
