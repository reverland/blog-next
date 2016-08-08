<template>
  <div class="posts">
    <div v-if="!$loadingRouteData" class="heading">
      <h1>{{ title }}</h1>
      <div class="small">发表于:{{year}}-{{month}}-{{day}}</div>
    </div>
    <div v-if="!$loadingRouteData" class="contents">
      {{{ content }}}
    </div>
    <div v-if="$loadingRouteData">Loading...</div>
  </div>
</template>

<script>
import marked from 'marked'

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
})

export default {
  data () {
    return {
      content: '<h1>loading...</h1>',
      year: '',
      month: '',
      day: '',
      title: ''
    }
  },
  route: {
    data (transition) {
      let year = transition.to.params.year
      let month = transition.to.params.month
      let day = transition.to.params.day
      let title = transition.to.params.title
      let fileName = `${year}-${month}-${day}-` + (title ? String(title) : '')
      require('../posts/' + fileName + '.md')((exports) => {
        transition.next({
          content: marked(exports.rawContent),
          year: year,
          month: month,
          day: day,
          title: exports.metaData.title
        })
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
