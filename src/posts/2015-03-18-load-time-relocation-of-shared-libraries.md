---
layout: post
title: "Load time relocation of shared libraries"
excerpt: "some notes, and some translations"
category: linux
tags: [linux]
disqus: true
---


想起昨天某厂电面被问到GOT怎么组织的= =，哈？我回头翻了翻Eli Bendersky的[Load-time relocation of shared libraries](http://eli.thegreenplace.net/2011/08/25/load-time-relocation-of-shared-libraries/)和[Position Independent Code (PIC) in shared libraries](http://eli.thegreenplace.net/2011/11/03/position-independent-code-pic-in-shared-libraries/)。[Eli Bendersky](http://eli.thegreenplace.net)的网站我非常喜欢，他总能把复杂的问题以一种探索性的方式直观的阐释。我记得当我非常好奇gdb的原理时曾经看到过他的[How debuggers work: Part 1 - Basics ](http://eli.thegreenplace.net/2011/01/23/how-debuggers-work-part-1/)和[How debuggers work: Part 2 - Breakpoints](http://eli.thegreenplace.net/2011/01/27/how-debuggers-work-part-2-breakpoints/)，都是难得一见的精品，值得一看

不吐槽面试了，作为面试简直是个惨不忍睹的失败展示，大概让面试官觉得我很low没发展前途，哈哈哈。不过被虐了感觉真好，要有空去面面各种开发测试产品设计。。。。。。一个人怎么能有这么多兴趣！

正文，省得过一段又忘的干干净净，意译[Load-time relocation of shared libraries ](http://eli.thegreenplace.net/2011/08/25/load-time-relocation-of-shared-libraries/)x64对这个都没支持了= =

程序有时候，几乎总是要导入来自外部的目标代码。有两种载入的方式：

- 载入时重定位
- PIC(位置无关代码)

讲讲第一种。

可执行文件，动态链接库，blablablabla的什么能直接被机器执行的文件，都是机器码(废话...)要让文件可以执行和装载，必须符合ELF文件规范。操作系统根据ELF文件中提供的信息，按照规范把对应的代码段映射到内存空间的对应位置上去。内存空间大概看上去像这样：

![x86内存空间地址分布](http://static.duartes.org/img/blogPosts/linuxFlexibleAddressSpaceLayout.png)

可以看到，文件映射，动态库啥的都是放到差不多中间的位置。

举个例子，我们关心几个问题，`ml_func`内如何解析(reference)`myglob`呢

```c
int myglob = 42;

int ml_func(int a, int b)
{
    myglob += a;
    return b + myglob;
}
```

编译为非PIC，x86 动态共享库

     ~/Work/project/blackhat/eli  gcc -m32 -shared -o libmlreloc.so ml_mainreloc.o
    /usr/lib/gcc/x86_64-pc-linux-gnu/4.7.3/../../../../x86_64-pc-linux-gnu/bin/ld: ml_mainreloc.o: warning: relocation against `myglob' in readonly section `.text'.
    /usr/lib/gcc/x86_64-pc-linux-gnu/4.7.3/../../../../x86_64-pc-linux-gnu/bin/ld: warning: creating a DT_TEXTREL in object.

把`myglob`重定位到了只读的`.text`。。。不过对研究没啥影响。

首先看看库的入口地址，链接器会从入口地址('.text'的开始位置)开始把代码载入调用者的进程空间。

     ~/Work/project/blackhat/eli  readelf -h libmlreloc.so
    ELF Header:
        ...
      Entry point address:               0x420
        ...

反汇编共享库

    ~/Work/project/blackhat/eli  objdump -d -Mintel libmlreloc.so
    
    libmlreloc.so:     file format elf32-i386
    ...
    0000054c <ml_func>:
     54c:   55                      push   ebp
     54d:   89 e5                   mov    ebp,esp
     54f:   8b 15 00 00 00 00       mov    edx,DWORD PTR ds:0x0
     555:   8b 45 08                mov    eax,DWORD PTR [ebp+0x8]
     558:   01 d0                   add    eax,edx
     55a:   a3 00 00 00 00          mov    ds:0x0,eax
     55f:   8b 15 00 00 00 00       mov    edx,DWORD PTR ds:0x0
     565:   8b 45 0c                mov    eax,DWORD PTR [ebp+0xc]
     568:   01 d0                   add    eax,edx
     56a:   5d                      pop    ebp
     56b:   c3                      ret    
     ...

`myglob`即`ds:0x0`丫的是什么！这个地址，在载入其它程序进程空间后会被替代。

如何呢？

     ~/Work/project/blackhat/eli  readelf -r libmlreloc.so
    
    Relocation section '.rel.dyn' at offset 0x358 contains 11 entries:
     Offset     Info    Type            Sym.Value  Sym. Name
    00001ee8  00000008 R_386_RELATIVE   
    00001eec  00000008 R_386_RELATIVE   
    00002014  00000008 R_386_RELATIVE   
    00000551  00000601 R_386_32          00002018   myglob
    0000055b  00000601 R_386_32          00002018   myglob
    00000561  00000601 R_386_32          00002018   myglob

看看动态库文件中怎么记录该怎么替换哪里要替换的信息吧

     ~/Work/project/blackhat/eli  readelf -r libmlreloc.so
    
    Relocation section '.rel.dyn' at offset 0x358 contains 11 entries:
     Offset     Info    Type            Sym.Value  Sym. Name
    00001ee8  00000008 R_386_RELATIVE   
    00001eec  00000008 R_386_RELATIVE   
    00002014  00000008 R_386_RELATIVE   
    00000551  00000601 R_386_32          00002018   myglob
    0000055b  00000601 R_386_32          00002018   myglob
    00000561  00000601 R_386_32          00002018   myglob

有这么好几处要替换的，看下位置和objdump的位置一样。

根据ELF文件规则。这些地址这样替换:

    Offset位置的地址=Sym.Value(用nm可以看到将来映射后相对于虚拟载入基址的偏移) + 库文件载入基址

下面看看看。作为初始化了的数据，`myglob`是放在`.data`中的。我们看看`.data`在哪。

     ~/Work/project/blackhat/eli  readelf --segments libmlreloc.so
    
    Elf file type is DYN (Shared object file)
    Entry point 0x420
    There are 7 program headers, starting at offset 52
    
    Program Headers:
      Type           Offset   VirtAddr   PhysAddr   FileSiz MemSiz  Flg Align
      LOAD           0x000000 0x00000000 0x00000000 0x005fc 0x005fc R E 0x1000
      LOAD           0x000ee8 0x00001ee8 0x00001ee8 0x00134 0x00138 RW  0x1000
      DYNAMIC        0x000ef4 0x00001ef4 0x00001ef4 0x000f8 0x000f8 RW  0x4
      GNU_EH_FRAME   0x000580 0x00000580 0x00000580 0x0001c 0x0001c R   0x4
      GNU_STACK      0x000000 0x00000000 0x00000000 0x00000 0x00000 RW  0x4
      GNU_RELRO      0x000ee8 0x00001ee8 0x00001ee8 0x00118 0x00118 R   0x1
      PAX_FLAGS      0x000000 0x00000000 0x00000000 0x00000 0x00000     0x4
    
     Section to Segment mapping:
      Segment Sections...
       00     .hash .gnu.hash .dynsym .dynstr .gnu.version .gnu.version_r .rel.dyn .rel.plt .init .plt .text .fini .eh_frame_hdr .eh_frame 
       01     .init_array .fini_array .jcr .dynamic .got .got.plt .data .bss 
       02     .dynamic 
       03     .eh_frame_hdr 
       04     
       05     .init_array .fini_array .jcr .dynamic .got 
       06     

`.data`是第二个段，载入后的虚拟地址是`0x1ee8`，大小是`0x00134`

    In [18]: hex(0x1ee8+0x134)
    Out[18]: '0x201c'

第二个段扩展到`0x201c`包含`myglob`(`0x2018`)

linux下有个方便的`dl_iterate_phdr`函数来查看运行时载入的动态链接库。gdb的`i shared`也可以看到载入库的地址，不过只能看到入口地址而不能看到每个段。

用这么个例子来看：

```c
#define _GNU_SOURCE
#include <link.h>
#include <stdlib.h>
#include <stdio.h>


static int header_handler(struct dl_phdr_info* info, size_t size, void* data)
{
    printf("name=%s (%d segments) address=%p\n",
            info->dlpi_name, info->dlpi_phnum, (void*)info->dlpi_addr);
    for (int j = 0; j < info->dlpi_phnum; j++) {
         printf("\t\t header %2d: address=%10p\n", j,
             (void*) (info->dlpi_addr + info->dlpi_phdr[j].p_vaddr));
         printf("\t\t\t type=%u, flags=0x%X\n",
                 info->dlpi_phdr[j].p_type, info->dlpi_phdr[j].p_flags);
    }
    printf("\n");
    return 0;
}


extern int ml_func(int, int);


int main(int argc, const char* argv[])
{
    dl_iterate_phdr(header_handler, NULL);

    int t = ml_func(argc, argc);
    return t;
}
```

那啥回调啥原理不说了，我也不懂，反正用来看载入地址就好。

     ✘  ~/Work/project/blackhat/eli  gcc -std=c99 -m32 -g -c driver.c -o driver.o
     ~/Work/project/blackhat/eli  gcc -m32 -o driver driver.o -L. -lmlreloc 
直接gdb会话：

     ~/Work/project/blackhat/eli  gdb -q driver
    Reading symbols from /home/reverland/Work/project/blackhat/eli/driver...done.
    (gdb) b driver.c:31
    Breakpoint 1 at 0x804874b: file driver.c, line 31.
    (gdb) r
    Starting program: /home/reverland/Work/project/blackhat/eli/driver 
    warning: the debug information found in "/usr/lib64/debug/lib64/ld-2.17.so.debug" does not match "/lib/ld-linux.so.2" (CRC mismatch).
    ...
    name=/home/reverland/Work/project/blackhat/eli/libmlreloc.so (7 segments) address=0xf7fd8000
                     header  0: address=0xf7fd8000
                             type=1, flags=0x5
                     header  1: address=0xf7fd9ee8
                             type=1, flags=0x6
                     header  2: address=0xf7fd9ef4
                             type=2, flags=0x6
                     header  3: address=0xf7fd8580
                             type=1685382480, flags=0x4
                     header  4: address=0xf7fd8000
                             type=1685382481, flags=0x6
                     header  5: address=0xf7fd9ee8
                             type=1685382482, flags=0x4
                     header  6: address=0xf7fd8000
                             type=1694766464, flags=0x2800
    ...
    (gdb) p &myglob
    $1 = (int *) 0xf7fda018 <myglob>
    (gdb) 


忽视调试信息的警告，那个我记得好像是gentoo的某个bug。我们看到，`libmlreloc.so`被载入到了`0xf7fd8000`，别太在意这个地址，按理说ALSR啥的这个地址变化挺正常，虽然我记得gdb中默认禁用alsr了。。。

第二个段在`0xf7fd9ee8`。这正好就是载入基址(`0xf7fd8000`)+VirtAddr(就是映射到目标进程空间后的偏移`0x00001ee8`)

另一方面，我们看到`myglob`在`0xf7fda018`。这个地址正好是载入基址(`0xf7fd8000`)+myglob的偏移(`0x00002018`)

我们最后在gdb中看下现在的(载入动态库后)的反汇编结果：

    (gdb) disas /r ml_func
    Dump of assembler code for function ml_func:
       0xf7fd854c <+0>:     55      push   ebp
       0xf7fd854d <+1>:     89 e5   mov    ebp,esp
       0xf7fd854f <+3>:     8b 15 18 a0 fd f7       mov    edx,DWORD PTR ds:0xf7fda018
       0xf7fd8555 <+9>:     8b 45 08        mov    eax,DWORD PTR [ebp+0x8]
       0xf7fd8558 <+12>:    01 d0   add    eax,edx
       0xf7fd855a <+14>:    a3 18 a0 fd f7  mov    ds:0xf7fda018,eax
       0xf7fd855f <+19>:    8b 15 18 a0 fd f7       mov    edx,DWORD PTR ds:0xf7fda018
       0xf7fd8565 <+25>:    8b 45 0c        mov    eax,DWORD PTR [ebp+0xc]
       0xf7fd8568 <+28>:    01 d0   add    eax,edx
       0xf7fd856a <+30>:    5d      pop    ebp
       0xf7fd856b <+31>:    c3      ret    
    End of assembler dump.

呵，已经替换过了

综上，一切都很明显了，动态链接库ELF文件中有乱七八糟东西如何映射到目的进程的进程空间中去何处的信息，其中就包括有些地址要载入时替换的信息。操作系统负责这件事，在程序载入阶段计算地址，把该换的换掉。

### 函数调用重定位

换下`ml_main.c`：

```c
int myglob = 42;

int ml_util_func(int a)
{
    return a + 1;
}

int ml_func(int a, int b)
{
    int c = b + ml_util_func(a);
    myglob += c;
    return b + myglob;
}
```

`ml_util_func`被调用,编译

     ~/Work/project/blackhat/eli  gcc -m32 -g -c ml_main.c -o ml_mainreloc.o
     ~/Work/project/blackhat/eli  gcc -m32 -shared -o libmlreloc.so ml_mainreloc.o
    /usr/lib/gcc/x86_64-pc-linux-gnu/4.7.3/../../../../x86_64-pc-linux-gnu/bin/ld: ml_mainreloc.o: warning: relocation against `myglob' in readonly section `.text'.
    /usr/lib/gcc/x86_64-pc-linux-gnu/4.7.3/../../../../x86_64-pc-linux-gnu/bin/ld: warning: creating a DT_TEXTREL in object.

啥玩意：

    0000057c <ml_util_func>:
     57c:   55                      push   %ebp
     57d:   89 e5                   mov    %esp,%ebp
     57f:   8b 45 08                mov    0x8(%ebp),%eax
     582:   83 c0 01                add    $0x1,%eax
     585:   5d                      pop    %ebp
     586:   c3                      ret    
    
    00000587 <ml_func>:
     587:   55                      push   %ebp
     588:   89 e5                   mov    %esp,%ebp
     58a:   83 ec 14                sub    $0x14,%esp
     58d:   8b 45 08                mov    0x8(%ebp),%eax
     590:   89 04 24                mov    %eax,(%esp)
     593:   e8 fc ff ff ff          call   594 <ml_func+0xd>
     598:   8b 55 0c                mov    0xc(%ebp),%edx
     59b:   01 d0                   add    %edx,%eax
     59d:   89 45 fc                mov    %eax,-0x4(%ebp)
     5a0:   8b 15 00 00 00 00       mov    0x0,%edx
     5a6:   8b 45 fc                mov    -0x4(%ebp),%eax
     5a9:   01 d0                   add    %edx,%eax
     5ab:   a3 00 00 00 00          mov    %eax,0x0
     5b0:   8b 15 00 00 00 00       mov    0x0,%edx
     5b6:   8b 45 0c                mov    0xc(%ebp),%eax
     5b9:   01 d0                   add    %edx,%eax
     5bb:   c9                      leave  
     5bc:   c3                      ret    
     5bd:   66 90                   xchg   %ax,%ax
     5bf:   90                      nop

注意`593`那行。

     593:   e8 fc ff ff ff          call   594 <ml_func+0xd>

`call(e8)`是相对寻址，`fffffffc`就是`-4`，即call指令调用自身(`598-4`)。

显然，这在载入时要被替换。看看ELF中关于重定位符号映射后偏移信息

     ~/Work/project/blackhat/eli  readelf -r libmlreloc.so
    
    Relocation section '.rel.dyn' at offset 0x380 contains 12 entries:
     Offset     Info    Type            Sym.Value  Sym. Name
    00001ee8  00000008 R_386_RELATIVE   
    00001eec  00000008 R_386_RELATIVE   
    00002014  00000008 R_386_RELATIVE   
    00000594  00000902 R_386_PC32        0000057c   ml_util_func
    000005a2  00000601 R_386_32          00002018   myglob
    ...

当动态链接库载入时，`ml_util_func`所在的位置对链接器是已知的(基址(0xf7fd8000)+偏移(0x57c))，594这个要替换位置链接器也是已知的。

偏移地址通过`R_386_PC32`的规则计算就好`0x57c-0x597+0xffffffff=0xffffffe4`

通过gdb会话可以看到是这样：

     ~/Work/project/blackhat/eli  gdb -q driver
    Reading symbols from /home/lyy/Work/project/blackhat/eli/driver...done.
    (gdb)  b driver.c:31
    Breakpoint 1 at 0x804874b: file driver.c, line 31.
    (gdb) r
    Starting program: /home/lyy/Work/project/blackhat/eli/driver 
    warning: the debug information found in "/usr/lib64/debug/lib64/ld-2.17.so.debug" does not match "/lib/ld-linux.so.2" (CRC mismatch).
    
    name= (10 segments) address=(nil)
                     header  0: address= 0x8048034
                             type=6, flags=0x5
                     header  1: address= 0x8048174
                             type=3, flags=0x4
                     header  2: address= 0x8048000
                             type=1, flags=0x5
                     header  3: address= 0x8049ef8
                             type=1, flags=0x6
                     header  4: address= 0x8049f04
                             type=2, flags=0x6
                     header  5: address= 0x8048188
                             type=4, flags=0x4
                     header  6: address= 0x8048838
                             type=1685382480, flags=0x4
                     header  7: address=     (nil)
                             type=1685382481, flags=0x6
                     header  8: address= 0x8049ef8
                             type=1685382482, flags=0x4
                     header  9: address=     (nil)
                             type=1694766464, flags=0x2800
    
    name=/home/lyy/Work/project/blackhat/eli/libmlreloc.so (7 segments) address=0xf7fd8000
                     header  0: address=0xf7fd8000
                             type=1, flags=0x5
                     header  1: address=0xf7fd9ee8
                             type=1, flags=0x6
                     header  2: address=0xf7fd9ef4
                             type=2, flags=0x6
                     header  3: address=0xf7fd85d4
                             type=1685382480, flags=0x4
                     header  4: address=0xf7fd8000
                             type=1685382481, flags=0x6
                     header  5: address=0xf7fd9ee8
                             type=1685382482, flags=0x4
                     header  6: address=0xf7fd8000
                             type=1694766464, flags=0x2800
    
    name=/lib32/libc.so.6 (11 segments) address=0xf7df4000
                     header  0: address=0xf7df4034
                             type=6, flags=0x5
                     header  1: address=0xf7f67788
                             type=3, flags=0x4
                     header  2: address=0xf7df4000
                             type=1, flags=0x5
                     header  3: address=0xf7f9c1e4
                             type=1, flags=0x6
                     header  4: address=0xf7f9dd9c
                             type=2, flags=0x6
                     header  5: address=0xf7df4194
                             type=4, flags=0x4
                     header  6: address=0xf7f9c1e4
                             type=7, flags=0x4
                     header  7: address=0xf7f677a0
                             type=1685382480, flags=0x4
                     header  8: address=0xf7df4000
                             type=1685382481, flags=0x6
                     header  9: address=0xf7f9c1e4
                             type=1685382482, flags=0x4
                     header 10: address=0xf7df4000
                             type=1694766464, flags=0x2800
    
    name=/lib/ld-linux.so.2 (7 segments) address=0xf7fdc000
                     header  0: address=0xf7fdc000
                             type=1, flags=0x5
                     header  1: address=0xf7ffcc80
                             type=1, flags=0x6
                     header  2: address=0xf7ffcef8
                             type=2, flags=0x6
                     header  3: address=0xf7ff8f00
                             type=1685382480, flags=0x4
                     header  4: address=0xf7fdc000
                             type=1685382481, flags=0x6
                     header  5: address=0xf7ffcc80
                             type=1685382482, flags=0x4
                     header  6: address=0xf7fdc000
                             type=1694766464, flags=0x2800
    
    
    Breakpoint 1, main (argc=1, argv=0xffffcd84) at driver.c:31
    31      }
    (gdb) disas ml_util_func 
    Dump of assembler code for function ml_util_func:
       0xf7fd857c <+0>:     push   ebp
       0xf7fd857d <+1>:     mov    ebp,esp
       0xf7fd857f <+3>:     mov    eax,DWORD PTR [ebp+0x8]
       0xf7fd8582 <+6>:     add    eax,0x1
       0xf7fd8585 <+9>:     pop    ebp
       0xf7fd8586 <+10>:    ret    
    End of assembler dump.
    (gdb) disas /r ml_func
    Dump of assembler code for function ml_func:
       0xf7fd8587 <+0>:     55      push   ebp
       0xf7fd8588 <+1>:     89 e5   mov    ebp,esp
       0xf7fd858a <+3>:     83 ec 14        sub    esp,0x14
       0xf7fd858d <+6>:     8b 45 08        mov    eax,DWORD PTR [ebp+0x8]
       0xf7fd8590 <+9>:     89 04 24        mov    DWORD PTR [esp],eax
       0xf7fd8593 <+12>:    e8 e4 ff ff ff  call   0xf7fd857c <ml_util_func>
       0xf7fd8598 <+17>:    8b 55 0c        mov    edx,DWORD PTR [ebp+0xc]
       0xf7fd859b <+20>:    01 d0   add    eax,edx
       0xf7fd859d <+22>:    89 45 fc        mov    DWORD PTR [ebp-0x4],eax
       0xf7fd85a0 <+25>:    8b 15 18 a0 fd f7       mov    edx,DWORD PTR ds:0xf7fda018
       0xf7fd85a6 <+31>:    8b 45 fc        mov    eax,DWORD PTR [ebp-0x4]
       0xf7fd85a9 <+34>:    01 d0   add    eax,edx
       0xf7fd85ab <+36>:    a3 18 a0 fd f7  mov    ds:0xf7fda018,eax
       0xf7fd85b0 <+41>:    8b 15 18 a0 fd f7       mov    edx,DWORD PTR ds:0xf7fda018
       0xf7fd85b6 <+47>:    8b 45 0c        mov    eax,DWORD PTR [ebp+0xc]
       0xf7fd85b9 <+50>:    01 d0   add    eax,edx
       0xf7fd85bb <+52>:    c9      leave  
       0xf7fd85bc <+53>:    c3      ret    
    End of assembler dump.

## 为何需要调用重定向

为什么动态库作为一个整体载入进程时，位置都是确定的，却要经过重定向计算？

简单来说，在声明时对`ml_util_func`以static关键字声明，把函数作为只模块内可用的话，就不存在重定位了。

     ~/Work/project/blackhat/eli  gcc -m32 -g -c ml_main.c -o ml_mainreloc.o      
     ~/Work/project/blackhat/eli  gcc -m32 -shared -o libmlreloc.so ml_mainreloc.o
    /usr/lib/gcc/x86_64-pc-linux-gnu/4.7.3/../../../../x86_64-pc-linux-gnu/bin/ld: ml_mainreloc.o: warning: relocation against `myglob' in readonly section `.text'.
    /usr/lib/gcc/x86_64-pc-linux-gnu/4.7.3/../../../../x86_64-pc-linux-gnu/bin/ld: warning: creating a DT_TEXTREL in object.
     ~/Work/project/blackhat/eli  objdump -d -Mintel libmlreloc.so                
    
    libmlreloc.so:     file format elf32-i386
    
    Disassembly of section .init:
    
    0000054c <ml_util_func>:
     54c:   55                      push   ebp
     54d:   89 e5                   mov    ebp,esp
     54f:   8b 45 08                mov    eax,DWORD PTR [ebp+0x8]
     552:   83 c0 01                add    eax,0x1
     555:   5d                      pop    ebp
     556:   c3                      ret    
    
    00000557 <ml_func>:
     557:   55                      push   ebp
     558:   89 e5                   mov    ebp,esp
     55a:   83 ec 14                sub    esp,0x14
     55d:   8b 45 08                mov    eax,DWORD PTR [ebp+0x8]
     560:   89 04 24                mov    DWORD PTR [esp],eax
     563:   e8 e4 ff ff ff          call   54c <ml_util_func>
     ...

产生这个现象的原因就此一目了然，如果动态库中存在全局变量，也许会被覆盖和改写，其它载入的动态库就不能知道这个变量的相对位置，需要动态重定位。

### 于可执行文件中引用动态库中的数据

上例中`myglob`变量只在动态库内部使用，如果在外部引用呢？这存在一个特殊的重定位过程。

```c
#include <stdio.h>

extern int ml_func(int, int);
extern int myglob;

int main(int argc, const char* argv[])
{
    printf("addr myglob = %p\n", (void*)&myglob);
    int t = ml_func(argc, argc);
    return t;
}
```

重新编译运行：

     ✘  ~/Work/project/blackhat/eli  gcc -std=c99 -m32 -g -c driver.c -o driver.o    
     ~/Work/project/blackhat/eli  gcc -m32 -o driver driver.o -L. -lmlreloc   
     ~/Work/project/blackhat/eli  ./driver
    addr myglob = 0x804a024

`0x804a024`显然是在主进程而不是后来载入的动态库虚拟地址区域。而`myglob`是被赋值的。

从gdb中查看引用`myglob`的位置：

    (gdb) p &myglob
    $1 = (<data variable, no debug info> *) 0x804a024 <myglob>

查看elf文件

     ✘  ~/Work/project/blackhat/eli  readelf -r driver
    
    Relocation section '.rel.dyn' at offset 0x440 contains 2 entries:
     Offset     Info    Type            Sym.Value  Sym. Name
    08049ffc  00000406 R_386_GLOB_DAT    00000000   __gmon_start__
    0804a024  00000805 R_386_COPY        0804a024   myglob

有个`R_386_COPY`类型，该类型表示直接把符号复制到`Sym.Value`的位置。

在`.symtab`有相应信息告诉我如何把`myglob`拷贝，包括尺寸`4`

    ~/Work/project/blackhat/eli  readelf -s libmlreloc.so 
    
    Symbol table '.symtab' contains 50 entries:
       Num:    Value  Size Type    Bind   Vis      Ndx Name
       ...
        39: 00002018     4 OBJECT  GLOBAL DEFAULT   21 myglob
       ...

## 结论

载入时重定位是linux下解析载入的内部数据和代码引用的一种方法。PIC是更高级和流行的方式，甚至x86-64已经不支持载入时重定位。

无论如何，希望此文能帮助拨开现代操作系统链接和载入动态库魔法迷雾。

Next, [Position Independent Code (PIC) in shared libraries](http://eli.thegreenplace.net/2011/11/03/position-independent-code-pic-in-shared-libraries/)
