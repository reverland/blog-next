require('shelljs/global')
var path = require('path')
var fs = require('fs')
var yaml = require('js-yaml')
var marked = require('marked')

// FeedPlugin.js
var reg = /^(-{3,}|;{3,})\n([\s\S]+?)\n\1(?:$|\n([\s\S]*)$)/

function FeedPlugin(options) {
  // Configure your plugin with options...
}

FeedPlugin.prototype.apply = function(compiler) {
  compiler.plugin("emit", function(compilation, callback) {
    compilation.feed = []
    generateFeedData(compilation.feed, 5)
    callback()
  });
};

function generateFeedData(feeds, n) {
  console.log('generate feed data\n')
  var postsPath = path.resolve(__dirname, '../src/posts')
  ls(path.resolve(postsPath, '*.md')).reverse().slice(0, n).forEach(function (post) {
    var metaData
    var _summary
    var content = cat(post)
    var match = reg.exec(content)
    if (match) {
      var yfm = match[2]
      var feed = {}
      try {
        metaData = yaml.load(yfm)
        _summary = match[3].slice(0, 140) + '...'
        var _title = path.basename(post, '.md').slice(11)
        var year = path.basename(post, '.md').slice(0, 4)
        var month = path.basename(post, '.md').slice(5, 7)
        var day = path.basename(post, '.md').slice(8, 10)
        var category = metaData.category
        feed.title = metaData.title
        feed.path = '/' + category + '/' + year + '/' +  month + '/' + day + (_title ? ('/' + _title + '/') : '/')
        feed.date = new Date(year, month, day)
        feed.updated = new Date(year, month, day)
        feed.excerpt = metaData.excerpt
        feed.content = marked(_summary)
        feed.category = category
        feed.tags = metaData.tags
      } catch (e) {
        console.log(post)
        console.log(e)
      }
      feeds.push(feed)
    }
  })
  console.log('generate feed finished\n')
}

module.exports = FeedPlugin; 
