<template>
  <div>
    <h2>Home View</h2>
    <p>{{ $route }}</p>
    <p>{{ $route.path }}</p>
    <p>{{ $route.name }}</p>
    <button class="btn btn-primary" @click="goAboutPage">About 으로 이동</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

// useRouter 함수를 통해 setup 안에서는 이렇게 사용한;다.
const router = useRouter()

const goAboutPage = () => {
  router.push('/about')
}
</script>

<style lang="scss" scoped></style>
