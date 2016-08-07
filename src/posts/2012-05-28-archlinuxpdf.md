---
layout: post
title: "Archlinux下合并pdf"
excerpt: "一种简便的在linux下合并pdf的方法"
category: linux
tags: [latex]
disqus: true
mathjax: true
---


##linux下合并pdf

写激光原理论文，老师给了个封面。需要将封面和内容弄到一个文件中。

以前用过pdfmod什么的，结果发现我用XeLaTeX编译出来的是乱码。

后来试过源里的pdfeditor，这个……kde下太难看了，功能倒挺强，看上去好复杂，点几下鼠标没弄懂，于是也放弃了。

再后来听说了pdfjam，pdfsam，pdftk……

多多少少有些洁癖好么，不喜欢一堆一堆的软件，有这么些时候命令很得心应手，像用ffmpeg转转视频格式啊，用sox转转音频格式啊。

linux下总是有好工具的，有两种方法：

- 新建一个TeX文件，使用pdfpages宏包，这种方法可以指定页码。参见[用TeX合并pdf][1]。一定要用pdflatex编译。
- 使用ghostscript工具,一般这个都被pdf阅读器依赖的。参见[合并 ps/pdf 文件][2]。

        ```bash
        gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=bar.pdf -f foo1.pdf foo2.pdf
        ```

[1]: http://latex.yo2.cn/articles/tex-merg-pdf.html

[2]: http://latex.yo2.cn/articles/gs-pdfwrite.html

##之外的废话

这几天一直忙着复习，几天时间把一学期老师讲的东西预习一遍，然后就要吊儿郎当的开卷考试了。又有那激光原理期末大作业，我是当然要用LaTeX来写了，虽然不准备再研究这个，但用word总是让我有些无法忍受。

上手才发现，东西基本都忘了。好久没用过基本的命令都忘的一干二净。还好有以前的自己做的模板，打开chinatex数学排版问题集边查边写，在开着vim-latex插件的手册随时查阅，实在不行还有google大神，总算最后凑合着写完了。

自从见识到mathjax项目后，又在人大那群搞R的人的博客上听说用html做幻灯片的项目，我便日觉LaTeX将没什么前途了。上网还查到现在还有把自己简历写成html的，html前途光明的印象便越发深刻。虽然mathjax还有些问题，但不管是学术和非学术界，本地化的文档正在走向灭绝估计已成定论。

因为这个网站的问题，看了点介绍html5的书，书中激情澎湃的介绍了html5的各种强大应用，栩栩如生的描绘出了一个属于网络的未来世界。看完之后，对LaTeX更没有热情了。

但作业还是要写的，老师很体贴的只收pdf，不像上学期一样还肯收word文档了，也不像cpp老师一样只收word文档了。所以又复习了下LaTeX，还不忘最后加上proudly powered by LaTeX，虽然没什么意思。

前几天一个学数学的同学找我帮他调教LaTeX，因为他们要发论文。模板多老我就不说了，中文断字都没做好，更纠结的是他们的文章，都是在word03和mathtype中写的，然后转成TeX……

时光滚滚向前，我本以为世界进步地很快，然而它的惯性出乎意料的大。


