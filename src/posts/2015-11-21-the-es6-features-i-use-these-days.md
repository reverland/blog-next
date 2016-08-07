---
layout: post
title: "The ES6 Features I Use These Days"
excerpt: ""
category: javascript
tags: [javascript, ES2015]
disqus: true
---

## ES6

ES6标准，也称ES2015。在2015年6月正式批准，这是javascript语言标准从2009年首次大版本更新。

这个版本带来了很多新东西，说是新东西，估计基本读者也都见过。比如python中常用的Destructuring assignment、模块导入、generator和map与set，java中的WeakHashMap、Proxy，在coffeescript中常用的class关键字与子类、模板字符串和剩余参数与默认参数等等。处处都已经有了ES6的影子。

最近做了几件事：

1.  把nltk中wordnet corpus reader的python代码看了看，依葫芦画瓢画了个纯javascript版。
2.  热情地把[Eloquent Javascript](http://eloquentjavascript.net/)的项目和练习复习一遍，然后继续接着往下看。

对此，有了两个新认识：

1.  Python是门强大的语言。特别是前几天在python中看到async关键字之后…
2.  javascript是门强大的语言但并不简单，ES6让它更强大也更好用更简单

这时候发现有几个地方用ES6特性非常方便。

本文不会解释这些特性是什么，所以，如果是查资料查到这里，略过吧。

## Generator

在[nltk wordnet corpus](https://github.com/nltk/nltk/blob/develop/nltk/corpus/reader/wordnet.py)中，对wordnet data文件进行逐行解析的时候，这样处理一行内容：

```python
_iter = iter(line.split())
_next_token = lambda: next(_iter)

try:

    # get the lemma and part-of-speech
    lemma = _next_token()
    pos = _next_token()
    # get the number of synsets for this lemma
    n_synsets = int(_next_token())
```

显然，对每一行，首先生成一个iterator，这个iterator返回这一行用空格分隔的每一个单词。好在ES6中也支持generator/iterator了，对应如下。

```javascript
let token = util.getIterator(line.split(/\s+/).filter(v=>v!==''));
// or let token = line.split(/\s+/).filter(v=>v!=='')[Symbol.iterator]();
try {
  // lemma and pos
  lemma = token.next().value;
  pos = token.next().value;
  // get how many synsets for this lemma
  nSynsets = parseInt(token.next().value);
  assert(nSynsets > 0);
  ...
```

其中，`getIterator`定义为一个generator函数，调用这个函数则生成对应的generator，下面的`for...of`用到了[`array`对象本身就有一个generator函数](http://devdocs.io/javascript/global\_objects/symbol/iterator)的特性。

```javascript
util.getIterator = function *(array) {
  for (let value of array) {
    yield value;
  }
}
```

nltk中生成ngram的方法的js实现

```javascript
function *ngrams(sequence, n) {
  // Sadly, you cant use arrow function as generator here.
  let  g = (function *(sequence){yield *sequence})(sequence);

  let history = [];
  while (n > 1) {
    history.push(g.next().value);
    n--;
  }
  for (let item of g) {
    history.push(item);
    // look out here.
    // yield history; will yield reference.
    yield Array.from(history);
    history.shift();
  }
}
```

## Collections

当我尝试用js实现[matrix67几年前在其博客讲到的新词发现算法](http://www.matrix67.com/blog/archives/5044)时，需要把一个穷举一个序列的所有分割可能。我这样实现的。

```javascript
function splitSet(s) {
  function *_splitAll(s) {
    if (s.length == 0) {
      return;
    }
    yield s;
    for (let i = 1; i < s.length; i++) {
      let left = s.substr(0, i);
      let right = s.substr(i);
      for (let wl of _splitAll(left)) {
        for (let wr of _splitAll(right)) {
          yield wl + " " + wr;
        }
      }
    }
  }
  let set = [];
  for (let w of _splitAll(s)){
    set.push(w);
  }
  return set;
}
```

想得很好，通过将序列分为左右两部分递归简化处理。结果发现同一分割出现了多词。

```
> splitSet("abc")
[ 'abc', 'a bc', 'a b c', 'ab c', 'a b c' ]
```

相同的结果需要排除，这时候ES6中的`Set`就很方便了…

```javascript
let set = new Set();
for (let w of _splitAll(s)){
  set.add(w);
}
return set;
```

## Promise

事实上，任何能使用Promise+Generator的地方我都会用，当然ES7中有了async和await关键字。比如在[youdaodict Userscript](https://greasyfork.org/en/scripts/12758-youdaodict)中实现调用audio API来播放有道mp3音频文件[实现跨域发音的函数](stackoverflow.com/questions/28554022/how-can-i-play-sound-with-a-greasemonkey-script-in-firefox-when-theres-a-conte).

```javascript
function play(word) {
  //console.log("[DEBUG] PLAYOUND")

  function playSound(buffer) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
  }

  var context = new AudioContext()
  var soundUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${word}`
  var p = new Promise(function(resolve, reject) {
    var ret = GM_xmlhttpRequest({
      method: "GET",
      url: soundUrl,
      responseType: 'arraybuffer',
      onload: function(res) {
        try {
          context.decodeAudioData(res.response, function(buffer) {
            resolve(buffer);
          })
        } catch(e) {
          reject(e);
        }
      }
    });
  });
  p.then(playSound, function(e) {
    console.log(e);
  });
}
```

一般的观点是，凡是关系到异步返回值的时候，都应该尽量使用Promise，保证[回调只被执行一次、更好的错误处理、更明晰的流程结构](https://github.com/getify/You-Dont-Know-JS/blob/master/async%20&%20performance/ch3.md)。

Promise和Generator现在常作为将来ES7中`async/await`的过渡。比如著名的`co`模块，以下是一个简化`co`实现

```javascript
function co(g) {
  return function() {
    var it = g.apply(this, arguments);

    function handle(result) {
      if (result.done)
        return result.value;
      return result.value.then(function(res) {
        return handle(it.next(res))
      })
    }
    return handle(it.next())
  }
}
```

简单来说，就是对`generator`中每个`yield`出一个promise时，检查这个promise是否已经完成，
完成就返回值。没有就在该promise上注册回调让其把完成后的值传回`generator`并等待`generator`再返回下一个Promise。

好绕是不是?我跑题了抱歉。

## Template String

其实上面的例子已经用到这个特性了。再举个例子，Coffeescript中可以这样写正则：

```python
OPERATOR = /// ^ (
  ?: [-=]>             # function
   | [-+*/%<>&|^!?=]=  # compound assign / compare
   | >>>=?             # zero-fill right shift
   | ([-+:])\1         # doubles
   | ([&|<>])\2=?      # logic / shift
   | \?\.              # soak access
   | \.{2,3}           # range or splat
) ///
```


非常方便不是？虽然我开始是在[nltk](www.nltk.org/book/ch03.html)中看到了这个功能，

```python
text = 'That U.S.A. poster-print costs $12.40...'
pattern = r'''(?x)    # set flag to allow verbose regexps
    ([A-Z]\.)+        # abbreviations, e.g. U.S.A.
  | \w+(-\w+)*        # words with optional internal hyphens
  | \$?\d+(\.\d+)?%?  # currency and percentages, e.g. $12.40, 82%
  | \.\.\.            # ellipsis
  | [][.,;"'?():-_`]  # these are separate tokens;
'''
nltk.regexp_tokenize(text, pattern)
['That', 'U.S.A.', 'poster-print', 'costs', '$12.40', '...']
```

想了想如何在js中自己实现，忽然想到了template string这个特性。

```javascript
function r(strings) {
  let returnS;
  // remove all space;
  returnS = strings[0];
  let comment = /\/\/.*\n/g;
  returnS = returnS.replace(comment, "");
  returnS = returnS.replace(/\s+/g,"");
  return returnS;
}

r`
    ([A-Z]\.)+        // abbreviations, e.g. U.S.A.
  | \w+(-\w+)*        // words with optional internal hyphens
  | \$?\d+(\.\d+)?%?  // currency and percentages, e.g. $12.40, 82%
  | \.\.\.            // ellipsis
  | [][.,;"'?():-_\`] // these are separate tokens; includes ], [
`
```

这里用到了[Tagged template strings](http://devdocs.io/javascript/template_strings)的特性。

另外，如果是多行连续文本时也应该使用template string。

## class

从本质上讲，javascript中的所有面向对象机制都是建构在原型链上的，但class这种语法糖也能比较方便。在coffeescript中我觉得那种浓烈ruby风的写法更合心意一些，`class`关键字总有些不怎么顺手的地方，比如 _设置类静态变量_ 和有争议的 _mixin_ 。参照nltk wordnet corpus reader类的时候也简单实践了下class关键字、继承等的使用。简单使用还是挺顺手的。

```javascript
class Synset extends _WordNetObject {
  /* lemma.pos.number to get a synset */
  constructor() {
    super();
    // initialized by the Reader
    this._name = null;
    this._offset = null;
    this._lexname = null; // lexicographer file e.g. noun.animal
    this._pos = null;
    ...
```

## destructuring assign

这是，非常好用的语法糖。终于可以

```javascript
[a, b] = [1, 2];
```

## Spread Operator

各种语法糖，处理rest parameter时省心很多，而且返回的是一个真正的Array对象。比较有意思的一个例子是，有次见有人讨论如何把`Math.min`应用到数组上。他说到javascript高级程序设计上的例子：

```javascript
function min(array) {
  return Math.min.apply(Math, array);
}
```

认为应该把`this`绑定到`null`而不是`Math`，于是我才知道`apply`时还是要小心不要污染全局变量空间。。。不过这个例子，我去翻了下[v8的math.js](https://github.com/v8/v8/blob/44c44521ae11859478b42004f57ea93df52526ee/src/js/math.js#L110-135)和[spidermonkey的Math实现](https://github.com/ricardoquesada/Spidermonkey/blob/master/js/src/jsmath.cpp#L593-L616)，都不关this什么事，所以，我觉得，爱绑定啥都行。。。

关键在于，有了spread operator之后

```javascript
Math.min(...array);
```

就行了。这些类似的应用场景很多的，比如打印数组中每个成员

```javascript
console.log(...array);
```

少写多少代码：）

## Arrow Function

在前面的例子中你应该已经见到过，箭头函数让书写匿名函数(lambda)变得异常方便(少打很多字)，除了不能用箭头函数写一个generator这个设定有些意外。

```javascript
(v=>v+1)(3)
```

另外，箭头函数的this是提前绑定到所在词法作用域内的(和调用者无关、apply等指定的`this`都无关)，有兴趣的同学大概可以去看看v8和SpiderMonkey怎么实现的。

## Proxy

差点忘了这个，因为，目前，截至到本文发稿，v8并不支持标准中的新特性(`--harmony_proxies`开启的是已废弃的Proxy API)，所以node也不支持。firefox倒是支持非常好哈哈。

在python中，标准库中有个较`defaultdict`的东西。有什么作用看看下面的例子就知道了。事实上，nltk wordnet corpus reader生成映射的时候很依赖这个功能。

```
In [3]: from collections import defaultdict

In [4]: expanded_dict = defaultdict(dict)

In [5]: expanded_dict['a']['b'] = 1

In [6]: expanded_dict
Out[6]: defaultdict(<type 'dict'>, {'a': {'b': 1}})

In [7]: dict['a']['b']
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-7-07dd2e624242> in <module>()
----> 1 dict['a']['b']

TypeError: 'type' object has no attribute '__getitem__'
```

显然我们不想让不存在的东西报错，我们也不想每次都写个if语句判断是吧。

```python
if not dct['a']:
    dct['a'] = {}
dct['a']['b'] = 1
```

如果你知道`dct`中有哪些键当然也能全首先赋成字典，但是，很多情况下你并不知道有哪些键，还得依靠if来判断。`defaultdict`优雅的解决了这个问题。

遗憾的是，javascript中没有这种东西。忽然想到了[ES6 in Depth: Proxies](https://hacks.mozilla.org/2015/07/es6-in-depth-proxies-and-reflect/)中的例子，想到可以依靠这个特性自己实现一个`defaultdict`。

```javascript
function Defaultdict() {
  handler = {
    get: function (target, prop, receiver) {
      if (!(prop in target)) {
        target[prop] = {};
      }
      return target[prop];
    }
  }
  var p = new Proxy(this, handler);
  return p;
}

let expandedDct = new Defaultdict();
expandedDct.a.b = 1;
expandedDct.c.d = 2;
console.log(expandedDct.a.b)
console.log(Object.keys(expandedDct));
```

目前只有firefox支持标准的Proxy API。当然V8/node中可以polyfill出来，请自行github。

用`Proxy`可以结合`Map`来实现`Map`版本的DefaultMap哈哈。

<p style="color:red;">PS: 浏览器调试工具会调用一些方法。比如，你新建一个`expandedDct`之后，如果在firebug中想用`.`来查看变量，会对其调用很多方法。。。结果就是`expandedDct`多了很多firebug探查对象属性用到的函数名。。。我在这个问题上纠结了几乎两个小时没明白为啥多了这些奇怪的键而且一会儿有一会儿没。切切注意！！</p>

```javascript
> Object.keys(expandedDct)
["a", "c", "length", "fullPath", "fileSize", "header", "body", "getSourceLink"]
```

## 总结

以上，就是最近感觉比较有意思的一些ES6特性，就这样吧。

Have fun！
