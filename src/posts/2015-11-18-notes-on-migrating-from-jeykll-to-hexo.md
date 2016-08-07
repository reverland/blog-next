---
layout: post
title: "从Jekyll迁移到Hexo"
excerpt: "迁移到hexo和其他"
category: web
tags: [web, hexo]
disqus: true
---

上周，我将博客从jekyll平台迁移到hexo下。

## 缘起

不为什么。本来不想换，奈何不能成功在ubuntu 14.10上用rvm成功编译`ruby 2.1+`，连续几次过热自动关机后，就默默装上了基于node的hexo。

## 迁移记录

对jekyll，日志源文件都在`_posts/`目录下。而hexo则在`sources/_posts/`下。两者支持的都是带metadata的markdown文件。(当然，我还有一些用textile标记的文件。)简单来说，只要把相应的markdown文件迁移到hexo对应的位置就行。

但在迁移碰到了几个问题：

1.  修正permalink
2.  语法高亮部分修改
3.  特殊字符escape
4.  textile文件

### 与jekyll之前配置一致的url结构和文件命名方式

以前，我用jeykll时，每个文件名字如下：

```
2012-11-19-this-is-a-post.md

```

对应的url为

```
http://reverland.org/2012/11/19/this-is-a-post/

```

或者可以是

```
http://reverland.org/2012/11/19/this-is-a-post
http://reverland.org/2012/11/19/this-is-a-post/index.html

```

首先，要把hexo也改成这样的，在`_config.yml`中：

```
new_post_name: :year-:month-:day-:title.md # File name of new posts
permalink: :category/:year/:month/:day/:title/

```

但，还是有问题，具体可以参照[我提的issue](https://github.com/hexojs/hexo/issues/1589)，hexo如果看你的文件名是这样：

```
2014-06-12-.md

```

会生成这样的url

```
2015/11/13/2014-06-12.html

```

显然这不是我们想要的。

我们通过将[`node_modules/hexo-util/lib/permalink.js`第28行](https://github.com/hexojs/hexo-util/blob/cb685f19ecb5ba9ee48109049b21a21cd3da7dee/lib/permalink.js#L28)由

```
return '(.+?)';

```

更改为

```
return '(.*?)';

```

可以实现以前的jekyll风格。

如果你现在用的是hexo版本`3.1.0`，如果文件是：

可能会遇到生成这种url链接：

```
http://reverland.org/2014/06/12//index.html
http://reverland.org/2014/06/12//

```

在github中hexo已经不会有这个问题了，可以参见 [hexo/helper/url_for](https://github.com/hexojs/hexo/blob/d035d19ccd221f6815634c2d6d2aaa59b959839f/lib/plugins/helper/url_for.js#L30)的

```
return path.replace(/\/{2,}/g, '/');

```

来进行修改，如果你用的不是git版本的hexo。

我之后还碰到个问题，hexo中的分类是大小写敏感的，jekyll也是，但jekyll在url中会统一变成小写而hexo则不会，这竟然造成了我迁移后的一些链接失效。修正方法也很简单，通过`sed`将所有大写的`category`项都替换成对应的小写版本。

```
sed -i 's/^category: Life/category: life/g' source/_posts/*.md  # 我只有Life分类莫名写成了大写

```

这样，确保了和jekyll之前所有链接一致，然而，发现还是有disqus的评论消失了，检查链接并没有差异，暂时不知为什么。如果有谁能指教下请告诉我。

### 语法高亮修改

jekyll中，除了我用四个空格作为编码块区域缩进设定，还广泛使用了jekyll所特有的记法进行代码高亮。

```
{% highlight python %}
def sum(a, b):
    return a + b;
{% endhighlight %}

{% highlight cl%}
(cdr,
  (add,
    1, 1))
{% endhighlight %}
```

另外，我的每个文件里还有些jekyll特定命令来加入统计和评论什么的。这是当年从[Skydark](http://blog.skydark.info/)那里画虎不成留下的各种dirty　hack的结果。

```
{% include JB/setup %}
```

可以这样转换掉

```bash
sed -i 's/{%[[:space:]]highlight[[:space:]]\(.*\)[[:space:]]*%\}/```\1/g' source/_posts/*.md  # 注意有空格和没空格
sed -i 's/{%[[:space:]]endhighlight[[:space:]]%\}/```/g' source/_posts/*.md
sed -i 's/{%[[:space:]]include JB\/setup[[:space:]]%\}//g source/_posts/*.md'
```

### 特殊字符escape

接着有些特殊的文件会解析报错，因为hexo[用nunjunks来渲染](https://hexo.io/docs/troubleshooting.html#Escape_Contents)，如果文本中有`{{ }}`或者`{% %}`会出错。我发现如果是缩进四格的代码标记或者```会出错，但如果用另一种标记法 `````则没关系。

实在不行，我们可以用[html实体编码](http://www.ascii.cl/htmlcodes.htm)。

```html
<code>&#97;&#98;&#99;</code>
```

### textile文件

我试着用pandoc转换了下，发现几个问题：

1.  会将metadata错误地转换
2.  莫名的在行或特殊符号后面加反斜杠
3.  不能很好处理jekyll的代码高亮标记法

我写了些脚本辅助手工更改为markdown格式。话说这些sed代码还都是之前尝试往pelican上迁移时写的辅助脚本，虽然从来没有迁移到pelican平台上。

```bash
# 删除和转换jeykll特定标记
sed -i 's/{%[[:space:]]include JB\/setup[[:space:]]%\}//g' source/_posts/*.textile
sed -i 's/{%[[:space:]]highlight[[:space:]]\(.*\)[[:space:]]*%\}/```\1/g' source/_posts/*.textile
sed -i 's/{%[[:space:]]endhighlight[[:space:]]%\}/```/g' source/_posts/*.textile

# textile标记到markdown的转换
# 列表
sed -i 's/^* /- /g' source/_posts/*.textile
sed -i 's/^# /- /g' source/_posts/*.textile
# 标题
sed -i 's/^h1./#/g' source/_posts/*.textile
sed -i 's/^h2./##/g' source/_posts/*.textile
sed -i 's/^h3./###/g' source/_posts/*.textile
sed -i 's/^h4./####/g' source/_posts/*.textile
sed -i 's/^h5./#####/g' source/_posts/*.textile
# 脚注
sed -i 's/^fn\([[:digit:]]\)\./[\^\1]:/g' source/*.textile
sed -i 's/\[\([[:digit:]]*\)\]/[\^\1]/g' source/*.textile
# 默认的markdown解析并不支持脚注
# 如果需要，参考这里替换默认markdown解析，https://github.com/celsomiranda/hexo-renderer-markdown-it　
# 可惜这个引擎中，```块就不能正常解析{{ }}这种东西了
# 不知道那个pandoc后端的怎样。

# 链接
sed -i 's/"\([^"]*\)"\([h|\/].*\)/[\1](\2)/g' source/*.textile
sed -i 's/"\([^"]*\)"\([^h\/].*\)/[\1][\2]/g' source/*.textile


# 最后把后缀改了，hexo不会处理后缀是textile的文件
for file in source/_posts/*.textile; do
cp $file source/_posts/`basename $file .textile`.md
done
```

当然，最好脚本辅助，手工确认。

另外，有这么个东西[hexo render pandoc](https://github.com/wzpan/hexo-renderer-pandoc)来替换hexo的渲染引擎，就能顺便支持textile。值得一试和研究，也许里头就用到对文档元数据或者跳过指定行数的转换吧。没有细看。话说，还看到[@CodeFalling](http://codefalling.com/2015/11/15/new-version-of-hexo-renderer-org/)使用emacs来做org渲染后端，hexo的灵活性可见一斑。

## feed

默认的hexo竟然不像jekyll一样有feed生成支持！不过有[hexo-generator-feed](https://github.com/hexojs/hexo-generator-feed)这个插件来实现。具体参照文档就好。

## 添加友情链接、分类页、标签页

根据[根据Next主题的文档来就好](http://theme-next.iissnan.com/theme-settings.html)。
