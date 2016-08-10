import 'babel-polyfill'
import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './App'
import Archives from './components/Archives'
import Post from './components/Post'
import Home from './components/Home'
import Categories from './components/Categories'
import Tags from './components/Tags'

Vue.use(VueRouter)

let router = new VueRouter({
  hashbang: false,
  history: true,
  linkActiveClass: 'active'
})

router.map({
  '/': {
    component: App,
    subRoutes: {
      '/home': {
        component: Home
      },
      '/categories': {
        component: Categories
      },
      '/tags': {
        component: Tags
      },
      '/archives': {
        component: Archives
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
  '/': '/home'
})

router.start(Vue.extend({}), '#app')
