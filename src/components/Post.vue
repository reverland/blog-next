<template>
  <div class="posts ui raised segments">
    <template v-if="!$loadingRouteData">
    <div class="title ui ribbon label">
      <h1>{{ title }}</h1>
      <div class="small"><i class="history icon"></i>{{year}}-{{month}}-{{day}}</div>
    </div>
    <div class="ui segment">
      {{{ content }}}
    </div>
    <div class="ui segment">
      <disqus :shortname="shortname"></disqus>
    </div>
    </template>
    <div v-if="$loadingRouteData" class="load ui segment">
      <div class="ui active loader"></div>
    </div>
  </div>
</template>

<script>
import marked from 'marked'
import Disqus from 'vue-disqus'

let renderer = new marked.Renderer()

renderer.heading = function (text, level) {
  return `<h${level} class="ui dividing header">${text}</h${level}>`
}

renderer.image = function (href, title, text) {
  return `<img class="ui image" src="${href}" alt="${text}" >`
}

marked.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: function (code, lang) {
    return require('highlight.js').highlightAuto(code, [lang]).value
  }
})

export default {
  components: {
    Disqus
  },
  data () {
    return {
      content: '<h1>loading...</h1>',
      year: '',
      month: '',
      day: '',
      title: '',
      shortname: process.env.SHORT_NAME
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
  },
  watch: {
    title (nVal, oVal) {
      let title = document.getElementsByTagName('title')[0]
      title.textContent = nVal
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.load.segment {
  padding: 3em 0;
}

@media (max-width: 600px) {
  .title {
    min-width: calc(100% + 3.2em) !important;
  }
}
</style>
