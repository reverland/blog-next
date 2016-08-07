---
layout: post
title: "vim-latex插件对xelatex的配置"
excerpt: "vimlatex插件在archlinux下配置过程，包括中文化安装，xelatex设置，okular正反向搜索。"
category: linux
tags: [latex, vim]
disqus: true
---

## vim-latex设置xelatex 

### 准备工作 

首先我的系统配置情况:

```bash
Distributor ID: Arch i686 
Description:    a little light distro
```

使用的arch源中的texlive2011,直接用pacman安装，建议把相关包都安上，不占多少空间。如果要详细了解请见[这里](https://wiki.archlinux.org/index.php/TeXLive_%28%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87%29) ,又是我译的...英文版的都不只多久没更新了，不过可以参考。我安装的如下：

```bash
texlive-bin 2011.3-1.2 
texlive-core 2011.24722-1 
texlive-langcjk 2011.24689-1 
texlive-latexextra 2011.24718-1 
```

因为我用的是xelatex，所以直接生成的就是pdf文件，也就是这个原因，我才花时间折腾vim-latex-suite和okular，目前Linux下似乎也就是okular支持反向搜索...
安装vim-latex过程不细述。别忘了更改ctex字体配置文件,使楷体和仿宋的名称是你系统上的名称。

安装okular不细述。
 
假设你已经把上面两项安装好了，那么进入正题。

***

### hack 源码（其实，貌似可以在vimrc中更改）

####修改latex-suite默认的目标文件

在~/.vim/ftplugin/latex-suit/texrc中找到:

```bash
if has('macunix')
   TexLet g:Tex_DefaultTargetFormat # 'pdf'
else   
   TexLet g:Tex_DefaultTargetFormat # 'dvi'
endif
```

修改为：

```bash
if has('macunix')
   TexLet g:Tex_DefaultTargetFormat # 'pdf'
else   
   TexLet g:Tex_DefaultTargetFormat # 'pdf'
endif
```

这个变量告诉latex-suite，你需要的目标文件是pdf

#### 修改pdf的编译命令

同样在texrc文件中找到：

```bash
TexLet g:Tex_CompileRule_pdf # 'pdflatex -interaction#nonstopmode $*'
```

修改为：

```bash
TexLet g:Tex_CompileRule_pdf # 'xelatex --src-specials -interaction#nonstopmode $*'
```

这样，你用来编译pdf的命令就有xelatex来负责了，同时也指定了前向搜索所必备的一个参数：`--src-specials`

#### 修改默认pdf浏览器

 继续在texrc修改latex-suite默认为各种文件调用的浏览器，找到相应部分修改成以下模样。

```bash
TexLet g:Tex_UseEditorSettingInDVIViewer # 1
```

```bash
if executable('xdg-open')
   TexLet g:Tex_ViewRule_ps # 'okular'
   TexLet g:Tex_ViewRule_pdf # 'okular'
   TexLet g:Tex_ViewRule_dvi # 'okular'
else
   TexLet g:Tex_ViewRule_ps # 'okular'
   TexLet g:Tex_ViewRule_pdf # 'okular'
   TexLet g:Tex_ViewRule_dvi # 'okular'
```

经过这一步，latex-suite在浏览pdf，dvi，ps的时候都会调用okular.

#### 设置正向搜索

修改~/.vim/ftplugin/latex-suit/compiler.vim，让latex-suite能够以正确的参数在前向搜索和普通模式下打开生成的pdf文件：
找到相应部分做如下修改

```bash
" We're either UNIX or Mac and using a UNIX-type viewer

" Check for the special DVI viewers first
.................
elseif (viewer ## "okular")
  let execString # 'silent! !okular --unique '.mainfnameRoot.'.pdf\#src:'.line('.').expand("%")
```

#### 设置反向搜索

    警告！文件名和路径中不要有空格和汉字
打开okular，菜单：setting>>configure okular>>Editor属性页
把里面的Editor下拉到Custom Text Editor，然后在Command:一栏输入：

```bash
    gvim -c ":RemoteOpen +%l %f"
```

注意，系统要有gvim...
 
然后在你的tex源文件的preamble部分，加入：

```bash
    \synctex#1
```

大功告成啦，重新用\ll编译一遍你的源文件，然后\ls前向搜索，最后在pdf中想要反向搜索的地方按：

```bash
    Shift+鼠标左键
```

就会自动的重定位到gvim中源码对应的地方，不过记住，不要开多个gvim，否则很可能用错误的gvim打开源码，然后就会提示交换文件已经存在之类. 

***

## 参考文献 ##

sorry,写的比较早遗忘了，如果有知道的联系我。

***

###### changelog 
- 2012年02月07日 星期二 12时54分48秒
- 2012年04月06日 星期五 18时44分54秒 添加ctex字体配置部分，更改高亮




