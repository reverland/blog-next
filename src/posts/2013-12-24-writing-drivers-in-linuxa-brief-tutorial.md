---
layout: post
title: "Writing Drivers in Linux:A Brief Tutorial"
excerpt: "内核驱动简明教程"
category: linux
tags: [linux, driver]
disqus: true
---


未完成，因为选的一门课的大作业而翻译，这个简单例子作为一个完整的内核驱动写法展示还行。大概某天会把后面的坑填上。

翻译自[http://www.freesoftwaremagazine.com/articles/drivers\_linux](http://www.freesoftwaremagazine.com/articles/drivers_linux)

> 你是否渴望有minix 1.1相伴的美好日子？那时男人只是男人，并为自己的设备写驱动程序。
>
> ----Linus Torvalds

## 先决条件

为了开发Linux设备驱动，需要理解以下知识[^1]：

- C程序。稍微深入理解C编程，比如指针的使用，位操作函数等等。
- 微处理器编程。需要理解微处理器内部如何工作：内存地址，终端等等。所有这些概念对一个汇编程序员都应该很熟悉。

在Linux中有多种设备。为了简洁，这篇教程仅仅涉及以模块加载的`char`(字符)设备，2.6.x内核将被使用(准确地说是Debian
Sarge下的2.6.8内核[^2], 当前的Debian Stable)

## 用户空间和内核空间

当你写设备驱动时，区分“用户空间”和“内核空间”非常重要：

- 内核空间：Linux(一个内核)以一种简单有效的方式管理机器的硬件，为用户提供一个简单一致的程序接口。同样内核特别是它的设备驱动，组成了一个终端用户/程序员和硬件之间沟通的桥梁。组成内核(例如模块和设备驱动)一部分的任何子程序或函数都被认为是内核空间的一部分。
- 用户空间：终端用户程序，像UNIX
  `shell`或其它基于GUI的应用(比如`kpresenter`[^3])都是用户空间的一部分。显然，这些应用需要和系统硬件交互。然而，它们不直接交互，而是通过内核支持的函数。
  一切如图一所示。

![图一](http://www.freesoftwaremagazine.com/files/nodes/1238/spaces.jpg)

## 用户空间和内核空间接口函数

内核在用户空间提供一些子程序和函数，允许最终用户应用程序员和硬件交互。通常，在UNIX或Linux系统中，这个对话通过子程序或函数按顺序读写文件实现。这样做的原因是Unix设备从用户角度来看作为文件可见。

另一方面，在内核空间，Linux也提供了一些函数和子程序执行和硬件直接交互的低级操作，并且允许从内核空间向用户空间传递信息。

通常，对用户空间(允许使用设备或文件)的每个函数，存在一个内核空间(允许从内核想用户空间传递信息，反之亦然)的等价。这在表一中显示了，当前是空表。它将在不同设备驱动概念介绍时填满。

| 事件          | 用户空间函数  | 内核空间函数  |
| ------------- |:-------------:| -------------:|
| 加载模块      |               |               |
| 打开设备      |               |               |
| 读取设备      |               |               |
| 写入设备      |               |               |
| 关闭设备      |               |               |
| 移除模块      |               |               |

表一：设备驱动事件和它们对应在内核和用户空间的接口函数

## 内核空间和硬件设备之间的接口函数

在内核空间中也有控制设备或者在内核和硬件之间交换信息的函数。表二展示了这些概念。这个表也在相关概念引入时填满。

| 事件          |内核空间函数  |
| ------------- |-------------:|
| 读取数据      |              |
| 写入数据      |              |

表二：设备驱动事件和它们在内核空间与硬件之间交互的函数

## 第一个驱动：在用户空间加载和卸载驱动

我将向你展示如何开发第一个设备驱动，这个驱动将作为一个模块引入。

我们在`nothing.c`文件中写入以下程序。

    #include <linux/module.h>

    MODULE_LICENSE("Dual BSD/GPL");

自从kernel2.6.x版本以来，编译模块变得有点复杂。首先，你必须有一个完整的编译内核源码树。如果你有个Debian
Sarge系统[^4]，你可以参照附录B(在文末)，本文中我假设你们使用3.12.5版内核。

接着，你需要生成一个makefile文件，这个makefile文件命名为`Makefile`:

    obj-m := nothing.o

与早先版本内核不同，现在必须使用你想要加载和使用模块的同一内核编译模块。为了编译它，键入：

    $ make -C /usr/src/linux M=`pwd` modules

这个极简单的模块属于内核空间，一旦加载就是内核空间的一部分。

在用户空间，你可以作为root用户键入以下命令加载模块：

    # insmod nothing.ko

`insmod`命令允许内核中模块的安装，然而，这个特别的模块没啥用。

可以通过查看所有安装的模块来检查模块有没有正确安装：

    # lsmod | grep nothing

最后，可以从内核空间中移除内核：

    # rmmod nothing

通过`lsmod`命令，你可以确认模块不在内核中了。

所有这些在表三中总结：

| 事件          | 用户空间函数  | 内核空间函数  |
| ------------- |:-------------:| -------------:|
| 加载模块      | insmod        |               |
| 打开设备      |               |               |
| 读取设备      |               |               |
| 写入设备      |               |               |
| 关闭设备      |               |               |
| 移除模块      |               |               |

表三：设备驱动事件和它们对应在内核和用户空间的接口函数

## "Hello world"驱动：加载和移除内核空间的驱动

当一个模块载入内核时，通常一些初始任务比如执行如重置设备、准备RAM，准备中断，准备输入/输出端口等等将被执行。

这些任务在内核空间执行，通过必须出现的两个函数(并且显示声明):`module_init`和`module_exit`;它们应答用户空间内当加载和移除模块时使用的`insmod`和`rmmod`命令。总之，用户命令`insmod`和`rmmod`使用内核空间函数`module_init`和`module_exit`。

让我们看看经典程序`Hello world`的实际例子(`hello.c`)：

    #include <linux/init.h>
    #include <linux/module.h>
    #include <linux/kernel.h>

    MODULE_LICENSE("Dual BSD/GPL");

    static int hello_init(void) {
      printk("<1> Hello world!\n");
      return 0;
    }

    static void hello_exit(void) {
      printk("<1> Bye, cruel world\n");
    }

    module_init(hello_init);
    module_exit(hello_exit);

事实上函数`hello_init`和`hello_exit`可以是任何想要的名字。然而，为了把它们作为相应的加载卸载函数，它们必须被作为`module_init`和`module_exit`的参数。

`printk`函数已经介绍过。非常接近著名的`printf`除了它在内核中起作用。`<1>`表示消息的高优先级(低数字)。通过这样，除了在内核系统日志文件中得到消息，也能在系统控制台上收到消息。

这个模块可以用之前同样的命令编译，把它的名字加入Makefile。

    obj-m := nothing.o hello.o

剩下的文章中，我们将Makefile文件作为读者的联系。完整的包含编译内核模块的Makefile文件在附录A中

当模块加载或卸载时，消息将通过`printk`命令呈现在系统控制台上。如果这些消息不再出现在控制台中，你可以通过dmesg命令查看，或者通过`cat /var/log/syslog`[^5]查看系统日志文件

表四展示了两个新函数。

| 事件          | 用户空间函数  | 内核空间函数  |
| ------------- |:-------------:| -------------:|
| 加载模块      | insmod        | module_init   |
| 打开设备      |               |               |
| 读取设备      |               |               |
| 写入设备      |               |               |
| 关闭设备      |               |               |
| 移除模块      | rmmod         | module_exit   |

表四：设备驱动事件和它们对应在内核和用户空间的接口函数

## 完整的memory驱动：驱动的初始部分

我现在展示如何构建一个完整的设备驱动：`memory.c`。这个设备讲允许字符从设备读取读取或写入设备。这个设备，尽管没啥用，却提供了一个展示的示例，因为这是一个完整的驱动。
它也非常容易实现，因为它不和一个真正的硬件设备交互(除了计算机自身)。

为了开发这个驱动，一些新的`#include`语句将被添加添加，这些语句频繁出现在设备驱动中。

memory initial=

    /* 设备驱动必要的includes块 */
    #include <linux/init.h>
    // #include <linux/config.h>  // 2.6.19之后不再有
    #include <linux/module.h>
    #include <linux/kernel.h> /* printk() */
    #include <linux/slab.h> /* kmalloc() */
    #include <linux/fs.h> /* everything... */
    #include <linux/errno.h> /* error codes */
    #include <linux/types.h> /* size_t */
    #include <linux/proc_fs.h>
    #include <linux/fcntl.h> /* O_ACCMODE */
    // #include <asm/system.h> /* cli(), *_flags */ // 不再需要
    #include <asm/uaccess.h> /* copy_from/to_user */

    MODULE_LICENSE("Dual BSD/GPL");

    /* memory.c 中函数声明 */
    int memory_open(struct inode *inode, struct file *filp);
    int memory_release(struct inode *inode, struct file *filp);
    ssize_t memory_read(struct file *filp, char *buf, size_t count, loff_t *f_pos);
    ssize_t memory_write(struct file *filp, char *buf, size_t count, loff_t *f_pos);
    void memory_exit(void);
    int memory_init(void);

    /* 声明常用文件的结构体 */
    /* 结构体file_operations在头文件
    linux/fs.h中定义，用来存储驱动内核模块提供的对
    设备进行各种操作的函数的指针。该结构体的每个域都对应着驱动内核模块用来处理某个被请求的
    事务的函数的地址。*/
    /* 存取函数 */
    struct file_operations memory_fops = {
      read: memory_read,
      write: memory_write,
      open: memory_open,
      release: memory_release
    };

    /* 声明初始和退出函数 */
    module_init(memory_init);
    module_exit(memory_exit);

    /* 驱动全局变量声明 */
    /* Major number */
    int memory_major = 60;
    /* 存储数据的缓冲区 */
    char *memory_buffer;

在`#include`文件之后，先声明之后要定义的函数。操作文件的通用函数一般在`file_operations`结构体中定义中声明。这些将在下文详细解释。

接着，初始化和退出函数——当加载和卸载模块时使用的函数——像内核声明。

最后，声明驱动的全局变量：一条是驱动的`major
number`，另一条是指向内存一段区域的指针`memory_buffer`，这个用来存储驱动数据。

## memory驱动：连接设备和它的文件

在UNIX和Linux中，用户空间设备的存取和文件存取完全一样。这些设备文件通常是目录`/dev`下的子目录。

为了连接正常文件到内核模块需要两个数：`major number`和`minor number`。`major
number`是内核用来链接文件和它的驱动的。`minor
number`是设备内部使用的，简单起见，本文不讨论它。

为了实现这个，必须创建一个文件(将用来存取设备驱动)，通过在root权限下键入：

    # mknod /dev/memory c 60 0

其中`c`代表创建`char`设备，`60`是`major number`，`0`是`minor number`。

在驱动内，为了在内核空间中链接它相应的`/dev`文件，使用`register_chrdev`函数。传递给它三个参数：`major number`，一个显示模块名的字符串和一个`file_operations`结构体。这个结构体将把它定义的文件函数链接到调用。
当安装模块时以这种方式调用。

`memory init module`：

    int memory_init(void) {
        int result;

        /* Registering device */
        result = register_chrdev(memory_major, "memory", &memory_fops);
        if (result < 0) {
            printk(
                    "<1>memory: cannot obtain major number %d\n", memory_major);
            return result;
        }

        /* Allocating memory for the buffer */
        memory_buffer = kmalloc(1, GFP_KERNEL);
        if (!memory_buffer) {
            result = -ENOMEM;  // 内存耗尽
            goto fail;
        }
        memset(memory_buffer, 0, 1);

        printk("<1>Inserting memory module\n");
        return 0;

    fail:
        memory_exit();
        return result;
    }

注意`kmalloc`函数，这个函数用来在内核空间中的设备驱动分配缓冲区内存。它的用法非常类似知名的`malloc`函数。
最后，如果注册`major number`或者分配内存失败，模块做出相应反应。

## memory驱动：移除驱动

为了在`memory_exit`函数中移除模块，函数`unregister_chrdev`需要出现，来为内核释放`major number`。

`<memory exit module>=`

    void memory_exit(void) {
        /* Freeing the major number */
        unregister_chrdev(memory_major, "memory");

        /* Freeing buffer memory */
        if (memory_buffer) {
            kfree(memory_buffer);
        }
        printk("<1>Removing memory module\n");
    }

为了当移除设备驱动时留下一个干净的内核。在这个函数中同时释放了缓冲区内存。

## memory驱动：把设备作为文件打开

内核空间函数，对应于在用户空间打开文件的`fopen`，是`register_chrdev`调用的`file_operations`中`open:`的一个成员，这个例子中是`memory_open`函数。它以`inode`结构体做参数，这个参数参照`major number`和`minor number`向内核传递信息;
一个带各种能执行到文件上的各种不同操作相关信息的`file`结构体。任意这些函数都不会在本文中深入讲解。

当文件打开时，通常必须初始化驱动变量或者重置设备，在这个简单的例子中，尽管如此，不会执行这些操作。

`memory_open`函数如下所示：

`<memory open>=`

    int memory_open(struct inode *inode, struct file *filp) {

      /* Success */
      return 0;
    }

这些新的函数现在展示在表五中。

| 事件          | 用户空间函数  | 内核空间函数         |
| ------------- |:-------------:| --------------------:|
| 加载模块      | insmod        | module_init          |
| 打开设备      | fopen         | file_operations：open|
| 读取设备      |               |                      |
| 写入设备      |               |                      |
| 关闭设备      |               |                      |
| 移除模块      | rmmod         | module_exit          |

表五：设备驱动事件和它们对应在内核和用户空间的接口函数

## memory驱动：把设备作为文件关闭

与用户空间内(`fclose`)对应的关闭文件函数是`register_chrdev`调用的`file_operations`结构体的`release:`成员。
针对本例，是`memory_release`函数，这个函数有一个`inode`结构体参数和一个`file`结构体参数，就像先前一样。

当一个文件被关闭时，通常必须释放使用的内存和任何有关打开设备的变量。但是，再次，为了简单起见，这些操作不执行。

`memory_release`函数如下所示：

`<memory release>=`

    int memory_release(struct inode *inode, struct file *filp) {

        /* Success */
        return 0;
    }

新的函数在表六中展示。

| 事件          | 用户空间函数  | 内核空间函数           |
| ------------- |:-------------:| ----------------------:|
| 加载模块      | insmod        | module_init            |
| 打开设备      | fopen         | file_operations:open   |
| 读取设备      |               |                        |
| 写入设备      |               |                        |
| 关闭设备      | fclose        | file_operations:release|
| 移除模块      | rmmod         | module_exit            |

表六：设备驱动事件和它们对应在内核和用户空间的接口函数

## memory驱动：读设备

类似使用用户函数`fread`读设备，内核空间是`register_chrdev`函数调用的`file_operations`结构体的`read:`成员。这次是函数`memory_read`。它的参数是file结构、一个用户空间函数(`fread`)用来读的缓冲区(`buf`)、一个记着要传输多少字节，和用户空间函数(`fread`)中计数器有相同值的的计数器(`count`)、最后，开始读文件的位置(`f_pos`)。

在这个简单的例子中，`memory_read`函数通过函数`copy_to_user`从驱动缓冲区(`memory_buffer`)传输单个字节给用户空间：

`<memory read>=`

    ssize_t memory_read(struct file *filp, char *buf,
            size_t count, loff_t *f_pos) {

        /* Transfering data to user space */
        copy_to_user(buf,memory_buffer,1);

        /* Changing reading position as best suits */
        if (*f_pos == 0) {
            *f_pos+=1;
            return 1;
        } else {
            return 0;
        }
    }

表七展示了这些新函数。

| 事件          | 用户空间函数  | 内核空间函数           |
| ------------- |:-------------:| ----------------------:|
| 加载模块      | insmod        | module_init            |
| 打开设备      | fopen         | file_operations:open   |
| 读取设备      | fread         | file_operations:read   |
| 写入设备      |               |                        |
| 关闭设备      | fclose        | file_operations:release|
| 移除模块      | rmmod         | module_exit            |

表七：设备驱动事件和它们对应在内核和用户空间的接口函数

## memory驱动：写入设备

类似在用户空间函数`fwrite`写入设备，内核空间中使用`register_chrdev`函数调用的`file_operations`结构体中`write:`成员。
这个例子中是`memory_write`，拥有以下参数：一个file结构，一个用户空间函数`fwrite`用来写入的缓冲区(`buf`)、一个就像用户空间函数(`fwrite`)中计数器相同的值的计算传输字节数的计数器(`count`)、最后，是一个从文件何处开始的位置参数`f_pos`。

`<memory write>=`

    ssize_t memory_write( struct file *filp, char *buf,
            size_t count, loff_t *f_pos) {

        char *tmp;

        tmp=buf+count-1;
        copy_from_user(memory_buffer,tmp,1);
        return 1;
    }

在本例中，函数`copy_from_user`从用户空间向内核空间传输数据。

表八显示了这个新函数

| 事件          | 用户空间函数  | 内核空间函数           |
| ------------- |:-------------:| ----------------------:|
| 加载模块      | insmod        | module_init            |
| 打开设备      | fopen         | file_operations:open   |
| 读取设备      | fread         | file_operations:read   |
| 写入设备      | fwrite        | file_operations:write  |
| 关闭设备      | fclose        | file_operations:release|
| 移除模块      | rmmod         | module_exit            |

表八：设备驱动事件和它们对应在内核和用户空间的接口函数

## 完整的memory驱动

把先前展示的代码结合起来，就是完整的代码：

`<memory.c>=`

    <memory initial>
    <memory init module>
    <memory exit module>
    <memory open>
    <memory release>
    <memory read>
    <memory write>

在设备能使用之前，你必须像上文所述一样编译模块，然后装载：

    # insmod memory.ko

更改设备权限：

    # chmod 666 /dev/memory

如果一切安好，你将有一个`/dev/memory`的设备，你可以写入字符串并且它将存储最后一个。你可以执行像这样的操作：

    $ echo -n abcdef >/dev/memory

使用`cat`检查设备中的内容：

$ cat /dev/memory

存储的值不会变化，直到它被覆盖或者模块被移除。
















## Footnotes

[^1]:译者：如果你写过shellcode,这全不是问题哇
[^2]:我是gentoo linux下的3.12.5-ck，现在debian stable已经7 wheezy了
[^3]:请自行google
[^4]:如果你有一个gentoo系统，请看附录B
[^5]:我这里没这个文件
