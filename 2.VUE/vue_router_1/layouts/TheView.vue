<template>
  <!-- 

    / -> HomeView.vue
    /about -> AboutView.vue
  -->
  <main>
    <div class="container py-4">
      <h2>Hello Vue3</h2>

      <!-- 
        지원하는 내장 컴포넌트 : RouterView
        얘를 통해서 렌더링한다.
        그리고 RouterView가 빨간색인 이유 : 전역변수 선언이 아니어서
      -->
      <RouterView></RouterView>
    </div>
  </main>
</template>

<script setup></script>

<style lang="scss" scoped></style>
