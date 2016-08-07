---
layout: post
title: "javascript模块机制原理"
excerpt: "eloquent javascript笔记等"
category: javascript
tags: [javascript]
disqus: true
---


eloquent javascript是一本浸润着黑客精神和文化的书，上一次看到这样的书还是在三年前，那本书叫land of lisp。

这是关于eloquent js第十章，模块化的一些解释。因为我觉得这部分不好理解。

## js模块化基础

我们写代码时，代码总是倾向于越来越像浆糊，越是大的全的功能，越是浆糊到不堪。我们想要看清楚些，就把不同功能分出来，揉成一堆小浆糊，这总比一大团浆糊好处理。

当我们想把一团js浆糊放到一起时，并称之模块时，我们会设计让它提供几个功能，这个一般叫做接口。比如`console`模块有个`log`功能，比如等等。

我们可以把这堆浆糊扔到一个全局变量中去，这样其它部分要是想要使用这团浆糊的功能，就使用浆糊提供的接口。比如`Math.PI`可以访问得到3.14159......。

这很简单，js提供了函数来隔离命名空间，对象来放置模块内容。

```javascript
var mod1 = function mod1(){
    var i = 3;
    function print(x){
        console.log(x+i);
    }
    return {a:1,
            b:print
    };
}()
```

为啥要这样写呢，因为，假如我们不想让人看到局部变量`i`，函数是我们唯一能借以创建局部作用域的东西。

这就是javascript模块化的基础。

这样，我们想调用某个模块时，就把某个函数包裹着的东西给全局变量，调用者对这个全局变量进行操作就好。

`return`的时候写一大堆对象内容也不合适，我们可以选择传进去个对象。

```javascript
var mod2 = {};
(function(exports){
    var i = 3;
    exports.a = i;
    exports.b = function print(x){
        console.log(x+i);
    };
}(mod2))
```

但是。。。

当这所有都得需要在全局作用域内进行。

1. 想想当我们要两个模块a和b都被c依赖，a依赖c0.1版而b依赖c0.2版，a和b中调用名字为c的模块。。。

2. 或者a依赖b然后c依赖d，然而b在a中命名为xx，d在c中也命名为xx。

所以，最好不通过全局作用域实现模块依赖。

但实际上可以做到不需要全局作用域来实现模块的依赖.接下来讨论两种常见的方案。

## 向CommonJS跃进

写过node程序的人都见过类似的东西

```javascript
var mod3 = require("mod3");
```

在该模块中通过require函数引入模块，并通过变量mod3引用这个模块。不需要通过全局变量，该模块高明地引用了其它模块。

require实现方式如下， 通过`Function`构造函数构造函数实现命名空间, 假设我们有个read函数。

```javascript
function require(modName) {
    var code = new Function("exports", read(modName));
    var exports = {};
    code(exports);
    return exports;
}
```

这样做，每次载入都会运行模块，即使有多个模块载入一个名字的模块也会运行多次。
我们加个全局变量保存已经加载的模块。

```javascript
require.cache = Object.create(null);
function require(modName) {
    if (modName in require.cache) {
        return require.cache[modName];
    }
    var code = new Function("exports", read(modName));
    var exports = {};
    code(exports);
    require.cache[modName] = exports;
    return exports;
}
```

在比如你想暴露个和exports对象不同的东西，比如我他妈的只想导出个函数呢，比如

```javascript
var fn = require('fn');
console.log(fn);    //-> 1
```

我们可以通过额外给模块传递一个叫module的参数，这个参数`exports`属性默认指向`exports`对象实现这点。

```javascript
require.cache = Object.create(null);
function require(modName) {
    if (modName in require.cache) {
        return require.cache[modName];
    }
    var code = new Function("exports, module", read(modName));
    var exports = {};
    var module = {exports: exports};
    code(exports, module);
    require.cache[modName] = module.exports;
    return module.exports;
}
```

当模块`fn`想返回比如1时

```javascript
module.exports = 1;
```

这样，我们就实现了简单的nodejs模块系统：）Coooooooooooooooool

这有个啥问题呢？浏览器中的js程序执行时，浏览器啥也干不了= =。

read函数没读到模块内容之前，js程序一直执行，但除了等待什么都不干。假如这个read是从网络上读取模块文件，那么万一网络质量很差，这个系统都把大部分时间花在等文件加载上了。

为了解决这个问题，有人发明了[browserify](http://browserify.org/).这，看做一个依赖打包服务吧。

另一种方案是：

## AMD

这里的AMD不是AMD芯片的AMD，全称叫Asynchronous Module Definition。异步模块定义模块系统。

这个系统的核心，是一个叫做define的函数。

每个模块都必须这样写：

```javascript
define(["dep1", "dep2"], function(dep1, dep2) {
    return dep1.a + dep2.b;
})
```

假如不依赖其它模块

```javascript
define([], function() {
    var mod = {a: 1, b: function(){console.log("sb")}};
    return mod;
})
```

这个核心的define函数这么设计，

```javascript
function define(depNames, moduleFunction) {
    //对每个depNames中的依赖，安排异步下载
    //当下载都完成时，执行moduleFunction, 同时把模块接口传给它
    //改变其状态，通知调用者
}
```

我们要实现这个递归的过程，需要一个对象来表示其状态和存放调用者的函数

```javascript
var defineCache = Object.create(null);
// 指向当前模块的指针
var currentMod = null;
function getModule(name) {
    //如果已经加载过了就返回
    if (name in defineCache)
        return defineCache[name];
    // 否则先返回一个对象
    // 等模块真正下载完后更新currentMod变量，
    // 同时递归执行调用子模块的define函数
    var module = {exports: null,
        loaded: false,
        onLoad: []};
    defineCache[name] = module;
    // 我们假设有这么个异步读取文件的函数
    backgroundReadFile(name, function(code) {
            currentMod = module;
            new Function("", code)();// code会是又一个define函数调用
            });
    return module;
}
function define(depNames, moduleFunction) {
    //对每个depNames中的依赖，安排异步下载
    //当下载都完成时，执行moduleFunction, 同时把模块接口传给它
    //改变其状态，通知调用者
    var myMod = currentMod;
    var deps = depNames.map(getModule);

    deps.forEach(function(mod) {
            if (!mod.loaded)
            // 如果模块还没加载把父模块的whenDepsLoaded保存
            // 留待该模块完成以后调用
            mod.onLoad.push(whenDepsLoaded);
            });

    function whenDepsLoaded() {
        //如果依赖没有全加载好，值得一提的是[].every总是返回真
        if (!deps.every(function(m) { return m.loaded; }))
            return;
        // 如果依赖都下载完成，如果deps为[]，args=[]
        var args = deps.map(function(m) { return m.exports; });
        var exports = moduleFunction.apply(null, args);
        if (myMod) {    //对当前模块对象进行更新
            myMod.exports = exports;
            // 更新当前模块状态
            myMod.loaded = true;
            //当前模块完成时都会调用一次依赖它的模块们的whenDepsLoaded函数
            myMod.onLoad.forEach(function(f) { f(); });
        }
    }
    whenDepsLoaded();
}
```

结果就是:

1. 首先调用顶级define，define中所有依赖调用getModule去下载被依赖者代码,被依赖者的代码下载完成后会执行下一个define。

2. define中getModule会立即返回一个对象，这个对象保存想要加载的被依赖模块的导出接口、是否完成加载信息，和依赖它的模块的whenDepsLoaded函数。

3. 该模块调用其whenDepsLoade函数，该函数在依赖没有全加载完时立即返回。

4. 接下来就等待被依赖模块下载好，被依赖函数又是一个define函数。define函数重复上述过程，

5. 此递归过程继续。直到某个没有依赖的模块

6. 对没有依赖的模块，define中直接调用whenDepsLoaded函数，更新它的导出接口，更新它的加载状态，调用依赖它的模块的whenDepsLoaded函数。(注意js的函数作用域中的myMod)

7. 该whenDepsLoaded函数保存了它自身的模块名和信息。如果它还有其它依赖没加载，立即返回。直到它所有依赖的模块的状态都变了，它的whenDepsLoaded函数才从此真正有了实质作用。把加载好的被依赖模块作为参数，开始真正执行模块代码(之前早就下载好的define的一部分)。之后更新它的导出接口、更新它的加载状态，调用依赖它的模块的whenDepsLoaded函数。

8. 被依赖的模块完成后又重复过程7，不断调用更高级别的依赖者的whenDepsLoaded函数，直到所有的函数都执行完。顶级的define中的whenDepsLoaded执行完。

著名的[require.js](http://requirejs.org)的设计就是这个原理。

我的逻辑性有点浆糊，但我觉得每种情况都说明白了，没有依赖，依赖其它，不被依赖的模块。

## 接口设计原则

1. 可预测：不总做出乎意料的设计。
2. 组件化：尽可能功能通用，提供简单的数据结构和语法。
3. 分层设计：暴露不同程度的细节。

综上，这都是些原理和基本原则。实际会涉及很多复杂的问题。不过，万丈高楼平地起，浮沙之上无高台，基础是深入的前提。而这个前提确是：万事开头难。

感谢看完的读者，希望以后碰到模块化问题都能更轻松迅速解决。
