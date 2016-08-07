module.exports = function (content) {
  var SPLIT = content.indexOf('---\n')
  if (SPLIT === 0) {
    content = content.slice(4)
    SPLIT = content.indexOf('---\n', 4)
  }
  content = content.slice(SPLIT + 4)
  return content
}
