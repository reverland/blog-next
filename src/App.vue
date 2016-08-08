<template>
  <div id="app" class="ui container">
    <div class="ui large secondary teal pointing menu">
      <a class="item" v-link="{path: '/home'}">Home</a>
      <a class="item" v-link="{path: '/archives'}">Archives</a>
      <a class="item" v-link="{path: '/categories'}">Categories</a>
      <a class="item" v-link="{path: '/tags'}">Tags</a>
      <div class="right item">
        <a class="ui inverted button">RSS</a>
      </div>
    </div>
    <router-view></router-view>
    <div class="ui center aligned container">
      <div class="ui segment">
        <p>
          copyleft＠2011-2016
        </p>
        <p>reverland built with <a href="https://vuejs.org">vue</a> and <a href="http://webpack.github.io/">webpack</a></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
}
</script>

<style lang="less">
@charset 'utf-8';
@import './semantic-ui/semantic.less';
.ui.center.aligned.container {
  margin-top: 1rem;
}
</style>
