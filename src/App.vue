<template>
  <div class="ui container">
    <div class="ui large secondary teal pointing menu" :class="{'stackable': show}">
      <a class="toc item">
        <i class="sidebar icon" @click="toggle"></i>
      </a>
      <a class="item" v-link="{path: '/home'}">Home</a>
      <a class="item" v-link="{path: '/archives'}">Archives</a>
      <a class="item" v-link="{path: '/categories'}">Categories</a>
      <a class="item" v-link="{path: '/tags'}">Tags</a>
      <a class="item" href="/atom.xml">RSS</a>
    </div>
    <router-view></router-view>
    <div class="ui center aligned segment">
      <p>
        copyleft＠2011-2016
      </p>
      <p>reverland built with <a href="https://vuejs.org">vue</a> and <a href="http://webpack.github.io/">webpack</a></p>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      show: false
    }
  },
  methods: {
    toggle () {
      this.show = !this.show
    }
  }
}
</script>

<style lang="less">
@import './semantic-ui/semantic.less';
.ui.center.aligned.container {
  margin-top: 1rem;
}

.secondary.pointing.menu .toc.item {
  display: none;
}

@media only screen and (max-width: 767px) {
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
  .ui.stackable.fixed.menu {
    display: flex;
  }
  .secondary.stackable.pointing.menu .item,
  .secondary.stackable.pointing.menu .menu {
    display: block;
  }
}
</style>
