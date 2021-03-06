---
layout: post
title: "Recent Summary"
excerpt: "最近半个月不完全回顾"
category: Life
tags: [Life]
disqus: true
---


这里越来越不是技术博客了，越来越像博主个人的记事本而不像分享技术的地方了。

总之，由于身体健康的考虑和对妹子的向往等一系列原因，我坚定地决定珍爱生命，远离计算机。但对一个热衷于折腾的人这项正确伟大光明的方针就是空头支票，实践的一点也不好。

最初还好，天天往返于图书馆一教与寝室，一天不怎么回去。忙着看妹子，看书。看看《别逗了，费曼先生》，对费曼真是崇拜得五体投地。然而愈发的感觉到自我的平庸和碌碌无为。

## 考研后的学习

最近忙着看《Hacking：the Art of Exploition》,感觉里面讲C语言的部分太好了，深浅合适，不会像C语言圣经那么假设您已经有一定深度，也不会像国内的一堆C教材把简单的语言搞得复杂到让人望而却步。作者从最最基本的程序设计思想开始讲，循序渐进地引入C的语法和概念，精巧的例子相当助于理解而且充满意趣。更重要的事，结合着一些基本的汇编讲解让人对C的理解有了更高的高度。[^1]我觉得任何一本优秀的教材、一篇优秀的教程，一份优秀的文档，都具有该书作者那种平易近人，循序渐进，深浅适度并且充满着意趣和爱的风格。可惜，天朝几十年的教育风格简直就是为了毁掉人们对丰富多彩科学与艺术的热爱。

汇编语言我觉得到此为止，那本《Professional Assembly Language》也是一篇优秀的教程，清晰、平易、深入浅出，注重实践。当把一本书大部分汇编代码在我的Linux机器下实践后我决定不再深入研究某些章节，比如FPU计算、SSE和SSE2和SSE3，因为80%的实际情况下您只需要用到20%的知识，基本的汇编知识已经足够应付大多数场景，其它东西真心别指望记住也至今没用到过。

学习汇编感觉一大好处是回头看C清晰了许多，对计算机和操作系统的理解也更加深入，当然对调试也是大有裨益。基本是汇编那本书里我才学习和习惯了工具集比如objdump/gdb/gcc等等。顺便推荐下kdbg作为gdb前端。虽然我更喜欢直接用gdb。

以前只喜欢更加抽象的语言比如lisp和python，事实上最开始只是随手看看有关Python的书却引起了对调试器的兴趣，最后发现gdb太好玩了。现在却也很喜欢C和汇编了，它们简洁而强大，却构成了所有上层抽象的基础。

另外需要强调的是，实践和理论是两码事。看作者讲的时候觉得一清二楚，水到渠成。真正到了到自己的机器上实践时却困难重重。这本书有些老是一方面，但另一方面动手本来就不是这么简单的事。

稍微记下我碰到的一些问题，如果您能有何指教，万分感谢：

### 在64位下编译32位汇编程序

书中基本都是32位程序，其实差别也不大，只不过寄存器的名字变成rip，rap什么的，但为了学习方便我还是选择编译32位程序。

首先系统要支持32位(拥有32位库文件，比如glibc和gcc在gentoo中使用multilib的USE标记。或者archlinux添加multilib仓库并安装32位glibc和gcc)，CPU通常64位都能运行在32位兼容模式。

使用gas进行汇编程序编译和链接如下：

```bash
as --32 -gstabs -o paramtest2.o paramtest2.s
ld -dynamic-linker /lib/ld-linux.so.2 -melf_i386 -o paramtest2 -lc paramtest2.o
```

对`as`其中 `--32` 是架构，-gstabs是要编译时保存调试符号以供将来用gdb调试时查看，`-o`后面是目标文件名。

对ld来说`-dynamic-linker`指定了链接的动态库位置，`-lc`后面是你要读取和连接的目标文件。如果没有使用C库函数没必要连接上，可以仅仅`ld -o functest4 functest4.o area.o`。`-melf_i386`指定了架构。

使用gcc编译汇编程序时可以一次完成编译和连接，我通常倾向于这种方式。注意，gcc是以`main`作为标志来编译的。这样做虽然省事，但gcc实际上做了很多你可能并不希望它去做的事，以致于用它编译和连接的程序在查看堆栈时会让你完全看不懂。gcc默认连接动态库，所以在你的汇编程序使用C标准库时用gcc会很方便。

```bash
gcc -g -m32 -o paramtest3 paramtest3.s       
```

`-g`用来保存调试符号，`-m32`用来指定使用32位模式。

## 调试时一些问题

当你尝试书中的C程序时很可能会碰到很多疑问。比如反汇编的时候发现printf变成了puts。gcc默认开启一些优化选项，并且gcc会将许多C库函数用它自己内置的函数替代。这使你无法stepinto某个库函数，也无法在库函数中设置断点。为了防止gcc这么做，你可以加上`-fno-builtin`参数[^2]。

```bash
gcc -g -fno-builtin -m32 -o funcptr_example funcptr_example.c 
```

之后就可以在gdb中在诸如strcpy函数设置断点，并且可以step into这些库函数了。

但也未必，你需要安装glibc的调试文件。

如果gdb叫你检查/usr/lib/debug目录并且glibc中函数名称无法显示只是`??`，那么您八成是没有安装调试符号。其它linux发行版你也许只要安装调试符号就行。但gentoo中，情况稍微复杂些。在gentoo中可以添加上`debug`USE标记，但这还不够，在`make.conf`中需要添加一条特性：

```bash
 cat /etc/portage/make.conf |grep FEATURES
 FEATURES="splitdebug" 
```

之后emerge你的glibc，然后`/usr/lib/debug/`下就有调试符号了。

```bash
ls /usr/lib/debug/ 
lib32  lib64  sbin  usr
```

## 缓冲区溢出

在实践第三章简单缓冲区溢出时发现虽然用户数据很容易覆盖，但妄图覆盖堆栈的返回地址的行为却屡屡失败(指`exploit_notesearch`程序)。我google了下，原因有以下几种：

1. [ALSR](http://en.wikipedia.org/wiki/Address_space_layout_randomization)，现代操作系统中有了更健全的保护系统来阻止黑客计算出正确的地址。该特性可以在`/proc/sys/kernel/randomize_va_space`中写入0来关闭。
2. 在大多数64位系统中，可能在较新的linux内核，妄图通过另一个程序来挖掘计算程序地址的企图是不怎么可行的。两个程序(`exploit_notesearch`和`notesearch`根本不运行在同一个虚拟内存空间)。[^4]
3. [Gcc的堆栈保护](http://en.wikipedia.org/wiki/Buffer_overflow_protection)，据说可以通过像gcc添加参数`-fno-stack-protector`来取消某些保护[^3]。但我的gcc好像就没这个参数。
4. 还有一大票其它短期内你永远也搞不清的安全机制。

在换32位测试无力后，我默默爬上海盗湾准备找到个古老的书籍配套livecd来动手实践下。虽然都是些过时的技术，但看上去仍然相当有趣。

更多有意思的讨论参见[这里](http://stackoverflow.com/questions/1851293/what-are-some-advanced-and-modern-resources-on-exploit-writing)，三年前的老讨论。哈哈，我这里有shellcoder‘s handbook. 

## Coursera课程

基本上High performance scientific computing被放弃了，我已经落下将近两周。Fortran/makefile那里停下来，将来再看吧。

Machine Learning继续跟进，视频，作业，动手实践。不过我都压缩到两天完成一周的任务了……

## 其它

- 在百度贴吧Linux吧获得成就：_wps黑开源大喷子_
- 偶尔在byr论坛水水，一群人投票讨论nuanyangyang是不是妹子= =
- 每天活动活动
- 下载了IDA pro免费版，看了看，确实比objdump方便强大多了……虽然没什么可比性……
- 下载并看了下Immunity debugger，虽然感觉很厉害的样子，却几乎一点不会用。后来看到《A Bug Hunter's Diary》中作者用immunity debugger！
- 随意试了下linux下的fork尝试实现调试器启动进程的功能，不知道怎么挂住程序让它别运行……后来也没再查资料和折腾这个。

其它，没什么好说的。

## FootNotes

[^1]: 吐槽下当初那些拿着天花乱坠术语讲解着莫名其妙的原理的VB教材，直接把我对计算机的兴趣给毁了。
[^2]: [Can't step into string.h function](http://stackoverflow.com/questions/15306090/cant-step-into-string-h-function-with-gdb)
[^3]: [The Art of Compiler on Buffer Overflow](http://stackoverflow.com/questions/13024977/the-art-of-compiler-on-buffer-overflow)
[^4]: [评论部分有讨论这个，我是在另外一个地方看到，但找不到链接了](http://stackoverflow.com/questions/8696517/buffer-overflow-example-from-art-of-exploitation-book)
