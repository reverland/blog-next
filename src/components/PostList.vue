<template>
  <div class="postsList">
    <ul>
      <li v-for="post in posts">
        <a v-link="{
          path: '/' + post.category + '/' + post.year + '/' + post.month + '/' + post.day + '/' + (post._title ? post._title + '/' : '')
        }">
          {{post.title}}
        </a>
         | 
        <span>
          {{ post.year }}-{{ post.month }}-{{ post.day }}
        </span>
      </li> 
    </ul>
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
  ready () {
    require.ensure('../posts/meta.json', (require) => {
      this.posts = require('../posts/meta.json')
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
