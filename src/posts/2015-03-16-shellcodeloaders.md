---
layout: post
title: "Shellcode/Loaders"
excerpt: "嗯，谢谢loader"
category: exploit
tags: [shellcode]
disqus: true
---


意译：[Shellcode/Loaders](http://blackhat.life/Shellcode_Loaders)

shellcode Loader被用在缓冲区溢出或者其它形式的二进制挖掘活动中测试shellcode。最好的方法嘛，构建从命令行参数的用户友好的loader，并且传递给刚分配的可执行内存空间。本文在x86指令集写x64汇编来在linux上构建这么个载入器。

32位的在文末给出

[TOC]

## 可执行loader

### 命令行参数

命令行参数入栈的顺序是：第二个参数，第一个参数，参数数目。因此，为了从参数获得shellcode，`pop rbx`三次。一旦完成，`rbx`将包含指向shellcode的指针：

    BITS 64
    global _start
    _start:
        pop rbx ;argc
        pop rbx ; 参数列表指针
        pop rbx ; 指向第一个参数的指针

### 通过mmap()分配可执行内存区域

参考x64 syscall table，自己谷歌就好。

现代操作系统的栈默认并不可执行，但我们成功执行代码需要一个可执行栈。这可以通过mmap系统调用实现。

`mmap()`的原型是(`man mmap`)：

     void *mmap(void *addr, size_t length, int prot, int flags,
                      int fd, off_t offset);

在64位处理器上，函数调用如下：

    function_call(%rax) = function(%rdi,  %rsi,  %rdx,  %r10,  %r8,  %r9)
                  ^system          ^arg1  ^arg2  ^arg3  ^arg4  ^arg5 ^arg6
                   call #

首先，`mmap()`的系统调用数(syscall number)放入`rax`：

    push 0x9
    pop rax

`mmap()`的第一个参数需要是`null`，所以`xor rdi rdi`。

    xor rdi, rdi

指定缓冲区大小(4096字节或者0x1000字节) ，这个参数传给`rsi`

    push rdi
    pop rsi ; rsi = 0
    inc rsi ; rsi = 1
    shl rsi, 0xc  ; rsi=0x1000

第三个参数`prot`保存在`rdx`中，是内核权限标志(读、写、执行或无)，对多个标志，它们用按位或方式合在一起，`PROT_READ|PROT_WRITE|PROT_EXEC`是数字`7`,所以直接在`rdx`中放入7就行。

    push 0x7
    pop rdx

接下来的参数`flag`跟`prot`类似，保存了内存映射标志。本例中设置为`MAP_PRIVATE|MAP_ANONYMOUS`，其值为数字`0x22`。存储在`r10`中。

    push 0x22
    pop r10

最后两个参数应该为`null`，放到`r8`和`r9`中

    push rdi
    push rdi
    pop r8
    pop r9

万事具备，进行系统调用。

    syscall

接下来`rax`中就包含指向缓冲区的指针，这个指针可以用来把shellcode拷贝进去。

### 拷贝代码到新内存区域

把`rsi`作为计数器，初始化为0：

    inject：
        xor rsi, rsi

把`rdi`设为`null`，等下要把当前字节和`dil`(rdi低8位)中的值比较来确定shellcode的结束位置。

    push rsi
    pop rdi

如果拷贝到达shellcode末尾，则跳到`inject_finished`：

    inject_loop:
        cmp [rbx + rsi * 1], dil
        je inject_finished

每个字节从`[rbx + rsi]`移动到`[rax + rsi]`，通过`r10b`(`r10`低八位)。

    mov r10b, [rbx+rsi*1]
    mov [rax+rsi*1], r10b

`rsi`作为偏移量和计数器：

    inc rsi

继续循环

    jmp inject_loop:

在`inject_finished`程序出附上`ret`操作符(opcode)`0xc3`

    inject_finished:
        mov byte [rax+rsi*1], 0xc3

一般，操作符(opcode)指指令而字节码(bytecode)不仅包含操作符还包含参数，成为操作数(operand)。

### 返回代码

代码返回而不是跳转或被调用的原因在于，这更充分模拟了类似有漏洞应用在缓冲区溢出时的环境。有效载荷会返回，因此，当shellcode被加载后，它应该返回。

首先调用`ret_to_shellcode`。这会把`exit`的地址推入栈顶，于是shellcode结束后返回`exit`的地址。

    call ret_to_shellcode

原始的返回地址被覆盖为为shellcode的地址，并且进入(returned into)

    ret_to_shellcode:
        push rax
        ret

当shellcode结束时，将返回到`exit`函数优雅的退出

    exit：
        push 60
        pop rax
        xor rdi, rdi
        syscall

### 执行loader

编译链接吧

     ~/Work/project/blackhat/shellcode  nasm -felf64 loader64.s -o loader64.o
     ~/Work/project/blackhat/shellcode  ld loader64.o -o loader64
     ~/Work/project/blackhat/shellcode  ./loader64 $(echo -en "\x48\x31\xff\x6a\x69\x58\x0f\x05\x57\x57\x5e\x5a\x48\xbf\x6a\x2f\x62\x69\x6e\x2f\x73\x68\x48\xc1\xef\x08\x57\x54\x5f\x6a\x3b\x58\x0f\x05")
    [reverland@gentoo shellcode]$

这个shellcode来自之前启动一个shell的shellcode，注意提示符。

## 基于返回的载入器

基于返回的代码也能用载入器测试，而且更小，不需要分配内存。

    _start:
        pop rbx
        pop rbx
        pop rsp ; rsp现在指向第一个参数
        ret

只是我觉得，似乎参数位置是不可执行的。关于ROP，以后说吧

最后还有些动态载入和动态socket载入器。当shellcode依赖有漏洞二进制程序上下文时包含一个链接的动态部分，这是啥我现在还不知道。。。。。。

下一篇[Dynamic shellcode](http://blackhat.life/Shellcode/Dynamic)




