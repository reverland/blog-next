<template>
  <div id="app">
    <div class="logo">Reverland's Playground</div>
    <div class="subLogo">// console.log(/all gone/)</div>
    <router-view></router-view>
    <p>
      @copyright 2011-2016 | reverland built with [vue] and [webpack]
    </p>
  </div>
</template>

<script>
export default {
}
</script>

<style>
.logo {
  color: steelblue;
  font-size: 2rem;
}
.subLogo {
  color: lightgray;
  padding-left: 4em;
  font-size: 1.3rem;
}
</style>
