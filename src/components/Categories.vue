<template>
  <div class="categories">
    <template v-if="!$loadingRouteData">
    <h1 class="ui teal huge header">Reverland's Playground</h1>
    <h2 class="ui grey small header">// console.log(/all gone/)</h2>

    <div class="ui labels">
      <a class="ui label" 
        v-for="(category, posts) of categories" 
        :class="{'teal': category == categorySelected}"
        @click="select(category)">{{ category }} <span class="detail">{{ posts.length }}</span></a>
    </div>

    <div class="ui cards">
      <div class="ui card" v-for="post in categories[categorySelected]">
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
          <a v-for="tag in post.tags" class="ui tag label" v-link="{path: '/tags', query: { tag: tag} }">
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
function extractCategories (posts) {
  let categories = {}
  for (let post of posts) {
    if (!(post.category in categories)) {
      categories[post.category] = []
    }
    categories[post.category].push(post)
  }
  return categories
}

export default {
  data () {
    return {
      // note: changing this line won't causes changes
      // with hot-reload because the reloaded component
      // preserves its current state and we are modifying
      // its initial state.
      categories: [],
      categorySelected: ''
    }
  },
  methods: {
    select (category) {
      this.$router.go({
        path: '/categories',
        query: {
          category
        }
      })
    }
  },
  route: {
    data (transition) {
      let category = transition.to.query.category
      require.ensure('../posts/meta.json', (require) => {
        let posts = require('../posts/meta.json')
        let categories = extractCategories(posts)
        if (!category) {
          category = Object.keys(categories)[0]
        }
        transition.next({
          categories,
          categorySelected: category
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
</style>
