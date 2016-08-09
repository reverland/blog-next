<template>
  <div class="tags">
    <template v-if="!$loadingRouteData">
    <h1 class="ui teal huge header">Reverland's Playground</h1>
    <h2 class="ui grey small header">// console.log(/all gone/)</h2>

    <div class="ui labels">
      <a class="ui label" 
        v-for="(tag, posts) of tags" 
        :class="{'teal': tag == tagSelected}"
        @click="select(tag)">{{ tag }} <span class="ui detail">{{ posts.length }}</span></a>
    </div>

    <div class="ui cards">
      <div class="ui card" v-for="post in tags[tagSelected]">
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
            <a v-link="{path: '/categories', query: { category: post.category } }">
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
          <a v-for="tag in post.tags" class="ui tag label" v-link="{path: '/tags', query: { tag: tag } }">
            {{ tag }}
          </a>
        </div>
      </div> 
    </div>
    </template>
    <div v-if="$loadingRouteData" class="ui myloading segment">
      <div class="ui active loader"></div>
    </div>
  </div>
</template>

<script>
function extractTags (posts) {
  let tags = {}
  for (let post of posts) {
    for (let tag of post.tags) {
      if (!(tag in tags)) {
        tags[tag] = []
      }
      tags[tag].push(post)
    }
  }
  return tags
}

export default {
  data () {
    return {
      // note: changing this line won't causes changes
      // with hot-reload because the reloaded component
      // preserves its current state and we are modifying
      // its initial state.
      tags: [],
      tagSelected: ''
    }
  },
  methods: {
    select (tag) {
      this.$router.go({
        path: '/tags',
        query: {
          tag
        }
      })
    }
  },
  route: {
    data (transition) {
      let tag = transition.to.query.tag
      require.ensure('../posts/meta.json', (require) => {
        let posts = require('../posts/meta.json')
        let tags = extractTags(posts)
        if (!tag) {
          tag = Object.keys(tags)[0]
        }
        transition.next({
          tags,
          tagSelected: tag
        })
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ui.segment.myloading {
  padding: 3em 0;
}

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
