require('shelljs/global')
var path = require('path')
var fs = require('fs')
var yaml = require('js-yaml')

// PostPlugin.js
var reg = /^(-{3,}|;{3,})\n([\s\S]+?)\n\1(?:$|\n([\s\S]*)$)/

function PostPlugin(options) {
  // Configure your plugin with options...
}

PostPlugin.prototype.apply = function(compiler) {
  compiler.plugin("environment", function() {
    generateMetaData()
  });
};

function generateMetaData() {
  console.log('generate meta data\n')
  var postsPath = path.resolve(__dirname, '../src/posts')
  var postsMetaList = []
  ls(path.resolve(postsPath, '*.md')).forEach(function (post) {
    var metaData
    var content = cat(post)
    var match = reg.exec(content)
    if (match) {
      var yfm = match[2]
      try {
        metaData = yaml.load(yfm)
        metaData._title = path.basename(post, '.md').slice(11)
        metaData.year = path.basename(post, '.md').slice(0, 4)
        metaData.month = path.basename(post, '.md').slice(5, 7)
        metaData.day = path.basename(post, '.md').slice(8, 10)
      } catch (e) {
        console.log(post)
      }
      postsMetaList.unshift(metaData)
    }
  })
  fs.writeFileSync(path.resolve(__dirname, '../src/posts/meta.json'), JSON.stringify(postsMetaList))
  console.log('generate meta finished\n')
}

module.exports = PostPlugin; 
