<template>
  <div class="postsList">
    <template v-if="!$loadingRouteData">
    <h1 class="ui teal huge header">Reverland's Playground</h1>
    <h2 class="ui grey small header">// console.log(/all gone/)</h2>

    <div class="ui labels">
      <a class="ui label" 
        v-for="keyvalue of archives" 
        :class="{'teal': keyvalue[0] == yearSelected}"
        @click="select(keyvalue[0])">{{ keyvalue[0] }} <span class="detail">{{ keyvalue[1].length }}</span></a>
    </div>

    <div class="ui cards">
      <div class="ui card" v-for="post in yearArchive">
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
function extractArchives (posts) {
  let archives = {}
  for (let post of posts) {
    if (!(post.year in archives)) {
      archives[post.year] = []
    }
    archives[post.year].push(post)
  }
  let ret = []
  for (let year in archives) {
    ret.push([year, archives[year]])
  }
  ret.sort((a, b) => parseInt(b[0]) > parseInt(a[0]) ? 1 : -1)
  return ret
}

export default {
  data () {
    return {
      // note: changing this line won't causes changes
      // with hot-reload because the reloaded component
      // preserves its current state and we are modifying
      // its initial state.
      archives: [],
      yearSelected: ''
    }
  },
  methods: {
    select (year) {
      this.$router.go({
        path: '/archives',
        query: {
          year
        }
      })
    }
  },
  computed: {
    yearArchive () {
      let archive = this.archives.find((keyvalue) => keyvalue[0] === this.yearSelected)
      if (archive) {
        return archive[1]
      } else {
        return []
      }
    }
  },
  route: {
    data (transition) {
      let year = transition.to.query.year
      require.ensure('../posts/meta.json', (require) => {
        let posts = require('../posts/meta.json')
        let archives = extractArchives(posts)
        if (!year) {
          year = archives[0][0]
        }
        transition.next({
          archives,
          yearSelected: year
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
