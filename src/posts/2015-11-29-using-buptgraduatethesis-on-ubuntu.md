---
layout: post
title: "在Ubuntu Linux下使用北邮毕业论文LaTeX模板"
excerpt: "LaTeX完成北邮研究生毕业论文指南"
category: linux
tags: [linux, tex]
disqus: true
---

# Using BUPTGraduateThesis on Ubuntu 14.10

**警告： 这是非官方模板，一切可能的格式问题都可能导致学位论文不被接受。欢迎选择HARD模式，and enjoy it!**

## 序言

作为一个对office不熟练而tex较为熟悉的人，排版和公式在word下实在不会玩。得益于[BUPTGraduateThesis项目](https://github.com/rioxwang/BUPTGraduateThesis)，希望终能离开[Word Online](https://onedrive.live.com)码论文的苦海。其实更像，我最终选择了HARD模式和未知。

感谢张煜博士（Dazzle Zhang）、王贤凌博士（rioxwang）和之前所有为清华、北邮毕业论文模板做过奉献的先驱们，感谢XeCJK和CTEX的开发人员。在此致敬。

## On Ubuntu 14.10

### 下载和查看帮助

克隆项目(如你所见，需要git)：

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads] - [2015-11-29 10:28:43]
└─[0] <> git clone https://gitcafe.com/rioxwang/BUPTGraduateThesis.git
Cloning into 'BUPTGraduateThesis'...
remote: Counting objects: 164, done.
remote: Total 164 (delta 0), reused 0 (delta 0)
Receiving objects: 100% (164/164), 6.54 MiB | 1.00 MiB/s, done.
Resolving deltas: 100% (67/67), done.
Checking connectivity... done.
```

进入目录查看下有哪些文件：

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads] - [2015-11-29 10:29:25]
└─[0] <> cd BUPTGraduateThesis
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:29:48]
└─[0] <git:(master cfb5f08) > ls
buptgraduatethesis.pdf  logo        makethesis.bat  release.zip
install                 makethesis  README.md
```

**切记第一件事** ，查看`README.md`:

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 11:04:44]
└─[0] <git:(master cfb5f08✱✈) > cat README.md
Version
==================
当前版本v6.2，同时托管于GitHub与GitCafe，支持Windows、Linux和OSX平台。该版本可以在项目主页直接下载ZIP压缩包获得，也可以通过如下任意一条git命令选择一个网速较快的服务器获得：

    git clone https://gitcafe.com/rioxwang/BUPTGraduateThesis.git
    git clone https://github.com/rioxwang/BUPTGraduateThesis.git


About
==================
BUPTGraduateThesis提供北京邮电大学研究生学位论文LaTeX文档类，其符合北邮研究生院2014年11月发布的《关于研究生学位论文格式的统一要求》。目前已经可以生成除了封面之外的所有论文内容，封面由于书脊的存在，需要进一步细调。我们建议利用BUPTGraduateThesis生成除了封面之外的所有PDF内容，再使用WORD生成封面。（注：扉页可以正常输出，而封面是打印时需要打印在指定彩纸上的内容，与扉页相比多了书脊这部分内容，需要根据论文薄厚做细调。校内的打印店均可以帮忙依据PDF的扉页生成封面。）

该项目源于张煜博士（Dazzle Zhang）发起并维护的BUPTThesis项目，并由王贤凌博士（rioxwang）在其基础上增添了更加稳健的中文处理方案，于2013年7月5日发布。该项目借助XeTeX引擎，利用xeCJK宏包取代BUPTThesis中的CJK宏包作为中文解决方案。同时，BUPTGraduateThesis根据研究生院发布的最新要求，对学位论文格式进行微调，并且提供更为详细的用户帮助文档buptgraduatethesis.pdf。


Quick Help
==================
快速安装说明

更具体的安装说明与帮助文档请参见buptgraduatethesis.pdf。

为了方便新手入门，BUPTGraduateThesis提供了基于Docstrip的安装方式和免安装压缩包release.zip，用户可以依照自己的习惯选择，两者方式差别不大。使用免安装压缩包的用户，只需要将release.zip解压，并将所有文件拷贝到主目录下即可正常使用（注意备份已有工作！）。

为了生成用户帮助文档buptgraduatethesis.pdf，安装前请保证Adobe系列中文字体已经安装。

Adobe系列字体用于提供免费的常用中文字体：

*  AdobeFangsongStd-Regular.otf
*  AdobeHeitiStd-Regular.otf
*  AdobeKaitiStd-Regular.otf
*  AdobeSongStd-Light.otf

Windows用户请打开CMD，输入如下命令进行安装：

    makethesis.bat install

Linux/OSX用户请打开SHELL输入如下命令进行安装：

    chmod a+x makethesis
    ./makethesis install


Change Logs
==================

*  v6.2：2015/04/23，修正参考文献列表序号不对齐的BUG（v6.1用户升级请在cls文件中搜索multibib宏包，删除其resetlabels选项的调用，在各个ch_xxx.tex和pubs.tex调用参考文献数据库之前使用\setcounter{NAT@ctr}{0}
重置参考文献计数器）
*  v6.1：2015/01/16，修正发表论文列表中序号不对齐的BUG
*  v6.0：2014/01/02，重新整理buptgraduatethesis.bst；在bare_thesis.bib中给出各类参考文献模板；更新帮助文档；迁移到GitCafe
*  v5.4：2014/11/29，根据新版论文格式要求修正学位论文类参考文献的格式
*  v5.3：2014/11/22，修正buptgraduatethesis.bst中学位论文类参考文献格式的BUG
*  v5.2：2014/07/17，根据新版论文格式对文档类进行精简；修正封面的BUG；修正最新版xeCJK带来的问题；更新帮助文档
*  v5.1：2014/05/31，修正makethesis中分章参考文献编译的BUG，此BUG会影响Linux和Unix用户的分章参考文献输出
*  v5.0：2014/04/14，增添数学字体选项，可以使用Computer Modern字体；盲审版本将隐去致谢和独创性等声明页；根据新版硕、博士论文格式要求更新模板和封面；修改参考文献中英文姓名出现Jr时的排版，并添加说明；修改帮助文档的字体，不用再依赖TeX Gyre Pagella字体；修正图名和表名的字体；改进一系列参考文献排版规则；增加免安装版，解压即可用；去除makethesis中安装时的输出重定向，方便排错
*  v4.0：2013/12/26，根据xeCJK宏包的更新修改宏包加载项；修复由于伪粗体带来的复制粘贴的BUG
*  v3.0：2013/12/23，根据新版论文格式要求更新模板
*  v2.3：2013/11/29，修改bibtex生成的参考文献中URL的字体
*  v2.2：2013/11/29，修正缩略语在第一次引用时无法出现中文释义的 BUG
*  v2.1：2013/11/21，修改article类型参考文献显示样式
*  v2.0：2013/11/20，增加部分参考文献自定义配置的功能；更新帮助文档
*  v1.3：2013/11/15，修正makethesis.bat的BUG；将Unicode指令替换为char指令用于引入Unicode字符；使用xeCJKsetcharclass命令修正xetex引擎下的带圈数字脚注
*  v1.2：2013/11/14，修正makethesis.bat的BUG
*  v1.1：2013/07/30，更新makethesis的换行模式
*  v1.0：2013/07/08，初始版本

To Do List
==================

*  整理文档类的代码，增添注释，便于更多人一起学习LaTeX
*  在书签中输出章节编号
*  改进文档参考文献输入规范与IEEE参考文献输入规范的兼容性%
```

README写得非常清晰，请 **一定** 认真参照`README`和`buptgraduatethesis.pdf`中的指示。我只简要记录下ubuntu下需要注意哪些问题，Linux用户可以参照我的记录。

### 安装依赖包和字体

先列出模板必要的依赖，首先是texlive中ubuntu哪些包。当然，如果也可以直接安装`texlive-full`，省心但这将耗费1.4G的空间。

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:29:49]
└─[0] <git:(master cfb5f08) > dpkg --get-selections |grep texlive
texlive-base					install
texlive-bibtex-extra				install
texlive-binaries				install
texlive-extra-utils				install
texlive-font-utils				install
texlive-fonts-recommended			install
texlive-fonts-recommended-doc			install
texlive-generic-recommended			install
texlive-lang-cjk				install
texlive-lang-other				install
texlive-latex-base				install
texlive-latex-base-doc				install
texlive-latex-extra				install
texlive-latex-extra-doc				install
texlive-latex-recommended			install
texlive-latex-recommended-doc			install
texlive-luatex					install
texlive-pictures				install
texlive-pictures-doc				install
texlive-pstricks				install
texlive-pstricks-doc				install
texlive-science					install
texlive-science-doc				install
texlive-xetex					install
```

必要的字体，由于版权原因需要从网络上下载（Adobe系列字体）：

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:31:55]
└─[0] <git:(master cfb5f08✱✈) > fc-list|grep Adobe
/home/reverland/.fonts/a/AdobeKaitiStd-Regular.otf: Adobe Kaiti Std,Adobe 楷体 Std,Adobe Kaiti Std R,Adobe 楷体 Std R:style=R,Regular
/home/reverland/.fonts/a/AdobeHeitiStd_Regular_(v5.010).otf: Adobe Heiti Std,Adobe 黑体 Std,Adobe Heiti Std R,Adobe 黑体 Std R:style=R,Regular
/home/reverland/.fonts/a/AdobeFangsongStd-Regular.otf: Adobe Fangsong Std,Adobe 仿宋 Std,Adobe Fangsong Std R,Adobe 仿宋 Std R:style=R,Regular
/home/reverland/.fonts/a/AdobeSongStd-Light.otf: Adobe Song Std,Adobe 宋体 Std,Adobe Song Std L,Adobe 宋体 Std L:style=L,Regular
```

微软Windows操作系统提供的中易字体：

```bash
└─[0] <> fc-list|grep sim
/home/reverland/.fonts/s/simsun.ttc: SimSun,宋体:style=Regular
/home/reverland/.fonts/s/simfang.ttf: FangSong_GB2312,仿宋_GB2312:style=Regular
/home/reverland/.fonts/s/simkai.ttf: KaiTi_GB2312,楷体_GB2312:style=Regular
/home/reverland/.fonts/s/simhei.ttf: SimHei,黑体:style=Regular
```

ubuntu软件仓库提供的微软核心英文字体，包括`Times New`系列。

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:53:40]
└─[0] <git:(master cfb5f08✱✈) > dpkg --get-selections |grep mscore
ttf-mscorefonts-installer			install
```

新安装字体后别忘了更新系统字体缓存：

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:33:10]
└─[0] <git:(master cfb5f08✱✈) > fc-cache -fv
```

### 生成示例文件

使用如下命令生成示例文件：

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:30:47]
└─[0] <git:(master cfb5f08✱✈) > ./makethesis install
mkdir: cannot create directory ‘example’: File exists
Extracting and installing files...
This is XeTeX, Version 3.1415926-2.5-0.9999.3 (TeX Live 2013/Debian)
 restricted \write18 enabled.
entering extended mode
(./install/buptgraduatethesis.ins
(/usr/share/texlive/texmf-dist/tex/latex/l3kernel/l3docstrip.tex
(/usr/share/texlive/texmf-dist/tex/latex/base/docstrip.tex
Utility: `docstrip' 2.5d <2005/07/29>
English documentation    <1999/03/31>
...
Underfull \hbox (badness 10000) detected at line 765
[]\EU1/lmtt/m/n/10 \fs []
[9] [10]

LaTeX Warning: `!h' float specifier changed to `!ht'.

[11] [12]) [13] (./buptgraduatethesis.gls) [14] (./buptgraduatethesis.aux)

LaTeX Font Warning: Some font shapes were not available, defaults substituted.

 )
(see the transcript file for additional information)
Output written on buptgraduatethesis.pdf (14 pages).
Transcript written on buptgraduatethesis.log.
Clearing TMP files...
===========================================
= Mission Done!
= BUPTGraduateThesis is successfully installed!
===========================================
```

会在当前目录生成 `buptgraduatethesis.cls` 、 `buptgraduatethesis.cfg`、`buptgraduatethe- sis.bst` 以及 `example` 文件夹。

**注意**: 你看到`Mission Done`并不一定真的成功生成文件了，可能中途发生些找不到字体的错误并只生成了部分文件，请仔细检查生成文件是否正常

检查`example`文件夹。该文件夹包含了一个示例，可以用来检查安装是否正常。

```bash
└─[0] <git:(master cfb5f08✱✈) > ls example
ackgmt.tex         bare_thesis.bib  ch_intro.tex   pubs.bib
acronyms.tex       bare_thesis.tex  metadata.tex   pubs.tex
app_lhospital.tex  ch_concln.tex    notations.tex
```

按`buptgraduatethesis.pdf`建议将`example`中文件拷贝到当前目录，并检查确认。

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:34:11]
└─[0] <git:(master cfb5f08✱✈) > cp example/* .
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:35:50]
└─[0] <git:(master cfb5f08✱✈) > ls
ackgmt.tex              buptgraduatethesis.cfg  example         notations.tex
acronyms.tex            buptgraduatethesis.cls  install         pubs.bib
app_lhospital.tex       buptgraduatethesis.log  logo            pubs.tex
bare_thesis.bib         buptgraduatethesis.pdf  makethesis      README.md
bare_thesis.tex         ch_concln.tex           makethesis.bat  release.zip
buptgraduatethesis.bst  ch_intro.tex            metadata.tex    xeCJK-fonts.def
```

确认无误后测试生成论文。

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:36:37]
└─[0] <git:(master cfb5f08✱✈) > ./makethesis thesis
===========================================
=
= TARGET=bare_thesis
= MAINMATTERS=ch_intro ch_concln
= DRIVER=xetex
= BIBTYPE=chapbib
=
===========================================
Double check above configurations! Press anykey to continue, CTRL+C to stop!
```

按任意键继续

```bash
(/usr/share/texlive/texmf-dist/tex/xelatex/xecjk/config/xeCJK.cfg))
(/usr/share/texmf/tex/latex/CJK/CJKnumb.sty) (./xeCJK-fonts.def
kpathsea: Running mktextfm KaiTi/ICU
/usr/share/texlive/texmf-dist/web2c/mktexnam: Could not map source abbreviation I for ICU.
/usr/share/texlive/texmf-dist/web2c/mktexnam: Need to update /usr/share/texlive/texmf-dist/fonts/map/fontname/special.map?
mktextfm: Running mf-nowin -progname=mf \mode:=ljfour; mag:=1; nonstopmode; input ICU
This is METAFONT, Version 2.718281 (TeX Live 2013/Debian)


kpathsea: Running mktexmf ICU
! I can't find file `ICU'.
<*> \mode:=ljfour; mag:=1; nonstopmode; input ICU

Please type another input file name
! Emergency stop.
<*> \mode:=ljfour; mag:=1; nonstopmode; input ICU

Transcript written on mfput.log.
grep: ICU.log: No such file or directory
mktextfm: `mf-nowin -progname=mf \mode:=ljfour; mag:=1; nonstopmode; input ICU' failed to make ICU.tfm.
kpathsea: Appending font creation commands to missfont.log.


!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!
! fontspec error: "font-not-found"
!
! The font "KaiTi" cannot be found.
!
! See the fontspec documentation for further information.
!
! For immediate help type H <return>.
!...............................................

l.14 ...Font={SimHei}, ItalicFont={KaiTi}]{SimSun}

?
```

喜大普奔，找不到字体。根据提示，检查系统安装的字体名字。

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads] - [2015-11-29 10:57:01]
└─[0] <> fc-list|grep KaiTi
/home/reverland/.fonts/s/simkai.ttf: KaiTi_GB2312,楷体_GB2312:style=Regular
```

根据`buptgraduatethesis.pdf`说明更改字体设定。

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 10:59:35]
└─[0] <git:(master cfb5f08✱✈) > sed -i 's/KaiTi/KaiTi_GB2312/g' xeCJK-fonts.def
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 11:09:50]
└─[0] <git:(master cfb5f08✱✈) > ./makethesis thesis
===========================================
=
= TARGET=bare_thesis
= MAINMATTERS=ch_intro ch_concln
= DRIVER=xetex
= BIBTYPE=chapbib
=
===========================================
Double check above configurations! Press anykey to continue, CTRL+C to stop!

Checking Existence of Essential Files...
Document class installed! Generating Thesis PDF...
Building thesis PDF...
This is XeTeX, Version 3.1415926-2.5-0.9999.3 (TeX Live 2013/Debian)
 restricted \write18 enabled.
entering extended mode
(./bare_thesis.tex
LaTeX2e <2011/06/27>
Babel <3.9h> and hyphenation patterns for 11 languages loaded.
(./buptgraduatethesis.cls

LaTeX Warning: You have requested document class `buptgraduatethesis',
               but the document class provides `buptgraduatethesis.cls'.

Document Class: buptgraduatethesis.cls 2015/04/23 v6.2 BUPT graduate thesis LaT
eX2e class
...
Package natbib Warning: There were undefined citations.

(./bare_thesis.aux (./ch_intro.aux) (./ch_concln.aux))

LaTeX Warning: There were undefined references.


LaTeX Warning: Label(s) may have changed. Rerun to get cross-references right.

 )
(see the transcript file for additional information)
Output written on bare_thesis.pdf (23 pages).
Transcript written on bare_thesis.log.
Processing BIB files...
Processing index files...
This is makeindex, version 2.15 [TeX Live 2013] (kpathsea + Thai support).
Scanning style file ./bare_thesis.ist.............................done (29 attributes redefined, 0 ignored).
Scanning input file bare_thesis.acn....done (4 entries accepted, 0 rejected).
Sorting entries....done (10 comparisons).
Generating output file bare_thesis.acr....done (11 lines written, 0 warnings).
Output written in bare_thesis.acr.
Transcript written in bare_thesis.alg.
Rebuilding to generate cross-reference...

** WARNING ** Unparsed material at end of special ignored.

** WARNING ** Unparsed material at end of special ignored.
===========================================
= Mission Done!
= Thesis PDF is successfully generated!
===========================================
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 11:30:54]
└─[0] <git:(master cfb5f08✱✈) >
```

似乎成功了，检查生成的pdf文件：

```bash
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 11:01:44]
└─[0] <git:(master cfb5f08✱✈) > evince bare_thesis.pdf
┌─[reverland@reverland-R478-R429] - [~/Downloads/BUPTGraduateThesis] - [2015-11-29 11:04:32]
└─[0] <git:(master cfb5f08✱✈) > ./makethesis clean
Clearing TMP files...
Clearing TMP files in installation...
Clearing TMP files in thesis generation...
===========================================
= Mission Done!
= ALL TMP files are cleared!
===========================================
```

看了看，似乎没什么问题。接下来可能有空会记录下使用。

Have Fun!

正如史上最神奇的游戏所展示的，Lost is fun。
