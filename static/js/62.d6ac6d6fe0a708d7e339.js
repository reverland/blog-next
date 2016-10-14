webpackJsonp([62,192],{560:function(n,t){n.exports={rawContent:"\n\n## 一起学游泳吧\n\n`点我---->`[游泳日报](http://swim.reverland.org)`<-----点我！`\n\n满满的热爱之心。\n\n## 缘起\n\n作为一个游泳的狂热爱好者。狂热到恨不得每天都泡在水里。\n\n被诊断为支气管炎的时候\n\n双腿因为爬山废掉路都快走不动的时候\n\n天降暴雨电闪雷鸣马路成海的时候\n\n都义无反顾地冲去泳池\n\n泡在水里……\n\n这样自由随性的游了一年。\n\n后来，\n\n和一群游起来非常优雅漂亮的半职业运动员们一起游了几次\n\n或者十几次\n\n抑或几十次，之后\n\n我觉得得好好学习下。\n\n于是通过伟大的互联网，\n\n在[游泳梦工厂](http://topswim.net/)找到了很多\n\n很多泳痴留下的武林秘笈。\n\n欣喜异常！\n\n但我觉得论坛上不好看……\n\n于是诞生了把论坛上的帖子爬下来美化给自己看的愿望。\n\n于是写了个爬虫……\n\n后来，又想生成pdf，于是又折腾了下html转pdf。\n\n后来，那阵经常刷知乎日报……于是又萌生了\n\n制作`游泳日报`的想法。\n\n最终写了一堆 _脚本_ 来行使爬虫和静态页面生成的功能及其它辅助功能。\n\n源码见[https://github.com/reverland/topswim](https://github.com/reverland/topswim)\n\n静态页面见[https://github.com/reverland/topswim/tree/gh-pages](https://github.com/reverland/topswim/tree/gh-pages)\n\n## 具体实现\n\n### 爬虫部分\n\n不是啥优雅的方法。\n\n使用`lxml`和`requests`，把论坛页面的内容抓下来然后加上自定的内容。自己定义css文件。\n\n### 静态页面生成部分\n\n首先是具体内容页面。根据爬取的内容，加上自定义的html内容。可能用jinja2啊什么模板什么的应该更优雅些，我这就以一种quick和dirty的脚本方式实现。\n\n其次是首页生成方式。读取`rebuild.sh`文件取最新的六条生成首页。\n\n最后是总目录页的生成。读取`rebuild.sh`内容获取所有内容。\n\n### 辅助构建部分\n\n`update.sh`是主更新脚本。\n\n`update_index.py`和`update_toc.py`分别更新首页和总目录页。\n\n`rebuild.sh`负责重新构建所有内容页面。\n\n### 生成pdf部分\n\n使用`weasyprint`模块。\n\n将视频替换为对应地址。\n\nps:开始使用`xhtml2pdf`模块，这东西支持中文字体要改，最关键的是中文不换行！！！即使最后按网上找来的设置什么wordwrap为cjk还是不换行。总之不推荐。\n\n## 其它\n\n很多似乎需要优化的地方。\n\n1. 把html文本和程序分离出来比较合适。\n2. 命令行参数处理用argparse啥的处理应该更加优雅\n3. 原谅我渣一样的前端水平。\n\n好吧，本渣只是一个script kid……\n\n\n",metaData:{layout:"post",title:"游泳日报",excerpt:"来自游泳梦工厂的每日精选。——极不，很不，以及非常不优雅的爬虫和静态页面生成实现。",category:"python",tags:["swim","python"],disqus:!0}}}});