import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './App'
import PostList from './components/PostList'
import Post from './components/Post'

Vue.use(VueRouter)

let router = new VueRouter({
  hashbang: false,
  history: true
})

router.map({
  '/': {
    component: App,
    subRoutes: {
      '/archives': {
        component: PostList
      },
      '/:category/:year/:month/:day/:title/': {
        component: Post
      },
      '/:category/:year/:month/:day/': {
        component: Post
      }
    }
  }
})
router.redirect({
  '/': '/archives'
})

router.start(Vue.extend({}), '#app')
