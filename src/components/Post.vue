<template>
  <div class="posts">
    {{{ content }}}
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
      content: '<h1>loading...</h1>'
    }
  },
  route: {
    data (transition) {
      let year = transition.to.params.year
      let month = transition.to.params.month
      let day = transition.to.params.day
      let title = transition.to.params.title
      let fileName = `${year}-${month}-${day}-` + (title ? String(title) : '')
      require('../posts/' + fileName + '.md')((content) => {
        this.content = marked(content)
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
