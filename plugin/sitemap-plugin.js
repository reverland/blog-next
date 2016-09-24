require('shelljs/global')
var path = require('path')
var fs = require('fs')
var yaml = require('js-yaml')
var marked = require('marked')

// SitemapPlugin.js
var reg = /^(-{3,}|;{3,})\n([\s\S]+?)\n\1(?:$|\n([\s\S]*)$)/

function SitemapPlugin(options) {
  // Configure your plugin with options...
}

SitemapPlugin.prototype.apply = function(compiler) {
  compiler.plugin("emit", function(compilation, callback) {
    compilation.sitemaps = []
    generateFeedData(compilation.sitemaps)
    callback()
  });
};

function generateFeedData(sitemaps) {
  console.log('generate sitemap data\n')
  var postsPath = path.resolve(__dirname, '../src/posts')
  ls(path.resolve(postsPath, '*.md')).forEach(function (post) {
    var metaData
    var _summary
    var content = cat(post)
    var match = reg.exec(content)
    if (match) {
      var yfm = match[2]
      var url = ''
      try {
        metaData = yaml.load(yfm)
        _summary = match[3].slice(0, 140) + '...'
        var _title = path.basename(post, '.md').slice(11)
        var year = path.basename(post, '.md').slice(0, 4)
        var month = path.basename(post, '.md').slice(5, 7)
        var day = path.basename(post, '.md').slice(8, 10)
        url = year + '/' +  month + '/' + day + (_title ? ('/' + _title + '/') : '/')
      } catch (e) {
        console.log(post)
        console.log(e)
      }
      sitemaps.push(url)
    }
  })
  console.log('generate sitemap finished\n')
}

module.exports = SitemapPlugin; 
