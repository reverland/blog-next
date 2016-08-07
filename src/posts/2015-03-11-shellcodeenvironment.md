---
layout: post
title: "Shellcode/Environment"
excerpt: "blackhat.life/shellcode系列"
category: exploit
tags: [shellcode]
disqus: true
---



源自：[blackhat.life/Shellcode/Environment](http://blackhat.life/Shellcode/Environment)，意译，原文是用gas的，我比较喜欢nasm语法。。。。。。

一般汇编文件开头这样写入口：

    global _start
    _start:

然后，比如64位，

    nasm -f elf64 get_pc_64.s

最后链接：

    ld get_pc_64.o -o get_pc_64

可以用gdb来载入查看

     ~/Work/project/blackhat/shellcode  gdb -q a.out
    Reading symbols from /home/reverland/Work/project/blackhat/shellcode/a.out...(no debugging symbols found)...done.
    (gdb) disassemble _start,+10
    Dump of assembler code from 0x4000b0 to 0x4000ba:
       0x00000000004000b0 <_start+0>:       jmp    0x4000b3 <startup>
       0x00000000004000b2 <pc+0>:   nop
       0x00000000004000b3 <startup+0>:      lea    rax,[rip+0xfffffffffffffff8]        # 0x4000b2 <pc>
    End of assembler dump.

不过只是为了看汇编效果的话，不用链接直接看就是

    ~ objdump -d -M intel last_call_32.o
    last_call_32.o:     file format elf32-i386
    
    Disassembly of section .text:
    
    00000000 <_start>:
       0:   8b 44 24 fc             mov    eax,DWORD PTR [esp-0x4]

另外`ndisasm`和`rasm2`用不顺手，怎么和我想得到的结果不一样= =

好了，废话完了，正文。

---

shellcode能在当前环境下，探测指令集架构，程序指针，上一个返回的地址，或者绕过和探测int3断点。

## 探测指令集架构

[Architecture Spanning Shellcode](http://phrack.org/issues/57/17.html)

## GetPc

GetPc是用来获得当前指令指针的技术。如果写自修改shellcode这个挺游泳，或者对那些必须知道自己所处环境的shellcode，因为环境信息在代码执行前不可预知。

### x86

call会把下一行地址压栈

    jmp startup
    getpc:
       mov eax [esp]
       ret
    startup:
    call getpc       ; the %eax register now contains %eip on the next line

### x64

同理

    jmp startup
    getpc:
       mov rax, [rsp]
       ret
    startup:
    call getpc       ; the %rax register now contains %rip on the next line 

或者x64可以直接操作rip

    jmp startup
    pc:
      nop
    startup:
      lea rax, [rel pc]  ; the %rax register now contains the address of `pc'.

## 上次调用返回地址

一般情况下，在缓冲区溢出攻击中执行shellcode，假设nop sled没有改变堆栈，函数的返回地址是`[rsp-0x8]`或者`[esp-0x4]`，就是在溢出过程中覆盖的掉那个堆栈返回的地址。很多情况下，这能在写多态shellcode时替代GetPc. alphanumeric last call在64位系统中有13字节。

### 32位

Null-free的shellcode(没有`\x00`)

    mov eax, [esp-0x4]

### 64位

Null-free

    mov [rax], [rsp-0x8]

## int3断点

int3断点可以被探测出来。

    global _start
    _start:
    jmp startup
    
    go_retro:
    pop rcx
    inc rcx
    jmp [rcx]
    
    startup:
    call go_retro
    
    volatile_segment:
    push 0x3458686a
    push 0x0975c084
    nop

关键的代码在

    push 0x3458686a
    push 0x0975c084

这是啥呢？

     ~/Work/project/blackhat/shellcode  rasm2 -d "6a6858346885c07509"
    push 0x68
    pop eax
    xor al, 0x68
    test eax, eax
    jne 0x12

当在第二个push加断点时，会把上一个字节暂改为`\xcc`

    000000000000000d <volatile_segment>:
       d:   68 6a 68 58 cc          push   0xcc58686a
      12:   68 84 c0 75 09          push   0x975c084
      17:   90                      nop

这时，推到栈上的就是：

     ~/Work/project/blackhat/shellcode  rasm2 -d "6a685834cc85c07509"
    push 0x68
    pop eax
    xor al, 0xffffffcc
    test eax, eax
    jne 0x12

这样就会向前跳0x12而不是激发断点。

我们可以试试，下次再写loader，所以。。。

     ~/Work/project/blackhat/shellcode  gdb -q detect_breakpoint
    Reading symbols from /home/lyy/Work/project/blackhat/shellcode/detect_breakpoint...(no debugging symbols found)...done.
    (gdb) disassemble _start,+20
    Dump of assembler code from 0x4000b0 to 0x4000c4:
       0x00000000004000b0 <_start+0>:       jmp    0x4000b8 <startup>
       0x00000000004000b2 <go_retro+0>:     pop    rcx
       0x00000000004000b3 <go_retro+1>:     inc    rcx
       0x00000000004000b6 <go_retro+4>:     jmp    QWORD PTR [rcx]
       0x00000000004000b8 <startup+0>:      call   0x4000b2 <go_retro>
       0x00000000004000bd <volatile_segment+0>:     push   0x3458686a
       0x00000000004000c2 <volatile_segment+5>:     push   0x975c084
    End of assembler dump.
    (gdb) b *0x00000000004000c2
    Breakpoint 1 at 0x4000c2
    (gdb) r
    Starting program: /home/lyy/Work/project/blackhat/shellcode/detect_breakpoint 
    warning: no loadable sections found in added symbol-file system-supplied DSO at 0x7ffff7ffd000
    
    Program received signal SIGSEGV, Segmentation fault.
    0x00000000004000b6 in go_retro ()
    (gdb) 

没有碰到断点！！(那啥sigsegv了，看样子shellcode loader应该先写。。。)

ps: 这让我想起来之前反gdb调试的一些学习，下次再写吧

## 跑题的吐槽

作为一个什么都会点什么都不会的渣，也被推到投简历找实习的浪潮之中，立马被北邮的互联网求职氛围吓尿了，看到[bswgd在《谈谈在校程序员技能培养》](http://yanyiwu.com/work/2015/03/06/programmer-in-school.html)中谈到：

> 几乎是从事互联网行业的人都知道，北邮人找互联网的工作特别拿手。 甚至被说成如蝗虫过境一般。事实却是也是如此。

往身边看看，真是这感觉。。。

看了[依云仙子的《再三错过》](http://lilydjwg.is-programmer.com/posts/58837.html)中心理好难过，阴影一直如影随形。

于是在大家都投完简历我还是拖延着什么也没写，只是把仙子当年的感慨找来看了看。

至于我自己，还是趁着没毕业多调查下吧





