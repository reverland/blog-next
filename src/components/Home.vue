<template>
  <div class="home">
    <div class="ui piled segments">
      <div class="ui clearing segment">
        <h1 class="ui teal huge header">Reverland's Playground</h1>
        <code class="ui grey small right floated header">// console.log(/all gone/)</code>
      </div>
      <div class="ui centered card">
        <div class="image">
          <img :src="'http://lorempixel.com/400/200?' + Math.random()">
        </div>
        <div class="content">
          <a class="header">Reverland</a>
          <div class="meta">
            <span class="date">Blog since 2012</span>
          </div>
          <div class="description">
            Reverland is a web front-end developer working for
            <a href="https://chaitin.cn">Chaitin.Inc</a>
          </div>
        </div>
        <div class="extra content">
          <a href="/">
            <i class="bug icon"></i>
            x = x => x(x)
          </a>
        </div> 
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      // note: changing this line won't causes changes
      // with hot-reload because the reloaded component
      // preserves its current state and we are modifying
      // its initial state.
      posts: []
    }
  },
  methods: {
  },
  ready () {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ui.segment {
  max-width: 400px;
  margin: auto;
}
.ui.piled.segments {
  padding-bottom: 4em;
}
</style>
