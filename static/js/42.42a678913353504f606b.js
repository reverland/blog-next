webpackJsonp([42,192],{580:function(n,o){n.exports={rawContent:"\n\n## POST\n\nPower-on  Self-Test, 定位设备\n\n## 主引导记录\n\n如果设备的启动扇区的511和512字节是`0x55`和`0xAA`。BIOS会发现这样的启动扇区，载入内存`0x0000:0x7c00`(有些是`0x7c0:0x0000`， 同一个物理地址)。让`CS:IP`在启动扇区的最开始是个好的实践。\n\n执行被移交给刚加载的启动记录。软盘上所有的512字节都会是可执行代码。硬盘上则在偏移为`0x0000-0x01bd`的主引导记录处放置可执行代码。然后是四个主分区的表条目，每个条目使用16字节(`0x01fd-0x01be`),还有两字节的签名(`0x01ef-0x01ff`)\n\n## 早期环境\n\n早期执行环境高度依赖实现。特定的BIOS有特定的实现。不要做关于寄存器中内容的任何假设。也许被初始化为0,也许包含假的值。\n\nCPU现在在实模式。你不仅要写激活保护模式的代码还要添加测试条件看看有没有激活。\n\n## 内核\n\n启动载入器把内核载入内存并移交控制权。\n\n## 载入\n\n我们已经知道要载入什么，但不知道如何载入。\n\n如果从硬盘载入，引导记录(boot record)只有446字节大小。以下是内核镜像启动前必须要做的：\n\n- 从哪个分区启动\n- 找到启动分区上的内核镜像\n- 将内核镜像载入内存\n- 激活实模式\n- 为内核准备运行时环境\n\n不用按顺序来，但调用`kmain()`之前做完这些。\n\nTo make things worse，gcc只生成保护模式的可执行代码，所以这部分是你用C做不到的。\n\n有几种解决问题的方式：\n\n- geek loading：把上面列出的一切都挤压到引导记录中。这几乎不可能，会让接下来的特例处理和有用的错误信息无处安放。\n- One-stage loading: 写一个stub来转换，链接到内核镜像之前。引导记录加载内核镜像(在1mb(因为`[ES:BX]`0xffff x 0xffff = 1114095b约为1mb)内存标志下,实模式的最大内存上限),跳转到stub，stub转换到保护模式并准备运行环境，跳入内核。\n- Two-stage loading: 写一个分开的stub，这个stub载入到1mb内存标志下，然后做以上列表中的所有事。\n\n### 传统方式\n\n传统，MBR重定位到`0x0000:0x0600`，找到有用分区的分区表，载入分区表的第一个扇区(分区引导记录)至`0x0000:0x7c00`，并跳转到该地址。这叫链式载入，想要自己写的引导记录能双启动的话就模仿这种方式。\n\n### 简单方法\n\n除非你真得想因为教学目的自制启动载入器(记录/stub)，推荐使用可用的启动载入器。\n\n其中最突出的是GRUB，一个two-stage启动载入器，不仅提供能链式载入的启动菜单，而且准备好环境(包括保护模式和读取BIOS上有价值的信息)，把普通的可执行文件作为内核载入(而不是像很多启动载入器要求flat binary(不包含任何头的二进制文件))，支持可选的内核模块，不同的文件系统，甚至无盘启动(如果配置得当)\n\n- [How computers boot up](http://duartes.org/gustavo/blog/post/how-computers-boot-up)\n- [The Kernel Boot Process](http://duartes.org/gustavo/blog/post/kernel-boot-process)\n- [Inside the Linux boot process](http://www.ibm.com/developerworks/library/l-linuxboot/index.html)\n",metaData:{layout:"post",title:"boot sequence",excerpt:"notes from osdev.org",category:"os",tags:["os"],disqus:!0}}}});