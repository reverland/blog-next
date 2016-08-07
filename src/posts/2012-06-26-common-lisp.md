---
layout: post
title: "Common lisp菜鸟指南(译)"
excerpt: "翻译自http://ghostopera.org/blog/2012/06/24/the-newbie-guide-to-common-lisp/ "
category: lisp
tags: [lisp]
disqus: true
---


# Common Lisp菜鸟指南

翻译自[http://ghostopera.org/blog/2012/06/24/the-newbie-guide-to-common-lisp/](http://ghostopera.org/blog/2012/06/24/the-newbie-guide-to-common-lisp/) 

进入Common Lisp的世界可能非常让人退缩，甚至对有经验的程序猿也是这样。这个语言兼有力与美，但也有许多清晰的边界和没有真正被普遍理解的开端。

这个指南可能将持续一段时间，但是希望它将使踏入Common Lisp的任务变得不那么可怕。

## 理解Common Lisp

[Ariel Networks][ariel] 有个适当形式的 Common Lisp 指南。

The [HyperSpec][hyperspec] 有完整的 Common Lisp 文档。

[CLQR][clqr] 是一个好的课下载的 Common Lisp 快速参考手册。

## 了解你的工具

### Emacs[^1]

[Emacs][emacs] 是一个可实用lisp高度定制的编辑器[^2]。它可以为lisp提供一个非常独特的实时开发流程。查看[David O'Toole][http://dto.github.com/notebook/]在通过Emacs和他的 "Blocky.io" 游戏开发系统在一个游戏中的[lightning talk](http://blocky.io/blocky-lightning-talk-4.ogv)，来查看实时开发实例。很酷不是吗？

### Steel Bank Common Lisp

当这世界上有很多可用的 Common Lisp 实现时，[SBCL][sbcl] 是非常标准的实现。它很积极的被开发着，有适合的调试器、原生线程、多平台支持。

### Quicklisp

[Quicklisp][quicklisp] 使得从一套丰富的由社区发展的 Common Lisp 库开始变得更容易。它允许你仅仅通过几个简单命令下载、安装和加载任何700多库中的库。它完全取代了它的前任asdf-install,如果你熟悉RubyGems，这非常相似。

### CL-Project

[CL-Project][cl-project] 是白手起家一个新的 Common Lisp 项目的最佳现代方法。虽然它肯定不是必须的，但是它提供了一个创建新项目的合理起点。

### Buildapp

[Buildapp][buildapp] 使得创建SBCL的可执行文件更加方便

### ASDF

[ASDF][asdf] 允许你定义你的项目的结构和依赖。你可以把它当作Ruby世界中Rake和Gemfile的杂交。

<hr />

## 创建你的第一个应用程序

我将把获取Emacs和SBCL的任务留给你自己，你可以找到所有Linux、Windows和MacOS的版本。

### 安装Quicklisp和SLIME

```bash
$ curl -O http://beta.quicklisp.org/quicklisp.lisp
$ sbcl --load quicklisp.lisp
This is SBCL 1.0.42.52, an implementation of ANSI Common Lisp.
More information about SBCL is available at <http://www.sbcl.org/>.

SBCL is free software, provided as is, with absolutely no warranty.
It is mostly in the public domain; some portions are provided under
BSD-style licenses.  See the CREDITS and COPYING files in the
distribution for more information.

  ==== quicklisp quickstart loaded ====

    To continue, evaluate: (quicklisp-quickstart:install)
```


```cl
(quicklisp-quickstart:install)
(ql:add-to-init-file)
(ql:quickload "quicklisp-slime-helper")
```

### 创建应用程序

载入Emacs并键入<esc> x slime <enter>。你现在应该可以看到REPL——一个交互的lisp提示符。

```cl
(ql:quickload "cl-project")
(cl-project:make-project #p"myapp"
  :author "Your name"
  :email "your@email.com"
  :license "BSD or whatever")
(ql:quickload "myapp")
(in-package :myapp)
```

现在在Emacs有scratch标签的窗口键入<esc> x cd <enter> myapp <enter> 紧接着输入 <control>x <control>f src/myapp.lisp <enter> 。你应该拥有了一个为准备极棒的编码新建立的myapp.lisp文件。

让我们继续添加一些东西然后试试结果

```cl
(defun hello-world ()
  (format t "Hello world.~%"))
```

现在我们可以把我们的更改注入REPL，通过把光标放到最后一行并键入<control>c <control>c。通过切换到REPL键入以下内容执行我们的新函数：

```cl
(hello-world)
```

恭喜你！你在通过 Common Lisp 编程

### 重启Emacs后加载你的应用[^3]

CL-Project 在运行时更改了当前路径，使得第一次加载你的应用很简单。

你有3种方法把应用放到你的加载路径：

- 为了让应用在你的当前路径，或者从应用路径启动你的Emacs或者在加载slime之前更改目录。
- 把你的应用移动到 ~/quicklisp/local-projects 它将总是有用。
- [向你的加载路径添加项目](http://common-lisp.net/project/asdf/asdf/Controlling-where-ASDF-searches-for-systems.html#Controlling-where-ASDF-searches-for-systems) 。


个人选择对应用选择方法1对库文件选择方法2。

### 创建可执行文件

虽然做出有用的 Common Lisp 程序不必要创建可执行文件，它却肯定可以方便发布独立的应用。你生成的可执行文件将内嵌整个lisp环境，所以不要因二进制文件的体积感到吃惊……

首先，定义可执行文件的切入点

```cl
(export 'main)
(defun main (args)
  (hello-world)
  (cl-user::quit))
```

你将需要下载 [buildapp工具][buildapp] ，指导在它的网站上。

现在从你的myapp目录我们可以在命令行运行buildapp去编译你的程序！

```bash
buildapp --asdf-tree $HOME/quicklisp/dists/quicklisp/software \
  --load-system myapp --entry myapp:main --output hello
```

在程序所在目录运行你的程序

```bash
$ ./hello
Hello World.
```

## 下一步是什么？

[实用Common Lisp编程](http://www.gigamonkeys.com/book/) [^4]很好的介绍Common Lisp的书。是我看的第一本对该语言介绍的书。

[Common Lisp the Language,2nd Edition](http://www.cs.cmu.edu/Groups/AI/html/cltl/cltl2.html) Common Lisp的权威书籍

[On Lisp](http://www.paulgraham.com/onlisp.html) [^5]提供全面的高级Lisp技术

你应该看看 [Land of Lisp][land] 。它非常有趣，会是个相当愉快的阅读。

<hr />

## Footnotes

[^1]: 当然可以用vim，vim中slimv正是为此而生，可参考译者的 "在Vim中使用lisp":slimv 一文。本文中操作都可以在vim中完成,只是不要尝试用那个quicklisp-slime-helper了。

[^2]: Emacs内置elisp解释器。elisp是lisp的一个变种。

[^3]: Vim中类似。

[^4]: 有中文版，田春译。

[^5]: 有中文版，有兴趣的同学也许可以看看 "这里":http://115.com/folder/faujangp#lisp 

<hr />

## Changelog

- 2012年06月27日 星期三 11时03分37秒 更正一些错误。加译作者更新内容

[ariel]: http://labs.ariel-networks.com/cl-style-guide.html

[hyperspec]: http://www.lispworks.com/documentation/HyperSpec/Front/index.htm

[clqr]: http://clqr.boundp.org/

[emacs]: http://www.gnu.org/software/emacs/  

[slimv]: http://reverland.org/lisp/2012/02/23/vimlisp/

[sbcl]: http://www.sbcl.org/

[quicklisp]: http://www.quicklisp.org/

[cl-project]: https://github.com/fukamachi/cl-project

[buildapp]: http://www.xach.com/lisp/buildapp/

[asdf]: http://www.xach.com/lisp/buildapp/

[land]: http://landoflisp.com/
