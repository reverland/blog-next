---
layout: post
title: "How I built this blog"
excerpt: "Simply record what I've done to built up the blog.a non-official document to replenish the official one"
category: web
tags: [jekyll]
disqus: true
---

## 缘起

大概两个月前，曾经折腾过jekyll和Octopress。当时对照[【译文】用Jekyll构建静态网站](http://chen.yanping.me/cn/blog/2011/12/15/building-static-sites-with-jekyll/)在archlinux实现了把jekyll。因为rvm的问题，octpress就怎么也搞不定了。再加上当时对vimwiki比较熟悉，jekyll和Octopress再也不曾碰过。

然而几天前发现vimwiki的语法分析器甚至不支持xhtml，忽然又碰进[Mort的主页里](http://www.soimort.org/).Mort绚丽的jekyll博客瞬时grasp my heart，一股不可抑制的折腾情怀升腾起来。

## 经过

### ruby版本控制

当初没有继续折腾的原因之一，就是ruby搞不定。jekyll可以用ruby1.9.1或1.9.2,Octopress则要求1.9.2-p290.而archlinux当前版本的ruby是1.9.3。故使用rvm来控制ruby版本。

####设置代理

安装rvm，如果网络良好完全没问题。由于我在学校内使用的是sogou代理，而export http_proxy之流的命令偏偏不顶事，后来发现git和curl的网络链接根本就不继承shell环境的代理。

为了装上rvm，先在curlrc中写入

    proxy=127.0.0.1:1998
在gitconfig中写入

```bash
[http]
    proxy = http://127.0.0.1:1998
```

然后参见文档开始安装就是，我比较悲催，开始不知道可以这样做。直接hack rvm那个安装脚本才搞定

#### ruby环境搭建

因为我既是ruby小白又是python小白，所以选什么都没区别，如果你对python熟悉，[Hyde](http://hyde.github.com/index.html)而非jekyll可能是更好的选择。

装好rvm后，使用ruby1.9.2

```bash
rvm install 1.9.2 && rvm use 1.9.2
```

使用taobao的gem源

```bash
gem sources -remove http://rubygem.org/ 
gem sources -a http://ruby.taobao.org/ --http-proxy http://127.0.0.1:1998
```

安装对应的jekyll

```bash
gem install --http-proxy http://127.0.0.1:1998 jekyll 
```

其它和官方文档就没什么区别了。

ps:如果用socks代理请自行配置tsocks。

### jekyll

直接从soimort扒来的源码和jekyllbootstrap的源码经过个人需求重新加工整合，这个过程比较繁琐,此处略去。

然后就是push...

### 后续

#### 语法高亮

之前我是用pygments解决的，没有按官方文档来，因为装python2-pygments后才有pygmentize命令...

```bash
sudo pacman -S python2-pygments
pygmentize -S default -f html > ~css/pygments.css
```

后来发现还是syntaxhighlighter好看，于是把vimwiki那一大堆东西迁移过来了。结果搞的网页加载很慢，效果虽好很久出不来，所以先改会pygments

---

### 参考文献

#### 关于jekyll

1. [jekyll wiki](https://github.com/mojombo/jekyll/wiki/)
1. [【译文】用Jekyll构建静态网站](http://chen.yanping.me/cn/blog/2011/12/15/building-static-sites-with-jekyll/)
1. [告别wordpress，拥抱jekyll](http://www.yangzhiping.com/tech/wordpress-to-jekyll.html)
1. [搭建 Jekyll 博客的一些小技巧](http://www.pizn.me/2012/03/01/some-tips-for-jekyll-blog.html)
1. [尝试 Jekyll 博客](http://jiyinyiyong.blog.163.com/blog/static/64699876201111291856363/)

#### 关于语法高亮

1. [How to get Pygments to work with Jekyll](http://www.stehem.net/2012/02/14/how-to-get-pygments-to-work-with-jekyll.html)
1. [Jekyll的代码高亮](http://bbs.laxjyj.com/read-htm-tid-162443.html)
1. [jekyll 是不是不能使用插件啊？](http://www.v2ex.com/t/28708)

#### 其它

1. [wget和curl设置代理服务器的命令](http://blog.csdn.net/huzhenwei/article/details/4369027)
2. [Ruby Gem Proxy 代理设置](http://chenhailong.iteye.com/blog/1340924)
3. [Using RVM behind a proxy ](http://beginrescueend.com/workflow/proxy/)
4. [Installing RVM](http://beginrescueend.com/rvm/install/)
