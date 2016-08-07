---
layout: post
title: "Security in Browsers"
excerpt: "浏览器安全"
category: security
tags: [security, browser]
disqus: true
---


## 同源策略

同源策略限制来自某个源的文档或者脚本与另一个源的资源交互。同源策略用来阻止一些CSRF攻击。

### 定义

协议+端口(如果指定)+主机都相同。

#### 继承源

来自`about:blank`，`javascript:`和`data:`的URL内容继承加载这个文档的URL的源，因为它自身并没有关于源的信息。

#### IE特例

IE有两个关于同源策略的例外：

1. 信任区域(Trust Zones):如果两个域名高度互信，比如同一个公司域名，不使用同源策略。
2. 端口：IE的同源策略不考虑端口。

### 变更源

更改页面的源受到限制。脚本可以把`document.domain`设成当前domain的子集。之后就以此可以作为同源检查的源。例如，页面`http://store.company.com/dir/other.html`上的脚本可以这样：

    document.domain = "company.com"

注意必要时要指定端口号，否则会被赋值成null。

让子域安全访问父域必须将两者的`document.domain`设置为相同。

### 跨域网络访问

同源策略控制两个不同源的交互，当使用`XMLHttpRequest`或者`img`标签时。这些交互分为3类：

1. 跨域`写入`通常是允许的。例如链接(links)，重定向(redirects)和表单提交。某些罕见的HTTP请求需要`preflight`。
2. 跨域嵌入通常是允许的。例子如下
3. 跨域读取通常不允许，但通常通过嵌入泄漏了不可读内容。例如你可以读到嵌入图像的长宽，嵌入脚本的行为，或者[嵌入资源的可访问性](https://bugzilla.mozilla.org/show_bug.cgi?id=629094)。

以下是一些跨域嵌入的例子：

- 通过`<script src="..."></script>`嵌入的JS。语法错误信息只能在同源脚本中捕捉到。(然我并不理解，只看到浏览器可以捕捉到引入脚本的语法错误)
- 通过`<link rel="stylesheet" href="...">`嵌入的CSS。由于CSS松散的语法规则，同源策略要求跨域CSS有正确的`Content-Type`头。各个浏览器对跨域CSS的限制都不同。
- 通过`<img>`嵌入的图像，支持png，jpeg，gif，bmp，svg。。。格式
- 通过`<video>`和`<audio>`嵌入媒体文件。
- `<object>`，`<embed>`和`<applet>`嵌入的插件。
- 通过`@font-face`嵌入的字体。有些浏览器允许跨域字体，有的不行。
- 任何`<iframe>`或者`<frame>`嵌入的东西，网站可以通过设置`X-Frame-Options`头阻止这种跨域。

#### 如何允许跨域访问

使用CORS

#### 如何阻止跨域访问
