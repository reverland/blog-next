<template>
  <div id="app" class="ui container">
    <div class="ui large secondary teal pointing menu">
      <a class="toc item">
        <i class="sidebar icon"></i>
      </a>
      <a class="active item">Home</a>
      <a class="item">Archives</a>
      <a class="item">Categories</a>
      <a class="item">Tags</a>
      <div class="right item">
        <a class="ui inverted button">RSS</a>
      </div>
    </div>
    <router-view></router-view>
    <p class="">
      @copyright 2011-2016 | reverland built with [vue] and [webpack]
    </p>
  </div>
</template>

<script>
export default {
}
</script>

<style lang="less">
@import './semantic-ui/semantic.less';

.secondary.pointing.menu .toc.item {
  display: none;
}

@media only screen and (max-width: 700px) {
  .ui.fixed.menu {
    display: none !important;
  }
  .secondary.pointing.menu .item,
  .secondary.pointing.menu .menu {
    display: none;
  }
  .secondary.pointing.menu .toc.item {
    display: block;
  }
}
</style>
