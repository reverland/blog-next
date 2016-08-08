<template>
  <div class="postsList">
    <h1 class="ui teal huge header">Reverland's Playground</h1>
    <h2 class="ui grey small header right">// console.log(/all gone/)</h2>
    <div class="ui cards">
      <div class="ui card" v-for="post in posts">
        <!--a class="ui image" v-link="{
          path: '/' + post.category + '/' + post.year + '/' + post.month + '/' + post.day + '/' + (post._title ? post._title + '/' : '')
        }">
          <img :src="'http://lorempixel.com/400/200?' + Math.random()">
        </a-->
        <div class="content">
          <a class="header" v-link="{
            path: '/' + post.category + '/' + post.year + '/' + post.month + '/' + post.day + '/' + (post._title ? post._title + '/' : '')
          }">
            {{post.title}}
          </a>
          <div class="meta">
            <span>
              {{ post.year }}-{{ post.month }}-{{ post.day }}
            </span>
            <i class="heartbeat icon"></i>
            <a>
              {{ post.category }}
            </a>
          </div>
          <div class="description">
            <span>
              {{ post.excerpt }}
            </span>
          </div>
        </div>
        <div class="extra content">
          <a v-for="tag in post.tags" class="ui tag label">
            {{ tag }}
          </a>
        </div>
      </div> 
    </div>
  </div>
</template>

<script>
let posts = []
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
    require.ensure('../posts/meta.json', (require) => {
      posts = require('../posts/meta.json')
      this.posts = posts
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
ul, li {
  font-size: 1rem;
}

ul {
  list-style: none;
}

li {
  margin-left: 0;
}
</style>
