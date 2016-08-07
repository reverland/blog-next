---
layout: post
title: "File Permissions and Masks"
excerpt: "文件权限"
category: linux
tags: [security, linux]
disqus: true
---


传统Unix安全强烈依赖文件和目录权限来阻止非授权用户读取或更改它们不该存取的文件。根据最小权限原则，配置每个文件，目录和文件系统，只允许必要的存取。

但linux系统有很多文件……本部分适用于系统安全的一些易于更改和测试，且几乎总是适用的权限限制。

注意：以下有些命令搜索文件系统中包含特定字符的文件和目录，这些命令应该在每个`ext2`或`ext3`分区上运行。当`PART`出现在以下某个命令中，表示这个命令应该在每个分区重复运行一次。

以下命令打印给定机器上所有ext2和ext3命令：

    mount -t ext2,ext3 | awk '{print $3}'

如果用了其它分区类型，更改`-t`参数。

## 限制分区挂载参数

系统分区挂载时能指定参数，限制分区上文件能做什么。这些参数在`/etc/fstab`中设置，这些措施能让特定类型的恶意行为更加困难。

### 想非Root分区添加nodev选项

编辑`/etc/fstab`，我们关注列2(挂载点),3(文件系统类型),4(挂载参数)。给所有满足下列条件的行：

- 文件系统是`ext2`或`ext3`
- 挂载点不是`/`

在列4添加`,nodev`。

`nodev`参数防止用户在任何不该挂载设备的分区上挂载设备。只有`/dev`应该挂载设备，所以不要在`/`上设置这个参数。

然而，如果系统程序在`chroot jail`中运行，需要在`chroot`文件夹内创建设备文件，这个建议就不这么适用。

### 向可以出存储分区添加nodev，nosuid和noexec选项

编辑`/etc/fstab`，如果行中包含`floppy`或者`cdrom`字样就说明这些是可移除媒体的文件系统。

对其中每个找到的挂载点，在列4添加`noexec,nodev,nosuid`参数。

挂载到可移除介质的文件系统也为恶意可执行文件提供了潜在的进入系统方式，因此应该用最小权限挂载。用户不能引入任意设备或者suid程序。另外`noexec`禁止用户直接在可移除介质上运行程序，这能阻止一些特殊蠕虫和恶意代码。

`/etc/fstab`上的挂载点也许在某些典型硬件的现代系统上不存在。动态挂载机制需要通过其它方式控制(也许可以也许不能控制挂载选项)。如果你需要在可移动介质中执行什么，就别加`noexec`.

### 向临时存储分区添加nodev，nosuid和noexec参数

临时存储分区比如`/tmp`和`/dev/shm`为恶意程序执行提供了潜在存储空间。尽管添加这些参数不能防止其它分区的程序解释存储在这些分区的代码，但对某些恶意代码也有作用。

编辑`/etc/fstab`，向列4添加`,nodev,nosuid,noexec`。

### 绑定挂载/var/tmp到/tmp

编辑`/etc/fstab`，添加以下行：

    /tmp    /var/tmp    none    rw,noexec,nosuid,nodev,bind 0 0

这一行绑定挂载任何人都可写的`/var/tmp`目录到`/tmp`，使用用上文中用的选项。参见mount的man页面获取更多关于绑定挂载的信息。

## 限制动态挂载和卸载文件系统

linux系统提供了各种措施自动增加和删除运行系统的文件系统，这些措施很方便，也带来了诸如允许非授权用户引入任意文件系统或者，软件自动挂载措施的缺陷允许攻击者侵入系统。

使用这些措施的时候要十分小心，找到更好的配置管理方式和实行用户教育可能减少风险。

### 限制控制台设备接入

默认系统配置批准控制台用户提升到root用户权限，包括暂时拥有大部分系统设备。如果不必要，禁用这个权限，限制到root。

将设备所有者限定到root

(RHEL6)中并无这些，神奇的消失了。Removed references to 50-default.perms, since this file was removed in Red Hat Enterprise Linux 6, per Bugzilla 630524.

### 禁用USB设备支持

USB闪存或硬盘可能为攻击者物理接触系统拷贝大量数据提供便利。

#### 禁止内核加载USB存储驱动

如果不让用USB设备，`modprobe`程序应该被设置为不自动加载USB存储驱动。

    #vi /etc/modprobe.d/no-usb.conf                           #Create this file if it doesn’t exist
    install usb-storage /bin/true                             #Add this line
    :wq!

这可以禁止modprobe加载usb-storage模块，但无法阻止管理员或其它程序使用insmod来加载模块。

#### 移除USB存储驱动

如果根本不需要使用USB存储设备，内核驱动就可以删除。

    rm /lib/modules/kernelversion(s) /kernel/drivers/usb/storage/usb-storage.ko
    
每次更新内核后都要运行这个命令。`rpm -q --verify kernel`也会失败，不好的副作用。

注意，如果一个带有usb驱动的自制内核被使用，该方法并不能防止USB存储设备被挂载。

#### 在启动时禁用对USB的内核支持

在内核启动参数中加入`nousb`参数

注意！！！！！！！！！！！：这会让usb外接键盘鼠标打印机等设备无法使用。

在`/etc/grub.conf`中加入`nousb`参数：

    kernel /vmlinuz-version ro vga=ext root=/dev/VolGroup00/LogVol00 rhgb quiet nousb

#### 禁止从USB设备启动

配置BIOS禁止从USB启动，设置BIOS或固件密码防止非授权的更改配置。

### 尽量禁用自动挂载

如果`autofs`服务不是必要的，比如挂载NFS文件系统或可移动介质，禁用该服务。

    chkconfig autofs off

其实用autofs自动挂载可移动介质也不常见，如果不用NFS就禁用服务。

就算需要NFS，近乎总是可能在`/etc/fstab`配置静态文件系统挂载，而不是依靠自动挂载。


### 尽量禁用gnome自动挂载

略

### 禁止挂载不常见文件系统类型

在`/etc/modprobe.d/`下随意建个文件比如`uncomman_fs.conf`:

    install cramfs /bin/true
    install freevxfs /bin/true
    install jffs2 /bin/true
    install hfs /bin/true
    install hfsplus /bin/true
    install squashfs /bin/true
    install udf /bin/true

### 尽可能禁用所有Gnome缩略图

## 确认重要文件和目录权限

讨论了需要日常检查以确保没有有害的差异发生。

### 确认passwd，shadow，group和gshadow文件的权限

    cd /etc
    chown root:root passwd shadow group gshadow
    chmod 644 passwd group
    chmod 400 shadow gshadow

一般这是默认情况。

### 确认所有全局可写的目录设置sticky位

找到所有本地分区上全局可写但未设置sticky位的文件夹。以下命令可以用来查找，其中`PART`是指定分区：

    find PART -xdev -type d \( -perm -0002 -a ! -perm -1000 \) -print

如果有任何输出目录`/dir`，用以下命令更改：

    chmod +t /dir

sticky位设置后，只有文件夹的所有者可以删除其中的文件。

### 发现为授权的全局可写文件

以下命令找到全局可写文件(对某一分区`PART`)：

    find PART -xdev -type f -perm -0002 -print

如果发现确实不该设置全局可写，设置：

    chmod o-w file

几乎不该出现全局可写的文件夹。

### 找到未授权的SUID/SGID系统可执行文件

以下命令找到所有分区`PART`上的setuid和setgid文件：

    find PART -xdev \( -perm -4000 -o -perm -2000 \) -type f -print

如果确定有不用设置suid或sgid的程序，设置：

    chmod -s file

可以参考NSA Guide 32页表格决定。

### 找到和修复无主文件

找到分区`PART`不属于任何有效用户组和用户的文件：

    find PART -xdev \( -nouser -o -nogroup \) -print

如果有输出检查下是分配给某个用户和组还是删除文件。

通常无主文件并不可被挖掘漏洞，但是通常意味系统进程出错。也许是一个入侵者造成的，或者不正确的软件安装或者不完整的软件移除，或者移除一个被删除的帐号失败。这些文件应该被修复，以防将来创建用户出现问题，因此这种问题需要重视。

### 确保所全局可写目录有合适的权限

确保全局可写文件目录的权限是root或者其它系统账户。以下命令将发现和打印这些：

    find PART -xdev -type d -perm -0002 -uid +500 -print

如果有输出，搞明白为什么这些全局可写目录的拥有者不是root或者系统账户。

允许用户账户拥有全局可写目录不合适，应该这将允许拥有者移除任何其它用户放进去的文件。

## 限制以危险模式运行的程序

这部分推荐提供广泛的保护，防止信息泄漏或者其它不当行为。这些保护被应用在系统初始化时和内核层，以抵御特定类型的没配置好或被入侵的程序。

### 设置daemon umask

编辑`/etc/sysconfig/init`，添加或改变以下行。

    umask 027

该文件包含在启动时应用到所有进程的设置。最起码系统umask是022,不然守护进程就会创建全局可写的文件。更严格的027保护临时文件、日志文件等不被未授权的非授权用户读取。

如果特定daemon需要更宽松的umask，考虑为该守护进程单独设置例外，比如编辑启动脚本或者sysconfig文件

### 禁用吐核

在`/etc/security/limits.conf`中添加或更改以下行，限制所有用户吐核。

    *   hard core 0
并且，确保setuid程序不吐核，编辑`/etc/sysctl.conf`添加或改正以下行：

    fs.suid_dumpable = 0

核文件是可执行文件的内存镜像，大多情况下只有开发者需要合法的存取这些文件。核内可能包含敏感信息或者占据大量磁盘空间。

默认情况下，系统设置了软限制(soft limit)，以防止所有用户创建核文件。通过在`/etc/profile`中以下行实现：

    ulimit -S -c 0 > /dev/null 2>&1

然而这个限制不是强制的。仅能防止对用户会话中恼人的吐核，如果需要吐核，考虑限定到指定用户和组。参见`limit.conf`的man页面。

#### 确保禁止suid吐核

使用`sysctl`检查：

    sysctl fs.suid_dumpable

使用`-n`参数更利于写脚本检查这个值。

#### 开启ExecShield

ExecShield包含一系列内核特性，这些特性提供缓冲区移除攻击保护。这些特性包括随机放置栈和其它内存区域，阻止在应该放数据的区段中执行内存，对字符缓冲区特殊处理。

为了让这些在启动时激活，添加以下行到`/etc/sysctl.conf`:

    kernel.exec-shield = 1
    kernel.randomize_va_space = 2

Execshield 使用所有x86平台的段特性来阻止内存中特定地址更高的地址执行。它在代码段描述符中写下一个地址作为限制，来控制代码在哪里能执行(对每一个进程的基础上)。当内核将一个进程的内存区域，比如对或者栈到高于这个地址时，硬件会阻止它执行。然而，不可能对所有不该执行的内存区域做到这点。`randomize_va_space`值为2一般为默认值，确保随机放置栈,、VDSO页面,、共享内存区域和数据段。

#### 确保ExecShield已经启用

使用sysctl确认当前系统中使用了这些特性：

    sysctl kernel.exec-shield
    sysctl kernel.randomize_va_space

### 启用32位系统的Execute Disable(XD)或者No Execute(NX)支持

较新的x86 32位处理器支持在每个内存页面基础上的代码防止执行。通常在AMD处理器上这个特性嗯叫`NX`，在Intel处理器中叫`XD`。这个特性有助于防止缓冲区移除攻击。任何时候都该开启。其它处理器比如Itanium、Power和64位x86处理器开始就支持该特性。

#### 检查是否处理器支持

检查是否支持`PAE`和`NX`特性：

    cat /proc/cpuinfo

如果支持，`flags`域内包含`pae`和`nx`。

#### 在x86系统安装新内核

显然64位系统用不着`PAE`特性。`kernel-PAE`顺便开启了`NX`或`XD`支持。不要在cpu不支持这些特性的机器上装`kernel-PAE`：

    yum install kernel-PAE

#### 在BIOS中开启NX或XD支持

进入BIOS设置界面，一概在setup菜单，security部分，大概

### 配置prelink

通过加载每个已经链接的必要符号的共享库到相同的位置，Prelink设计来减少进程启动时间。`/etc/sysconfig/prelink`文件描述了`/usr/sbin/prelink`程序会改动哪些文件以及更改这些文件的频率。

cron任务可以每天运行来执行`prelink`程序，有两种类型的预链接：quick和full，full默认每十四天发生一次，重链接所有共享库和那些使用它们的二进制文件。快速模式每天运行，但只对改动的二进制文件和库进行。

一旦二进制文件被预链接了，共享库地址不再会在进程基础上随机防止，就算`kernel.randomize_va_space`设置成1或2.这可不是我们想要的结果，由于其为攻击者的挖掘尝试提供了稳定的地址。

#### 禁用prelink

配置`/etc/sysconfig/prelink`:

    PRELINKING=no

#### 取消已经存在的预链接

执行以下命令：

    /usr/sbin/prelink -ua

