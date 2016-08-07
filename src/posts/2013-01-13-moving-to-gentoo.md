---
layout: post
title: "Hello, Gentoo"
excerpt: "Moving to gentoo"
category: linux
tags: [linux]
disqus: true
---


警告：*渣行文*，就是想到什么扯什么……散漫不羁，漫无主题。

注：你也许可以把这篇极水的流水帐当作 *Tentative Instruction for gentoo on Samsung R429* 不过我写这篇文章的目的在于自我警戒与警戒他人，一次gentoo安装让本屌丝sb本质暴露无疑，诸位看官引以为戒。

# 机器信息

Cpu信息,这就是传说中的*i3* XD

    ⚡ root@gentoo ⮀ ~ ⮀ lscpu 
    Architecture:          x86_64
    CPU op-mode(s):        32-bit, 64-bit
    Byte Order:            Little Endian
    CPU(s):                4
    On-line CPU(s) list:   0-3
    Thread(s) per core:    2
    Core(s) per socket:    2
    Socket(s):             1
    Vendor ID:             GenuineIntel
    CPU family:            6
    Model:                 37
    Stepping:              2
    CPU MHz:               2266.000
    BogoMIPS:              4521.96
    Virtualization:        VT-x
    L1d cache:             32K
    L1i cache:             32K
    L2 cache:              256K
    L3 cache:              3072K

硬件：

    ⚡ root@gentoo ⮀ ~ ⮀ lspci
    00:00.0 Host bridge: Intel Corporation Core Processor DRAM Controller (rev 12)
    00:01.0 PCI bridge: Intel Corporation Core Processor PCI Express x16 Root Port (rev 12)
    00:1a.0 USB controller: Intel Corporation 5 Series/3400 Series Chipset USB2 Enhanced Host Controller (rev 06)
    00:1b.0 Audio device: Intel Corporation 5 Series/3400 Series Chipset High Definition Audio (rev 06)
    00:1c.0 PCI bridge: Intel Corporation 5 Series/3400 Series Chipset PCI Express Root Port 1 (rev 06)
    00:1c.2 PCI bridge: Intel Corporation 5 Series/3400 Series Chipset PCI Express Root Port 3 (rev 06)
    00:1c.3 PCI bridge: Intel Corporation 5 Series/3400 Series Chipset PCI Express Root Port 4 (rev 06)
    00:1d.0 USB controller: Intel Corporation 5 Series/3400 Series Chipset USB2 Enhanced Host Controller (rev 06)
    00:1e.0 PCI bridge: Intel Corporation 82801 Mobile PCI Bridge (rev a6)
    00:1f.0 ISA bridge: Intel Corporation Mobile 5 Series Chipset LPC Interface Controller (rev 06)
    00:1f.2 SATA controller: Intel Corporation 5 Series/3400 Series Chipset 4 port SATA AHCI Controller (rev 06)
    00:1f.3 SMBus: Intel Corporation 5 Series/3400 Series Chipset SMBus Controller (rev 06)
    02:00.0 VGA compatible controller: NVIDIA Corporation GT218 [GeForce 310M] (rev a2)
    02:00.1 Audio device: NVIDIA Corporation High Definition Audio Controller (rev a1)
    03:00.0 Network controller: Atheros Communications Inc. AR9285 Wireless Network Adapter (PCI-Express) (rev 01)
    07:00.0 Ethernet controller: Marvell Technology Group Ltd. Yukon Optima 88E8059 [PCIe Gigabit Ethernet Controller with AVB] (rev 11)
    3f:00.0 Host bridge: Intel Corporation Core Processor QuickPath Architecture Generic Non-core Registers (rev 02)
    3f:00.1 Host bridge: Intel Corporation Core Processor QuickPath Architecture System Address Decoder (rev 02)
    3f:02.0 Host bridge: Intel Corporation Core Processor QPI Link 0 (rev 02)
    3f:02.1 Host bridge: Intel Corporation Core Processor QPI Physical 0 (rev 02)
    3f:02.2 Host bridge: Intel Corporation Core Processor Reserved (rev 02)
    3f:02.3 Host bridge: Intel Corporation Core Processor Reserved (rev 02)

## :s/arch/gentoo/gc

2013年一月十三日，开始装gentoo。依照[The Gentoo Linux alternative installation method HOWTO](http://www.gentoo.org/doc/en/altinstall.xml)从BT5 R3的liveusb来chroot过去部署的stage3。一年多linux使用的结果是，chroot轻车熟路，archwiki中chroot那章还是我翻译的呢，不过……渣翻译。

没什么理由，甚至对arch相当满意。然后就顺手给`/`和`/boot`干掉了……单独分区天然优势，不用折腾什么lvm就能大胆的乱搞……

    Device Boot      Start         End      Blocks   Id  System
    /dev/sda1   *          63      208844      104391   83  Linux
    /dev/sda2          208845     4417874     2104515   82  Linux swap / Solaris
    /dev/sda3         4417875    65866499    30724312+  83  Linux
    /dev/sda4        65866500   625137344   279635422+  83  Linux

## 引导

这是这次安装和配置gentoo时犯的第一次sb……

当时内核编译好。手册上的示例是grub和lilo做引导，而我习惯syslinux。素来以尊重用户选择为指引的gentoo在手册上就是没提及半点syslinux，而在arch下的操作又不一样。于是找到gentoo的syslinux的wiki。按wiki步骤写了自己的`extlinux.conf`:

    TIMEOUT 30
    ONTIMEOUT gentoo
    
    UI vesamenu.c32
    MENU TITLE Boot
    
    LABEL gentoo
    MENU LABEL Gentoo Linux
    KERNEL /boot/kernel-genkernel-x86_64-3.6.11-gentoo
    APPEND initrd=/boot/initramfs-genkernel-x86_64-3.6.11-gentoo root=/dev/sda3 acpi_osi=Linux acpi_backlight=vendor

然后重启……无法载入root，进入某个rescue shell内，什么神shell什么命令都没用。

冷关机chroot，查找资料改以上配置文件n次，重装extlinux又n次，重启n次，依然无解。然后忽然发现……extlinux的配置文件是`extlinux.conf`,而不像syslinux，pxelinux和isolinux那样都是`.cfg`，瞬间知道自己sb了……

## 图形界面

然后还算顺利吧，开源驱动编译了好久，emerge不会用，我是什么都：

    emerge --autounmask-write foo
    dispatch-conf
    u
    emerge foo

奇葩的是我想到什么emerge什么……于是搞了好久都没有图形界面用……

搞了个xterm+luit+telnet上听雨……发现字体显示不全……和听雨技术blabla的用英语开始版聊，然后十大了……囧

为了能一边上网水贴吧，一边编译系统。第二天回到BT5的liveusb环境中去了，又把自己喜欢的东西先emerge出来了……图形界面还没起来把gimp和vlc就编译好了……

等开源驱动装好，kdebase-startkde装好之后，重liveusb环境重启，擦……奇葩的分辨率……然后又开始查怎么调分辨率。

然后从开源到闭源，发现闭源不能调亮度，再加上没有kms很不爽，又转到开源。对这款机器来说，估计nvidia-bl驱动你也可以调亮度，不过我没试过。我只是把闭源驱动生成的xorg.conf改了改扔给了开源驱动[^3]：


     ⚡ root@gentoo ⮀ ~ ⮀ cat /etc/X11/xorg.conf 
    # nvidia-xconfig: X configuration file generated by nvidia-xconfig
    # nvidia-xconfig:  version 304.64  (buildmeister@swio-display-x86-rhel47-12)  Tue Oct 30 12:04:46 PDT 2012
    
    
    Section "ServerLayout"
        Identifier     "Layout0"
        Screen      0  "Screen0" 0 0
        InputDevice    "Keyboard0" "CoreKeyboard"
        InputDevice    "Mouse0" "CorePointer"
    EndSection
    
    Section "Files"
    EndSection
    
    Section "InputDevice"
    
        # generated from data in "/etc/conf.d/gpm"
        Identifier     "Mouse0"
        Driver         "mouse"
        Option         "Protocol"
        Option         "Device" "/dev/input/mice"
        Option         "Emulate3Buttons" "no"
        Option         "ZAxisMapping" "4 5"
    EndSection
    
    Section "InputDevice"
    
        # generated from default
        Identifier     "Keyboard0"
        Driver         "kbd"
    EndSection
    
    Section "Monitor"
        Identifier     "Monitor0"
        Modeline "1368x768_60.00"   85.25  1368 1440 1576 1784  768 771 781 798 -hsync +vsync
        Option         "DPMS"
        Option         "PreferredMode"  "1368x768_60.00"
    EndSection
    
    Section "Device"
        Identifier     "Device0"
        Driver         "nouveau"
        Option         "NoLogo" "true"
        Option         "RegistryDwords" "EnableBrightnessControl=1"
        VendorName     "NVIDIA Corporation"
    EndSection
    
    Section "Screen"
        Identifier     "Screen0"
        Device         "Device0"
        Monitor        "Monitor0"
        DefaultDepth    24
        SubSection     "Display"
            Modes      "1366x768"
            Depth       24
        EndSubSection
    EndSection

想知道modeline怎么写的？请`man cvt`。

总之，这么一搞，开源驱动有这款机器的分辨率了。

这部分最后补充下我犯的*第二次sb*，chroot过去忘了date到正确的时间，结果早上开始emerge kdebase-startkde 晚上发现它还在等着在多少多少秒之后的未来某时开始编译……于是水了一天贴吧发现什么都没干。

## 后安装时代

第三次sb在于，妄图打造一个纯正的无gtk环境，

- 把gvim的gtk参数去掉了，靠……对着wx的gvim渣界面我还奇怪怎么这么难看。
- 把fcitx的gtk参数去掉了，然后奇怪firefox中怎么输入不了……
- 最后吧，选择kde环境我觉得本身就挺sb……bug要不要多了点……当你想要美化kde环境下不堪入目的gtk程序而选择安装Oxygen-gtk后，却发现Oxygen-gtk的widget出现不了时你可以参看参看[这里](https://forum.kde.org/viewtopic.php?f=66&t=91301)。一般情况下，你如果碰到这个问题，说明你要么是升级kde，要么是家目录有一堆以前的配置。

## 引导出错？

从W城到X城，十个小时的火车，又犯了一次sb。以为早上六点到X城，半夜两点乘务员把我叫起来说到站了，迷迷糊糊的出站四野一片大雾。晕头转向地走进KFC打开电脑等天亮……草……启动不了了。然后我chroot重编译内核检查硬盘内存一直搞到没电。

等到回家，忽然想起光驱里放了个没用的光盘……

## Home 

回家开始拨号联网，怀念arch下Networkmanager无往不利，按wiki编译设置好。先是发现没无线网络，然后dsl拨号连不上。

这是第几次sb来着……查找N多资料，编译N次内核，n次networkmanager，甚至试了试wicd，最后发现用户名写错了……卧槽啊……

无线内核也是个大坑，gentoo安装手册上说：

> Be aware though, as genkernel compiles a kernel that supports almost all hardware, this compilation will take quite a while to finish! 

还说：

> This means that when you use genkernel to build your kernel, your system will generally detect all your hardware at boot-time, just like our Installation CD does.

于是我sb的以为会生成个和ubuntu或arch一样的通用内核，实际上竟然不完全是。[^1]不知道是chroot原因还是什么，RTC支持没有编译(hwclock),无线网卡驱动没有编译(ath9k)，如果你要用vbox，这个支持也要编译上(iommu)。

我觉得最sb的在于，我以为genkernel会自动读取当前目录的配置……各位看官引以为戒，使用软件前认真看手册，不要*自以为是*。

好了最后没什么了，一个libreoffice编译了五个小时，添加了gentoo-zh和sunrise的overlay。装上了katawa-shoujo，64位gentoo跑32位程序全无压力，连pulse-audio都不用就有声音(arch下为了发出声音必然的依赖)……

然后……就是开虚拟机写毕业设计开题报告的事了。囧……

## 附录

### 附录一——截图秀

这是秀gvim和gentoo的logo：

![秀gvim的powerline](http://fmn.rrimg.com/fmn061/20130118/2335/original_YQIC_17da0000045a1191.jpg)

秀zsh的powerline

![yakuake and zsh powerline](http://fmn.xnpic.com/fmn057/20130118/2340/original_KSFt_2596000000361191.jpg)

这是秀oxygen主题，金属光泽和性感的阴影。

![日用无碍](http://fmn.rrimg.com/fmn060/20130118/2340/original_hO3c_3601000002281190.jpg)


### 附录二——工作清单

终于可以使用中文了。截止

Sun 13 Jan 2013 12:52:51 AM CST

已完成的工作

[X] vlc

[X] gimp

[X] luit/telnet 上听雨

[X] w3m

[X] nouveau

[X] zsh

[X] wqy-zenhei wqy-microhei

[X] ipython pip （python2）

[X] firefox-bin18

[X] startkde(去除bluez，我没有蓝牙适配器)

[X] ppp，dhcpcd

[X] 通用内核

[X] syslinux

[X] 较低版本的fcitx

[X] layman添加gentoo-zh, 安装git和subversion。

[X] xinit

还有些问题：*Mon 14 Jan 2013 12:27:09 AM CST修正*

[X] 分辨率低，不能设置为1366x768,换闭源驱动可解决

[C] gentoo的stageball难道给我装了一堆开发工具？sandbox pyshell pycrust pyalamode？

[X] gvim显示好难看，而且输入法不能起作用，gtk选项

[X] oxygen还要单独安装么？bug，重编译解决

[X] 缺少声卡驱动？还是alsa？声音调节。alsa

[X] 触摸板不起作用。synaptics

[X] 亮度无法调节（kde电源管理工具,and powermanage）开源可以闭源不行,acpid acpi Option依然无力[^4]

[X] dolphin，okular，gwenview等常用工具没装

[X] sudo sudoer文件写法

[X]用户组处理

[]摄像头

[X]如果开源驱动，开启kms

[C]change to nvidiabl

Others:

[X] kdm

[X] vbox安装、配置

[X] 重新编译firefox18,而不是bin

[X] oh-my-zsh 换上有非常漂亮powerline的agnoster主题，上图

[C] overlay 更换现有输入法？*注意ICU*，暂时不更改了

[X] 片轮少女[^2]

[X] 是否换闭源驱动 是 logo去掉

[X] virtualenv，pip

[C] gcc暂时不升级


幸运的是，家目录没有变动。所有的用户配置都在，如vim，kde，甚至rvm都能正常使用。

Mon 14 Jan 2013 12:30:54 AM CST

除此之外我还做了什么：

[O]恼人的zsh下sudo自动补全。sudo没解决（把配置复制给root了都没用）

[X]精简内核,被genkernel坑了，原来它不会自动读配置

[X]latex编译,ctex字体配置

[X]无线网内核支持编译ath9k

[X]Networkmanager的dsl拨号无法使用

[X]unzip,unrar,zip(natspec标记)

[X]hwclock 内核RTC支持

Sun 03 Mar 2013 11:47:18 AM CST

[X]重新配置内核，添加摄像头支持

### 附录三——经验教训

- sb一样上来emerge vim...openbox+xterm听雨都显示不了汉字.So,先打造个可以上网的环境再说
- chroot是个不错的选择,但不仅要挂载proc等[参见alternative'],还要date...
- emerge使用,portage的理解,use 标记 the heart of gentoo.
- 显卡驱动是个蛋疼的事
- firefox编译时直接卡爆，不过最后还是编译好了
- gvim和fcitx要加上gtk选项，不然gvim就一个默认的wx界面，fcitx无法在gtk程序中使用
- 非系统级python模块使用virtualenv+pip

## Footnotes

[^1]:问题在于，我是chroot环境过去的，而BT5启动时并没能很好的探测硬件，比如每次启动BT5时间都不对。genkernel貌似需要启动时探测的信息。后来在贴吧看到，都是lspci看硬件然后直接把硬件+gentoo上google搜的……
[^2]:悲了个摧的，不能读取我以前的存档……
[^3]:这个配置文件触摸板不能单击，要改什么，反正我后来用synaptiks设置了。
[^4]: 后来发现acpi没用，powerdevil就够用了。另为唤醒后亮度失控的问题找到解决方法了arch的wiki，在内核启动行加上`acpi_osi=Linux acpi_backlight=vendor`
