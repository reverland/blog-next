---
layout: post
title: "Exploring Webpack"
excerpt: "webpack internals - from loaders to plugins"
category: javascript
tags: [webpack, javascript]
disqus: true
---

## Prelude

This article is more a note than a formal post, I write this with days of small pieces of times when exploring and learning webpack.

It covers: 

0. How bundles work. What a bundled js file looks like.
1. How loaders work. What a loader looks like
2. How plugins work. What a plugin looks like
3. The big picture of how webpack works, that is, webpack internals.
4. Some thoughts that coming to my mind when exploring awesome webpack.

I don't find any detail explanation on webpack internals, so I decided to share my explorations. However, writing in English is challenge for me, but, it's *Fun* to learn to writing in a language you are not familiar with.

As the [webpack's doc](http://webpack.github.io/docs/) said, it bundles every dependencies into static assets used for the web, it's production, it's unbiased
,it's flexible, it's extensible, it's open source. it looks so good......

it have rich plugins to support tons of function, it has tons of loaders to load tons of resources and it can help you split big code base into chunks, it has a good hot reloaded dev server with proxy support, it support all kinds of module format in the history from commonjs to amd to umd (with the help of babel support es modules in some extent), it has multiple caching levels with high performance incremental compilation, it can help you minimize optimize your code before bundle, and, it support multi target like browser, node and workers.

it looks its really really powerful,
and really really *COMPLEX* !

You may use it every day, however, you may not understand, why, and how it works. If you are curious about how it works, its the article for you. Lets dive into it.

## Bundle Javascript

One of the most commonly use case for webpack is to bundle javascript modules into one or several files for serve.

### How Bundles Works

#### CommonJS modules

The example from documentation

```bash
┌─(~/work/webpack-learning/1)──────────(reverland@reverland-R478-R429:pts/13)─┐
└─(19:14:41)──> tree                                            ──(五, 7月15)─┘
.
├── app.js
└── cats.js

0 directories, 2 files
```

`cats.js`

```javascript
var cats = ['dave', 'henry', 'reverland']
module.exports = cats;
```

`app.js`

```javascript
┌─(~/work/webpack-learning/1)──────────(reverland@reverland-R478-R429:pts/13)─┐
└─(19:18:59)──> cat app.js                                      ──(五, 7月15)─┘
var cats = require('./cats.js');
console.log(cats)
```

take the app.js as entry point

```bash
┌─(~/work/webpack-learning/1)──────────(reverland@reverland-R478-R429:pts/13)─┐
└─(19:18:50)──> webpack app.js bundle.js                        ──(五, 7月15)─┘
Hash: b32c0c5126f5df66072b
Version: webpack 1.13.1
Time: 94ms
    Asset     Size  Chunks             Chunk Names
bundle.js  1.58 kB       0  [emitted]  main
   [0] ./app.js 51 bytes {0} [built]
   [1] ./cats.js 65 bytes {0} [built]
```

Lets see what is inside bundle.js

```javascript
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var cats = __webpack_require__(1);
	console.log(cats)


/***/ },
/* 1 */
/***/ function(module, exports) {

	var cats = ['dave', 'henry', 'reverland']
	module.exports = cats;


/***/ }
/******/ ]);
```

Wow, clear output with comments, thanks to sokra.

the bundle have a IIFE which takes all the modules. Every module is a function, which takes `module` `exports` and `__webpack_require__` if needed as arguments. these arguments are injected into modules to support resolve dependencies and export something to module.exports.

a more word, modules are identified with their position in modules arrays as module Id. `require/__webpack_requrie__` just receive one parameter, that is the module id.

Whenever the `__webpack_require__` works on a module ID , it first checks if the same Id's module has loaded in the cache, if not, it just add a new module and inject `module` and `module.exports` into that module function and runs it. with module function's enviroment has `this` point to `module.exports`. Finally, 'module.exports' is returned with `__webpack_require__`, it can be used for who require it: )

at the end of IIFE, `__webpack_require__(0)` is returned. its the `entry.js`, when evaluate entry.js, `__webpack_require__(1)` runs, so the modules' dependencies have been handled.

thats *ALL* about how webpack's bundler work when we glimpse of the bundler generated by webpack.

#### AMD

Next, lets take a look at how amd works

this example takes 3 files

```bash
┌─(~/work/webpack-learning/2)─────────(reverland@reverland-R478-R429:pts/13)─┐
└─(20:20:00)──> tree                                           ──(五, 7月15)─┘
.
├── app.js
└── cats.js

0 directories, 2 files
```

`cats.js`, which is a AMD module

```javascript
define('cats', [], function () {
  var cats = ['dave', 'henry', 'reverland'];
  return cats
})
```

`dogs.js`

```javascript
define('dogs', ['./cats.js'], function (cats) {
  console.log(cats)
  dogs = cats
  return dogs
})
```

`app.js`, a plain CommonJS entry point, you can just require a amd file

```javascript
var cats = require('./dogs.js');
console.log(cats)
```

Now, the bundle becomes(the same part is leaved out)

```javascript
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var cats = __webpack_require__(1);
	console.log(cats)


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function (cats) {
	  console.log(cats)
	  dogs = cats
	  return dogs
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  var cats = ['dave', 'henry', 'reverland'];
	  return cats
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))


/***/ }
/******/ ])
```

the AMD modules was rewriten by webpack into a CommonJS one.
Whenever `__webpack_require__` require a AMD module, it just runs the module function, and the IIFE inside the module function execute and export if there are any thing to export.

(note: `!()` takes all inside the brackets as expression and execute it) 

really neat!

#### UMD

Let's rewrite `dogs.js` in UMD

```javascript
(function(root, factory){
  if (typeof define === "function" && define.amd) {
	define(['./cats.js'], factory);
  } else if (typeof exports === 'object') {
	factory(require('./cats.js'));
  } else {
	root.dogs = factory(root.cats);
  }
}(this, function (cats) {
  console.log(cats)
  dogs = cats
  return dogs
}))
```

the bundle now becomes

```javascript
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var cats = __webpack_require__(1);
	console.log(cats)


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function(root, factory){
	  if (true) {
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports === 'object') {
		factory(require('./cats.js'));
	  } else {
		root.dogs = factory(root.cats);
	  }
	}(this, function (cats) {
	  console.log(cats)
	  dogs = cats
	  return dogs
	}))


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  var cats = ['dave', 'henry', 'reverland'];
	  return cats
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))


/***/ }
/******/ ]);%    
```

so, the if statement to find out whether the module is in AMD is rewriten to `true`, all UMD modules just becomes the AMD ones, and finally, CommonJS ones.

Interesting, but, how webpack achieve all of this?

![Magic](http://i.imgur.com/YsbKHg1.gif)

It parse your codes into AST and static analyse them and operate on it, however, I dont' understand how webpack do that in detail.

so, magic.

### How Code Split Works

Webpack, can be used to split code into an on demand loaded chunk.It's quite an interesting feature. You should define split points for this to work.

One way to define a split point is to use `require.ensure`, a webpack specific API.
`require.ensure` will ensure spliting modules in its first arguments and modules it reference in a new chunk(not always, in fact), but won't evaluate like `require` do, just scheduled to evaluate later.

#### Code Split in Action

Let's take a example(target the web)

The `app.js` is the entry point, nothing special

```javascript
var cats = require('./dogs.js');
console.log(cats)
```

However, `dogs.js` defines the split point. We let webpack to load the bundle three seconds later, and evaluate one second later after loaded.

```javascript
var dogs = ['Alice', 'Bob', 'Reverland']
module.exports = dogs
setTimeout(function(){
  require.ensure(['./cats.js'], function(require) {
	console.log('./cats.js loaded, but not evaluate')
	setTimeout(function () {
	  var cats = require('./cats.js')
	  console.log('./cats.js evaluate', cats)
	}, 1000)
  })
}, 3000)
```

`cats.js` remains the same, nothing special, an AMD module

```javascript
define('cats', [], function () {
  var cats = ['dave', 'henry', 'reverland'];
  return cats
})
```

Now, bundle it

```bash
┌─(~/work/webpack-learning/4)────────────────────────────────────────────────────(reverland@reverland-R478-R429:pts/13)─┐
└─(11:03:29)──> webpack app.js bundle.js --display-error-details                                          ──(六, 7月16)─┘
Hash: c3653e88387af4a1f2f5
Version: webpack 1.13.1
Time: 139ms
      Asset       Size  Chunks             Chunk Names
  bundle.js    4.04 kB       0  [emitted]  main
1.bundle.js  454 bytes       1  [emitted]  
   [0] ./app.js 51 bytes {0} [built]
   [1] ./dogs.js 330 bytes {0} [built]
   [2] ./cats.js 95 bytes {1} [built]
```

interesting, it's bundled into two chunks. Lets prepare some file to see it really works in browsers.

prepare an `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Code Split</h1>
    <script src="bundle.js"></script>
  </body>
</html>
```

You can just include the `bundle.js`, which will responsible for loading `1.bundle.js`.

serve it

```bash
┌─(~/work/webpack-learning/4)────────────────────────────────────────────────────(reverland@reverland-R478-R429:pts/13)─┐
└─(11:09:21)──> httpserver                                                                                ──(六, 7月16)─┘
lo: 127.0.0.1
wlan0: 192.168.1.9
server started: http://0.0.0.0:8080
```

Now the magic, code works as you expected and chunk loaded as you expected. Check the time to confirm it.

![codes works as you expected](https://img.vim-cn.com/35/f7608b28957114376e9666a13d457b22b1aa61.png)

![chunk loaded as you expected](https://img.vim-cn.com/aa/a530afd4472c0742d35972d1abe939b12f97f4.png)

However, how it works? Let's dive into the `bundle.js` and `1.bundle.js`

#### The Runtime

`bundle.js` contains the runtime to:

1. resolve and evaluate modules
2. register JsonP function
3. function to load new chunks which wrapped in a Jsonp callback

```javascript
/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);

/******/ 	};

/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		0:0
/******/ 	};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}

/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);

/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;

/******/ 			script.src = __webpack_require__.p + "" + chunkId + ".bundle.js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};

/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var cats = __webpack_require__(1);
	console.log(cats)


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var dogs = ['Alice', 'Bob', 'Reverland']
	module.exports = dogs
	setTimeout(function(){
	  __webpack_require__.e/* nsure */(1, function(require) {
		console.log('./cats.js loaded, but not evaluate')
		setTimeout(function () {
		  var cats = __webpack_require__(2)
		  console.log('./cats.js evaluate', cats)
		}, 1000)
	  })
	}, 3000)


/***/ }
/******/ ]);% 
```

the entry bundle register the JsonP function. This function accept chunk ID and `moreModules` that is bundled into this chunk. it will prepare all callbacks for a specific chunk added, flag chunk as loaded, add new loaded modules into modules list, and finally, evaluate every callbacks.

You may wonder what `parentJsonpFunction` for, it may, for example there are multi entry points, the same chunk or modules states should be flaged and callback for same chunk should be evaluated for every entry point.

As you can see, `require.ensure` is replaced with `__webpack_require__.e` in module functions and dependent modules will be replaced with a chunk Id. 

When a module function is resolved, `__webpack_require__.e` will:

1. When chunk with specific ID is not loaded, create a script element to load it.
2. When chunk with specific ID is loaded, evaluate the callback. (After loaded, modules in this chunk will be in module list now, so just require is ok)
3. When chunk with specific ID is loading, push this callback into `installedChunks`, schedule it for evaluating.

Whenever a new chunk is loaded, it is evaluate by the browser. The chunk looks like `1.bundle.js` below.

```javascript
webpackJsonp([1/*chunk ID*/],{

/***/ 2: // Module ID, below module function
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	  var cats = ['dave', 'henry', 'reverland'];
	  return cats
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))


/***/ }
});
```

that's how the magic happened under the hood.

Webpack is clever, so clever that it knows *What* you'd like to split into chunks, *How* to merge chunks and remove unuseful chunks and so on. Really cool.

Like a magic.

![Magic](http://i.imgur.com/YsbKHg1.gif)

## Loaders

> Loaders are transformations that are applied on a resource file of your app. They are functions (running in node.js) that take the source of a resource file as the parameter and return the new source.

One of the most exciting feature in webpack is that it can load nearly everything into javascript. However, Webpack can do more than loading assets.

> Loaders allow you to preprocess files as you require() or “load” them. Loaders are kind of like “tasks” are in other build tools, and provide a powerful way to handle frontend build steps. Loaders can transform files from a different language like, CoffeeScript to JavaScript, or inline images as data URLs. Loaders even allow you to do things like require() css files right in your JavaScript!

You can also integrate lint, test and documentation generation process in your workflow with webpack. That sounds *COOL*~

But, how this works in webpack? webpack's loaders are so powerful, however, the most common usecase for loader is changing the source into a javascript module function.

Let's explore some interesting webpack loaders.

### Raw

> Loads raw content of a file (as utf-8).

the `dogs.js` file

```javascript
console.log('half dog')
```

```javascript
// raw-loader
var dogs = require('raw!./dogs.js')
```

When checking `bundle.js`, except the webpack runtime we have seen before, you can see it export `dogs.js`'s raw content in the generated module function.

```javascript
/* 2 */
/***/ function(module, exports) {

	module.exports = "console.log('half dog')"

/***/ },
```

How raw loader achieve this? lets look at what `raw-loader` looks like:

```javascript
module.exports = function(content) {
	this.cacheable && this.cacheable();
	this.value = content;  // I can't figure out why set loader context with previous content
	return "module.exports = " + JSON.stringify(content);
}
```

A plain javascript function who accept raw content of a file:

1. mark the loader cacheable
2. set the value in loader context. I dont know what it for, despite of the confusing api docs.
3. return the module body, which exports such raw content.

### Json

> Loads file as JSON

```javascript
// json loader
var cats = require('json!./cats.json');
```
`cats.json`

```json
["dave","henry","reverland"]
```

`bundle.js` looks like below:

```javascript
/* 1 */
/***/ function(module, exports) {

	module.exports = [
		"dave",
		"henry",
		"reverland"
	];

/***/ },
```

`json-loader`:

```javascript
module.exports = function(source) {
	this.cacheable && this.cacheable();
	var value = typeof source === "string" ? JSON.parse(source) : source;
	this.value = [value];
	return "module.exports = " + JSON.stringify(value, undefined, "\t") + ";";
}
```

Obvious, however, I still don't know what `this.value` for.

### Val

> Executes code as module and consider exports as JavaScript code

`dogs.js`, a module which exports js code.

```javascript
var code = 'var dogs = \'a\''
module.exports = code
```

`app.js`, the entry point.

```javascript
// val-loader
var dogs = require('val!./dogs.js')
```

`bundle.js`

```javascript
/* 3 */
/***/ function(module, exports) {

	var dogs = 'a'

/***/ },
```

`val-loader`

```javascript
var loaderUtils = require("loader-utils");
module.exports = function(content) {
	var query = loaderUtils.parseQuery(this.query);
	if(query.cacheable && this.cacheable)
		this.cacheable();
	if(this.inputValue) {
		return null, this.inputValue;
	} else {
		return this.exec(content, this.resource);
	}
}
```

neat(but what does `return null, this.inputValue` mean?)

I still can not figure out how cacheable works

### File

`cats.json` is same as above.

`app.js`

```javascript
// file-loader
var cats = require('file?name=new_cats.json!./cats.json')
```

Bundle it, a new file emitted by the loader.

```bash
┌─(~/work/webpack-learning/5)───────────(reverland@reverland-R478-R429:pts/1)─┐
└─(00:19:24)──> webpack app.js bundle.js --module-bind 'png=file-loader'
Hash: cc125205509143b0e940
Version: webpack 1.13.1
Time: 905ms
                                Asset      Size  Chunks             Chunk Names
                        new_cats.json  29 bytes          [emitted]  
...
```

`bundle.js`

```javascript
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "new_cats.json";

/***/ },
```

`file-loader`

```javascript
var loaderUtils = require("loader-utils");

module.exports = function(content) {
	this.cacheable && this.cacheable();
	if(!this.emitFile) throw new Error("emitFile is required from module system");

	var query = loaderUtils.parseQuery(this.query);
	var configKey = query.config || "fileLoader";
	var options = this.options[configKey] || {};

	var config = {
		publicPath: false,
		name: "[hash].[ext]"
	};

	// options takes precedence over config
	Object.keys(options).forEach(function(attr) {
		config[attr] = options[attr];
	});

	// query takes precedence over config and options
	Object.keys(query).forEach(function(attr) {
		config[attr] = query[attr];
	});

	var url = loaderUtils.interpolateName(this, config.name, {
		context: config.context || this.options.context,
		content: content,
		regExp: config.regExp
	});

	var publicPath = "__webpack_public_path__ + " + JSON.stringify(url);

	if (config.publicPath) {
		// support functions as publicPath to generate them dynamically
		publicPath = JSON.stringify(
				typeof config.publicPath === "function" 
				 ? config.publicPath(url) 
				 : config.publicPath + url
		);
	}

	if (query.emitFile === undefined || query.emitFile) {
		this.emitFile(url, content);
	}

	return "module.exports = " + publicPath + ";";
}
module.exports.raw = true;
```

According to the option it parsed, it emit the file and export the path.

It's a raw loader, for file content need to be Buffer instead of String.

By the way, it talked about `publicPath`, that's where you'd like your assets being served.

### Url

> The url loader works like the file loader, but can return a Data Url if the file is smaller than a limit.

`cats.json` is the same as above.

`app.js`

```javascript
// url-loader
var cats = require('url!./cats.json')
var cats = require('url?limit=1!./cats.json')
```

`bundle.js`

```
/* 5 */
/***/ function(module, exports) {

	module.exports = "data:application/json;base64,WyJkYXZlIiwiaGVucnkiLCJyZXZlcmxhbmQiXQo="

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "480cea2cf47df1df86c2f9540b86bc8f.json";

/***/ },
```

`url-loader`

```javascript
var loaderUtils = require("loader-utils");
var mime = require("mime");
module.exports = function(content) {
	this.cacheable && this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var limit = (this.options && this.options.url && this.options.url.dataUrlLimit) || 0;
	if(query.limit) {
		limit = parseInt(query.limit, 10);
	}
	var mimetype = query.mimetype || query.minetype || mime.lookup(this.resourcePath);
	if(limit <= 0 || content.length < limit) {
		return "module.exports = " + JSON.stringify("data:" + (mimetype ? mimetype + ";" : "") + "base64," + content.toString("base64"));
	} else {
		var fileLoader = require("file-loader");
		return fileLoader.call(this, content);
	}
}
module.exports.raw = true;
```

Yeah, 

- if limit query is not present anywhere, it is zero, then export the files dataURL. 
- or it will decide whether export with limit. If file size is below limit, export dataURL, else export path like `file-loader`.

### Css

> Loads css file with resolved imports and returns css code

`css-loader` is complex, I won't show the source code of the loader, but we can check what it generated to have a feeling of whats happening.

`app.css`

```css
@import './b.css';
body {
  color: red;
  background-image: url('./background.png');
}

h1 {
  color: gold;
  text-shadow: 0 0 3px black;
}
```

`b.css`

```css
h1 {
  font-size: 3em;
}
```

`app.js`

```javascript
// css-loader
var css = require('css!./app.css')
```

`bundle.js`

```javascript
//...
	// css-loader
	var css = __webpack_require__(7)
//...
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(8)();
	// imports
	exports.i(__webpack_require__(9), "");

	// module
	exports.push([module.id, "body {\n  color: red;\n  background-image: url(" + __webpack_require__(10) + ");\n}\n\nh1 {\n  color: gold;\n  text-shadow: 0 0 3px black;\n}\n", ""]);

	// exports


/***/ },
/* 8 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(8)();
	// imports


	// module
	exports.push([module.id, "h1 {\n  font-size: 3em;\n}\n", ""]);

	// exports


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "8fd2362368edec47b25aeb7218d3f5ba.png";

/***/ },
```

As we can see, `css-loader` should get all dependencies working well:

1. generate modules for  `@import` css.
2. generate modules for `url()` with url-loader/file-loader.
3. correctly handle `mediaquery`

The `bundle.js` shows that it generate a runtime module which return a factory, every css module use the factory to construct a list and push its dependencies into the list. finally, export the list full of its module dependencies.

In this way, css loader handle all of the css modules correctly and export their dependencies in javascript.

Cool~

But `css-loader` is more than this, you may check their docs and source codes your self to learn more.

How to insert the generated css code into DOM to acturelly work?

you need a `style-loader` to do it.

### Style

> Add exports of a module as style to DOM

`app.css` is as above

`app.js`

```javascript
// style-loader
require('style!raw!./app.css')
```

`bundle.js`

```javascript
/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(12);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(13)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
  // ...
	}

/***/ },
/* 12 */
/***/ function(module, exports) {
  // css content to insert
	module.exports = "@import './b.css';\nbody {\n  color: red;\n  background-image: url('./background.png');\n}\n\nh1 {\n  color: gold;\n  text-shadow: 0 0 3px black;\n}\n"

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {
      // module to manipulate dom
      // ...
/***/ }
/******/ ]);
```

it looks obviously how it works. but lets check the source code of `style-loader`

```javascript
var loaderUtils = require("loader-utils"),
	path = require("path");
module.exports = function() {};
module.exports.pitch = function(remainingRequest) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	return [
		"// style-loader: Adds some css to the DOM by adding a <style> tag",
		"",
		"// load the styles",
		"var content = require(" + loaderUtils.stringifyRequest(this, "!!" + remainingRequest) + ");",
		"if(typeof content === 'string') content = [[module.id, content, '']];",
		"// add the styles to the DOM",
		"var update = require(" + loaderUtils.stringifyRequest(this, "!" + path.join(__dirname, "addStyles.js")) + ")(content, " + JSON.stringify(query) + ");",
		"if(content.locals) module.exports = content.locals;",
		"// Hot Module Replacement",
		// ...
		"}"
	].join("\n");
};
```

Its a pitch loader. What does it mean?

> The pitch method on the loaders is called from left to right before the loaders are called. If a loader delivers a result in the pitch method the process turns around and skips the remaining loaders, continuing with the calls to the more left loaders.

sokra said...

```
It's like the two phases of event bubbling...

a!b!c!resource

    pitch a
        pitch b
            pitch c
                read file resource (adds resource to dependencies)
            run c
        run b
    run a

When a loader return something in the pitch phase the process continues with the normal phase of the next loader... Example:

    pitch a
        pitch b (returns something)
    run a
```

You can do something before the resource being really read and evaluated. In fact,
 `style-loader` interupt the load process and restart the load process in its loader function, after loading the css code, it manipulate the dom(insert. check, replace, etc) to make the style acturally work.
 
### Imports
 >Imports stuff to the module
 
 this transform `app.js`
 
 ```javascript
 // import-loader
require('imports?this=>new_this,cats=./cats.js!./dogs.js')
 ```
 
 and `cats.js`
 
 ```javascript
var cats = ['meow', 'nyaa', 'miao']
module.exports = cats
 ```
 
 and `dogs.js`
 
 ```javascript
 var code = 'var dogs = \'a\''
module.exports = code
 ```
 
 into `bundle.js`
 
 ```javascript
 /* 14 */
/***/ function(module, exports, __webpack_require__) {

	/*** IMPORTS FROM imports-loader ***/
	(function() {
	var cats = __webpack_require__(15);

	var code = 'var dogs = \'a\''
	module.exports = code

	}.call(new_this));

/***/ },
/* 15 */
/***/ function(module, exports) {

	var cats = ['meow', 'nyaa', 'miao']
	module.exports = cats

/***/ }
/******/ ]);
```

`imports-loader`

```javascript
var loaderUtils = require("loader-utils");
var SourceNode = require("source-map").SourceNode;
var SourceMapConsumer = require("source-map").SourceMapConsumer;
var HEADER = "/*** IMPORTS FROM imports-loader ***/\n";
module.exports = function(content, sourceMap) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var imports = [];
	var postfixes = [];
	Object.keys(query).forEach(function(name) {
		var value;
		if(typeof query[name] == "string" && query[name].substr(0, 1) == ">") {
			value = query[name].substr(1);
		} else {
			var mod = name;
			if(typeof query[name] === "string") {
				mod = query[name];
			}
			value = "require(" + JSON.stringify(mod) + ")";
		}
		if(name === "this") {
			imports.push("(function() {");
			postfixes.unshift("}.call(" + value + "));");
		} else {
			imports.push("var " + name + " = " + value + ";");
		}
	});
	var prefix = HEADER + imports.join("\n") + "\n\n";
	var postfix = "\n" + postfixes.join("\n");
	if(sourceMap) {
    // generate source map
    // ...
	}
	return prefix + content + postfix;
}
```

So, with `imports-loader`, you can 

1. Pass query 'name=value' to add `var name = require(value)` before source content
2. Pass query 'name=>value' to add `var name = value` before source content
3. Pass query 'this=>value' to wrap source content in a function and bind `this` to this value.

Quite cool~

### Exports
 
 > Exports stuff from the module 
 
`dogs.js` as shown above.

`app.js`

```javascript
// exports-loader
require('exports?kitten=cats,dogs!./dogs.js')
```

`bundle.js`

```javascript
/* 16 */
/***/ function(module, exports) {

	var code = 'var dogs = \'a\''
	module.exports = code


	/*** EXPORTS FROM exports-loader ***/
	exports["kitten"] = (cats);
	exports["dogs"] = (dogs);

/***/ }
/******/ ]);
```

`exports-loader`

```javascript
var loaderUtils = require("loader-utils");
var SourceNode = require("source-map").SourceNode;
var SourceMapConsumer = require("source-map").SourceMapConsumer;
var FOOTER = "/*** EXPORTS FROM exports-loader ***/\n";
module.exports = function(content, sourceMap) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var exports = [];
	var keys = Object.keys(query);
	if(keys.length == 1 && typeof query[keys[0]] == "boolean") {
		exports.push("module.exports = " + keys[0] + ";");
	} else {
		keys.forEach(function(name) {
			var mod = name;
			if(typeof query[name] == "string") {
				mod = query[name];
			}
			exports.push("exports[" + JSON.stringify(name) + "] = (" + mod + ");");
		});
	}
	if(sourceMap) {
    // emit source map
    // ...
	}
	return content + "\n\n" + FOOTER + exports.join("\n");
}
```

So, clearly, with `exports-loader` you can:

1. Pass `name` query to append `exports['name'] = name` to source content
2. Pass `name=value` query to append `exports['value'] = name` to source content

### Expose
 
 > Exports stuff from the module
 
`qpp.js`
 
```javascript
// exports-loader
require('expose?dogs.name.value!./dogs.js')
```

`bundle.js`

```javascript
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {if(!global["dogs"]) global["dogs"] = {};
	if(!global["dogs"]["name"]) global["dogs"]["name"] = {};
	module.exports = global["dogs"]["name"]["value"] = __webpack_require__(18);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 18 */
/***/ function(module, exports) {

	var code = 'var dogs = \'a\''
	module.exports = code


/***/ }
/******/ ]);
```

`expose-loader`

```javascript
function accesorString(value) {
	var childProperties = value.split(".");
	var length = childProperties.length;
	var propertyString = "global";
	var result = "";

	for(var i = 0; i < length; i++) {
		if(i > 0)
			result += "if(!" + propertyString + ") " + propertyString + " = {};\n";
		propertyString += "[" + JSON.stringify(childProperties[i]) + "]";
	}

	result += "module.exports = " + propertyString;
	return result;
}

module.exports = function() {};
module.exports.pitch = function(remainingRequest) {
	this.cacheable && this.cacheable();
	if(!this.query) throw new Error("query parameter is missing");
	return accesorString(this.query.substr(1)) + " = " +
		"require(" + JSON.stringify("-!" + remainingRequest) + ");";
};
```

Yes, if you pass `expose-loader` with query `a.b.c`, it will expose the module's exports to `global.a.b.c`.

By using a pitch loader, it can interupt the process if no query.

### Script

> Executes a JavaScript file once in global context (like in script tag), requires are not parsed.

`app.js`

```javascript

```
 
`bundle.js`

```javascript
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(20)(__webpack_require__(21))

/***/ },
/* 20 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	module.exports = function(src) {
		if (typeof execScript !== "undefined")
			execScript(src);
		else
			eval.call(null, src);
	}


/***/ },
/* 21 */
/***/ function(module, exports) {

	module.exports = "var code = 'var dogs = \\'a\\''\nmodule.exports = code\n"

/***/ }
/******/ ]);
```

In fact, it just `eval()` the source content in global context.

`script-loader`

```javsascript
var path = require("path");

var addScript = function(src) {
  if (typeof execScript !== "undefined")
		execScript(src);
	else
		eval.call(null, src);
}

module.exports = function() {};
module.exports.pitch = function(remainingRequest) {
	this.cacheable && this.cacheable();
	return "require(" + JSON.stringify("!!" + path.join(__dirname, "addScript.js")) + ")"+
			"(require(" +
			JSON.stringify("!!" + require.resolve("raw-loader") + "!" + remainingRequest) + ")" +
				(this.debug ?
					"+" +
						JSON.stringify(
							"\n\n// SCRIPT-LOADER FOOTER\n//# sourceURL=script:///" +
								encodeURI(remainingRequest.replace(/^!/, "")).replace(/%5C|%2F/g, "/").replace(/\?/, "%3F").replace(/^\//, "")
						) :
					"") +
			")";
};
```

Awesome!

### Still A Magic

In fact, there are more things a loader can do. And there are different loaders which can access loader context api to achieve more. 

How all of these magic works?

I dont know now, however.

so, 

![Magic](http://i.imgur.com/YsbKHg1.gif)

But I'll try to explore it in the next chapter.

## Webpack Internals

> ...Using staged build callbacks, developers can introduce their own behaviors into the Webpack build process. ...you'll need to understand some of the Webpack low-level internals to hook into them. Be prepared to read some source code!

It's great that loaders can load nearly everything and map behaviors during loading. But with plugins, you can introduce your behaviours into all build process in Webpack.

In fact, Webpack itself is composite with some internal plugins, which makes it really versatile as well as composable.

### Big Picture

Before we dive into plugins, we should have a idea of how webpack work in a big picture.

For example, when you start webpack to package you modules in this way.

```bash
┌─(~/work/webpack-learning/6)──────────(reverland@reverland-R478-R429:pts/14)─┐
└─(20:36:09)──> webpack app.js bundle.js 
```

Webpack will simply do the following things:

1. require a local installed webpack if possible.
2. parse options to give webpack
3. require real webpack library function which create a compiler represent the fully configured webpack enviroment. 
4. run the compiler.
5. the compiler start a compilation which represent a single compilation process
6. compilation load modules and build it into bundled js file, and resolve and build its dependencies
7. bundled file and other assets is emitted.

How all of the process be assembled? The key is [tapable](https://github.com/webpack/tapable/blob/master/lib/Tapable.js).

### Tapable

> Tapable is a class for plugin binding and applying.

In my eyes, tapable is just a "EventEmitter" in essence. Every thing that participate in the bundle process is extended with tapable. So they can register functions onto different events, they can fire diferent events at diferent stages. In this way, webpack works.

two methods are used for plugin binding: `apply` and `plugin`

The interface is simple, when calling `apply` method on plugins you'd like to registered, different functions you like to execute with diferent event will be registered onto tapable's `_plugin` property.

`plugin` is the interface tapable expose for plugins to actually register callbacks.

Lots of `applyPlugins***` is used to fire callbacks with arguments registerd in for different events(callbacks registerd in `_plugin` property). 

Tapable in this way can inject any logic function into different building stage.

### A Glimpse of Plugin

Here is the helloworld plugin modified from [how to write a plugin](https://github.com/webpack/docs/wiki/How-to-write-a-plugin#basic-plugin-architecture), which is a plugin constructor:

```javascript
function HelloWorldPlugin(options) {
  // Setup the plugin instance with options...
}

HelloWorldPlugin.prototype.apply = function(compiler) {
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin("optimize", function() {
      console.log("Assets are being optimized.");
    });
  });
  compiler.plugin('done', function() {
    console.log('Hello World!'); 
  });
};

module.exports = HelloWorldPlugin;
```

There are two important objects extending with tapable very important:

1. compiler: which represents the fully configured(configuration, loader, plugin, etc.) webpack enviroment
2. compilation:  represents a single build of versioned assets

A plugin is used in this way(Just for showing how it works):

```javascript
compiler.apply(new HelloWorldPlugin())
```

Check `compiler.apply`

```javascript
Tapable.prototype.apply = function apply() {
	for(var i = 0; i < arguments.length; i++) {
		arguments[i].apply(this);
	}
};
```

So `HelloWorldPlugin.prototype.apply` is executed. that is, `compiler.plugin`.

Check its source

```javascript
Tapable.prototype.plugin = function plugin(name, fn) {
	if(Array.isArray(name)) {
		name.forEach(function(name) {
			this.plugin(name, fn);
		}, this);
		return;
	}
	if(!this._plugins[name]) this._plugins[name] = [fn];
	else this._plugins[name].push(fn);
};
```

It just register callback on different event on `_plugins`.

When a new compilation is started, [compiler will emit `compilation`](https://github.com/webpack/webpack/blob/314c897682b556845fea36d329de8016d1740900/lib/Compiler.js#L398):

```javascript
this.applyPlugins("compilation", compilation, params);
```

check `applyPlugins` in `tapable`

```javascript
Tapable.prototype.applyPlugins = function applyPlugins(name) {
	if(!this._plugins[name]) return;
	var args = Array.prototype.slice.call(arguments, 1);
	var plugins = this._plugins[name];
	for(var i = 0; i < plugins.length; i++)
		plugins[i].apply(this, args);
};
```

Its obviously applyPlugins will execute callbacks registered on `_plugins` with specific name.

That's how plugins work.

In fact, webpack itself is organized with lots of internal plugins, which make it composable and flexible. Check [`lib/webpackOptionsApply.js`](https://github.com/webpack/webpack/blob/314c897682b556845fea36d329de8016d1740900/lib/WebpackOptionsApply.js), After the options is parsed and transfer to webpack core, it apply lots of plugins according to options configured.

Interesting~

### Build Process

I won't cover too much about a compiler's or a compilation's lifecycle, but, now, lets write a simple plugin to inspect what happened inside webpack building process.

```bash
┌─(~/work/webpack-learning/6)──────────(reverland@reverland-R478-R429:pts/14)─┐
└─(14:55:12)──> tree                                            ──(日, 7月24)─┘
.
├── app.js
├── b.js
└── InspectPlugin.js
```

`app.js`

```javascript
var b = require('./b.js')
module.exports = b
```

`b.js`

```javascript
var b = 'i\'m b'
module.exports = b
```

Finally, `InspectPlugins.js`, the inspect plugin we write to inspect the building process.

```javascript
var events = ["resolver","this-compilation","global-hash-paths","hash","startup","render","local-vars","require","module-obj","require-extensions","normal-module-factory","before-resolve","after-resolve","emit","compilation","make","run","after-compile","seal","after-environment","normal-module-loader","optimize-chunk-assets","environment","module","expression ","evaluate Identifier __filename","evaluate Identifier __dirname","expression require.main","expression require.extensions","expression module.exports","expression module.loaded","expression module.id","evaluate Identifier module.hot","expression module","after-optimize-chunk-assets","context-module-factory","entry-option","done","invalid","jsonp-script","require-ensure","bootstrap","hot-bootstrap","call require","record","after-hash","additional-chunk-assets","module-require","global-hash","current-hash","expression __webpack_hash__","evaluate typeof __webpack_hash__","call module.hot.accept","call module.hot.decline","expression module.hot","build-module","asset-path","hash-for-chunk","expression process","expression global","expression console","expression Buffer","expression setImmediate","expression clearImmediate","after-resolvers","evaluate typeof ","evaluate Literal","evaluate LogicalExpression","evaluate BinaryExpression","evaluate UnaryExpression","evaluate typeof undefined","evaluate Identifier","evaluate MemberExpression","evaluate CallExpression","evaluate CallExpression .replace","evaluate CallExpression .","evaluate CallExpression .split","evaluate ConditionalExpression","evaluate ArrayExpression","typeof ","expression __webpack_amd_options__","evaluate typeof define.amd","evaluate typeof require.amd","evaluate Identifier define.amd","evaluate Identifier require.amd","can-rename define","rename define","call define","call define:amd:array","call define:amd:item","call define:amd:context","expression require.cache","expression require","call require:commonjs:item","call require:commonjs:context","evaluate typeof require.ensure","typeof require.ensure","evaluate typeof require.include","typeof require.include","call require:amd:array","call require:amd:item","call require:amd:context","alternatives","evaluate typeof module","assign require","can-rename require","rename require","typeof module","evaluate typeof exports","call require.resolve","call require.resolveWeak","call require.resolve(Weak)","call require.resolve(Weak):item","call require.resolve(Weak):context","statement if","expression ?:","evaluate Identifier __resourceQuery","expression __resourceQuery","succeed-module","optimize","before-hash","before-chunk-assets","optimize-assets","record-modules","revive-modules","record-chunks","revive-chunks","should-emit","should-record","call require.config","call requirejs.config","expression require.version","expression requirejs.onError","optimize-chunks","after-optimize-tree","package","chunk-hash","add-module","modules","optimize-module-order","optimize-chunk-order","optimize-chunk-ids","can-rename ","factory","evaluate Identifier ","compile","before-module-ids","optimize-extracted-chunks"]

function InspectPlugin(options) {
}

InspectPlugin.prototype.apply = function(compiler) {
  events.forEach(function(event) {
    compiler.plugin(event, function() {
      console.log('[compiler emit]' + event + '(' + (arguments[0] ? arguments[0].constructor.name : '') + ')')

      if (event === 'compilation') {
        compilation = arguments[0]

        events.forEach(function(e) {
          if (typeof compilation.plugin === 'function') {
            compilation.plugin(e, function() {
              console.log('[compilation emit]' + e)

              if (typeof arguments[arguments.length - 1] === 'function') {
                arguments[arguments.length - 1]()
              }
            })
          }
        })
      }

      if (typeof arguments[arguments.length - 1] === 'function') {
        arguments[arguments.length - 1]()
      }

    })
  })
}

module.exports = InspectPlugin
```

Bundle it:

```bash
┌─(~/work/webpack-learning/6)───────────(reverland@reverland-R478-R429:pts/7)─┐
└─(13:53:46)──> webpack app.js bundle.js --plugin ./InspectPlugin.js 
[compiler emit]entry-option(String)
[compiler emit]after-resolvers(Compiler)
[compiler emit]environment()
[compiler emit]after-environment()
[compiler emit]run(Compiler)
[compiler emit]normal-module-factory(NormalModuleFactory)
[compiler emit]context-module-factory(ContextModuleFactory)
[compiler emit]compile(Object)
[compiler emit]this-compilation(Compilation)
[compiler emit]compilation(Compilation)
[compiler emit]make(Compilation)
[compilation emit]build-module  // build app.js
[compilation emit]normal-module-loader
[compilation emit]succeed-module
[compilation emit]build-module  // build b.js
[compilation emit]normal-module-loader
[compilation emit]succeed-module
[compilation emit]seal
[compilation emit]optimize
[compilation emit]optimize-chunks
[compilation emit]after-optimize-tree
[compilation emit]should-record
[compilation emit]revive-modules
[compilation emit]optimize-module-order
[compilation emit]before-module-ids
[compilation emit]record-modules
[compilation emit]revive-chunks
[compilation emit]optimize-chunk-order
[compilation emit]optimize-chunk-ids
[compilation emit]record-chunks
[compilation emit]before-hash
[compilation emit]chunk-hash
[compilation emit]after-hash
[compilation emit]before-chunk-assets
[compilation emit]additional-chunk-assets
[compilation emit]record
[compilation emit]optimize-chunk-assets
[compilation emit]after-optimize-chunk-assets
[compilation emit]optimize-assets
[compiler emit]after-compile(Compilation)
[compiler emit]should-emit(Compilation)
[compiler emit]emit(Compilation)
[compiler emit]done(Stats)
Hash: c771d64aa3c56fcbe3c1
Version: webpack 1.13.1
Time: 98ms
    Asset     Size  Chunks             Chunk Names
bundle.js  1.55 kB       0  [emitted]  main
   [0] ./app.js 45 bytes {0} [built]
   [1] ./b.js 36 bytes {0} [built]
```

So we can inspect how webpack works in a cleaner way, you can play it with [plugin api doc](https://github.com/webpack/docs/wiki/plugins) to have a better understanding on webpack's internals.

### Module Build Process

Last but not least, I'd like to mention about how modules resolved and builded. the core loader functionality is implement by plugins.

As we can see from above our inspectplugin's output, a module is loaded with three events fired:

0. build-module
1. normal-module-build
2. succeed-module

you can check it in [`lib/compilation.js`](https://github.com/webpack/webpack/blob/37540b647e9f7b26774d341c947a1c7487b77074/lib/Compilation.js#L126)

```javascript
Compilation.prototype.buildModule = function(module, thisCallback) {
	this.applyPlugins("build-module", module);
	if(module.building) return module.building.push(thisCallback);
	var building = module.building = [thisCallback];

	function callback(err) {
		module.building = undefined;
		building.forEach(function(cb) {
			cb(err);
		});
	}
	module.build(this.options, this, this.resolvers.normal, this.inputFileSystem, function(err) {
		module.errors.forEach(function(err) {
			this.errors.push(err);
		}, this);
		module.warnings.forEach(function(err) {
			this.warnings.push(err);
		}, this);
		module.dependencies.sort(Dependency.compare);
		if(err) {
			module.error = err;
			this.applyPlugins("failed-module", module);
			return callback(err);
		}
		this.applyPlugins("succeed-module", module);
		return callback();
	}.bind(this));
};
```

it's obvious, `module.build` will emit `normal-module-build` event.

what `module.build`do?

it's in [`lib/NormalModule.js`](https://github.com/webpack/webpack/blob/37540b647e9f7b26774d341c947a1c7487b77074/lib/NormalModule.js#L169), actually, it calls `doBuild`, in [this method](https://github.com/webpack/webpack/blob/37540b647e9f7b26774d341c947a1c7487b77074/lib/NormalModule.js#L120) we see it emit `normal-module-loader` event.

now check [`lib/dependencies/LoaderPlugin.js`](https://github.com/webpack/webpack/blob/37540b647e9f7b26774d341c947a1c7487b77074/lib/dependencies/LoaderPlugin.js#L17), we see

```javascript
		compilation.plugin("normal-module-loader", function(loaderContext, module) {
			loaderContext.loadModule = function loadModule(request, callback) {
				var dep = new LoaderDependency(request);
				dep.loc = request;
				compilation.addModuleDependencies(module, [
					[dep]
], true, "lm", false, function(err) {
```

This plugin call [`compilation.addModuleDependencies`](https://github.com/webpack/webpack/blob/37540b647e9f7b26774d341c947a1c7487b77074/lib/Compilation.js#L173). In this function, module dependencies are build and their dependencies are processed recursively if configured so.

That's how recursively module resolve and build works.

A little twisted, I think I haven't understand it well...

### Back To Loaders

When a module is builded. [doBuild method in `core/lib/NormalModuleMixin.js`](https://github.com/webpack/core/blob/master/lib/NormalModuleMixin.js#L49) is the method to call. I think the source code a little confused, but let's try to understand it. It do following things

1. prepare public loaderContext, so you can call some value and method in loader functions.
2. prepare the function to evaluate loader function or pitch function in loader context closure.

then, loaders are actually loaded into memory, private loader context are prepared, pitch functions are evaluated one by one. Note, `loadPitch` is function to evaluate loader's pitch function one by one in recursive way, weired!

Whenever a pitch function return something, the pitch is stopped and the loader functions is evaluated from loader which its next pitch function return something.

`nextLoader` handle all of loaders evaluate, the first loader receive source code, transform it, and feed it to next loader, and the next loader evaluated in the same way. finally, when all loaders evaluated,`onModuleLoaded` is triggered with the last loader's result as parameter, that is, set the module's `_source` with the transformed source.

Then the control of program transfer to `doBuild`'s callback.

That's how loaders works under the hood.

*Coolllllllll*, isn't it, despite of it employee recursive call to implement a loop like use black magic.

## Conclusion

So, I may have to stop my exploration on webpack internals and start my new journey in a coming project soon. But I've learned a lot from this simple exploration.

It takes me two weeks pieces of small times and weekends, I try to use debugger, try to write my own plugins and loaders, try to follow the source code to understand docs. I see how I've learned before, such as event emitter is useful to organize projects, seperate of concerns, but make it hareder to debug and understand. I also see how callbacks and recursive twisted my head.: ) I have better understand in how it facilitate my work and how I could improve my work with webpack's power.

Webpack is still so complex, so complex I don't believe I can understand anything in just two weeks. sokra and some other contributer in this project is, absolutely geniuses, thanks!

Now, it finished, my sharing with exploration in webpack. However, no review, ton's of Syntax Error, misunderstand maybe everywhere. Any comments and instructions will be appreciated

BTW: I don't have a stable network especially visit codepen, when the network fail, `everypage.js` behave strange and just crashed. then, I nearly lost unsaved post forever(in vim mode?). I can see it on screen but I can't save and can't even copy out post and just find each time i scroll codemirror, parts of my posts in dom generated and parts is removed, I can't even get the whole post to copy out...

After hours of hard work, I find my self not easy to rescue all of my posts from the crashed codepen page, its really **ANNOY**

<style>
em {
  color: red;
}

h2,h3,h4,h5 {
  color: brown;
  cursor: crosshair;
}

h2:hover,h3:hover, h4:hover, h5:hover {
  animation: flash 1s infinite;
}

h3:before,h4:before,h5:before {
  content: '❄';
  color: tomato;
}
h2:before {
  content: '☕';
  color: tomato;
}


@keyframes flash {
  0%, 100% {
    color: brown;
  }
 	50% {
    color: tomato;
  }
}
</style>
