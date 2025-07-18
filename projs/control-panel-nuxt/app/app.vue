<template>
  <div>
    <h1>NestAPI returned:</h1>
    <p>
      {{result}}
    </p>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>


<script setup lang="ts">

const result = await useFetch<{ message: string }>(
  'http://localhost:3001/'
)
</script>