---
layout: post
title: "给MBP用户的Ubuntu GNOME 17.04 安装配置指南"
excerpt: "GNOME 大法好"
category: linux
tags: [linux]
disqus: true
---

> 一篇不完全的MBP配置指南，作者是GNOME3的脑残粉。

> 你们渣渣 Mac 用户会看不懂文中百分之八十的词汇，这篇文章是写给真正的Linux桌面用户。

> 作为一个有信仰的计算机使用者，请选择[GNOME OS](https://wiki.gnome.org/GnomeOS)。

> 我见过最好的Linux发行版是RHEL，但是我选择Ubuntu，但是我选择了GNOME Ubuntu。

> 因为装系统和配置太简单了，本文更多的是在说GNOME大法好。

在公司配备MBP之前，我一直用着七年没出过任何问题的三星笔记本，在那个笔记本上装过Windows XP, YLMF OS, Deeping Linux, Ubuntu, ArchLinux, Gentoo, LFS...

2012年，在那个还算崭新的电脑上，跟着ArchLinux的滚动更新，我第一次体验了GNOME 3，一个现代的用户桌面环境呈现在我的面前。

但是，2012年初的 GNOME 3太不稳定了，不断的崩溃，还没经过岁月打磨平滑的糟糕细节，快速开发而不稳定的接口，开创性的设计。让所有用习惯古典操作系统用户界面的对此并不感冒，早期不尽如人意的软件质量也屡屡遭人唾弃。

相比开发了十几年的稳定无波澜的GNOME2既不稳定，相比GNOME2配上Compiz等天花乱坠的3D桌面效果也并不酷炫，早期的定制性又没GNOME2这么方便，GNOME2用户也不喜欢GNOME3。

更何况，有些人认为真正的黑客并不使用桌面环境，他们只需要窗口管理器，也许他们只需要一个Emacs。现在我身边用Linux的大佬，清一色的i3，之前还有大佬用XMonad，好像这样才是用的 Linux。如我，狂热拥抱GNOME3的异端，在旁人眼里只是极低端的存在吧。

所以12年从GNOME3推出，唾弃之声不绝于耳。以致于连GTK的名声似乎都狼藉起来了，渐渐听说LXDE抛弃GTK迁移到QT，Wireshark项目前端也从GTK改用QT，当然，这也和GTK在跨平台的支持上比QT差有关系，也和工具链的成熟程度的差距有关。

然而不管怎样，GNOME3依然如火如荼地快速变化着，[从08年开始的现代操作系统桌面设计构想](https://wiki.gnome.org/ThreePointZero/DesignHistory)慢慢照射进现实，直到今天，成为了几乎完美的、开源的、漂亮的、稳定的现代桌面环境。

今天相比5年前，GNOME3取得了巨大的进展。社区、商业促进了他不断发展，打磨趋于完美。以致于，本来我以为给MBP装Ubuntu会碰上各种各样的问题，然而几乎没有什么问题，问题还没之前在我的三星笔记本上装ArchLinux来的多。如果还有一位有信仰的Linux用户也遇到了一样的问题，欢迎参照下文。

## 安装系统实在没有什么好说的

因为，这个对我来说最难的步骤是Monster大佬给我做的。

大致就是大佬顺手用Mac OSX自带的分区软件随手分了区，然后顺手给我从USTC开源镜像下载了一个Ubuntu Gnome 17.04，顺手给做了一个Live USB，顺手启动然后一路下一步下一步。

如果说有什么需要注意的，那就是Mac不能格式化Ext4分区。键盘Layout选择，我好像选择了Chinese，就是标准就好了。

## 几乎完美的高清屏幕支持

还有什么好说的吗？GNOME处理高清处理得非常好，可是不是所有软件都完美支持。比如Gimp2.8.

## 几乎完美的多屏支持

在GNOME 控制中心配置屏幕位置等等就好了

## 毫无问题的fx键

没什么可说的

## 输入法

    apt install fcitx

然后顺手装一个叫input-method-panel的gnome shell，让fcitx看上去更科学一些，特别是在高清屏幕上。

顺手打开Gnome-Tweak-Tool，在Startup Application中添加fcitx。

## 多点触控

Mac OSX 的触摸板让人非常难以割舍。默认情况下，装上Ubuntu后，你能够自由使用触摸板单击、双击、双指右击、双指滚动。如果想有三指或者四指的手势的话，需要安装libgesture（如遇到问题请参照项目README）。

```bash
sudo apt install libinput-tools xdotool
sudo gpasswd -a $USER input
git clone http://github.com/bulletmark/libinput-gestures
cd libinput-gestures
sudo make install
cp /etc/libinput-gestures.conf ~/.config/libinput-gestures.conf
libinput-gestures-setup autostart
```

你可以大概试下它默认的双指缩放。

你也可以参考我的`~/.config/libinput-gestures.conf`，四指切换工作区，四指进/出缩放模式。

```
# Browser go forward (works only for Xorg, and Xwayland clients)
gesture swipe left	xdotool key alt+Right
gesture swipe left 4	xdotool key super+Page_Down

# Browser go back (works only for Xorg, and Xwayland clients)
gesture swipe right	xdotool key alt+Left
gesture swipe right 4	xdotool key super+Page_Up

# GNOME SHELL open/close overview (works for GNOME on Wayland and Xorg)
gesture swipe up 4 dbus-send --session --type=method_call --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:'Main.overview.toggle();'

gesture swipe down 4 dbus-send --session --type=method_call --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:'Main.overview.toggle();'
```

配置文件有详细配置说明。不好意思，这里没有GUI配置界面。

## 禁用开机键盘

用了几天碰到一个非常难过的问题，之前Mac OSX的唤醒我经常直接点击开机键，但是现在一点直接就死机了。

于是我按下Command，输入Power，打开Power选项，然后在最后一行有一个叫`When the Power Button is pressed`的配置选项，选择Nothing。

## 截屏快捷键

Mac的键盘没有Print，但那是Ubuntu的默认截屏系列按键必须有的。所以只好改快捷键了。

按下Command，输入Keyboard，如图怎么样。

![截屏快捷键](http://upload-images.jianshu.io/upload_images/927981-0e28bd38abc3cb45.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 使用标准按键（无法输入~）

默认情况下，标准布局的键盘最左上角的按键映射不对。需要更改内核模块配置。

```
sudo vim /etc/modprobe.d/hid_apple.conf
```

文件内容为

```
options hid_apple iso_layout=0
```

重新生成initramfs

```
sudo update-initramfs -u -k all
```

## 挂载MAC硬盘分区

如果，我是说如果，你还是需要Mac，比如你的前端必须兼容Safari，你要用Sketch啊PhotoShop啊什么的。挂载Mac系统分区是必要的功能。

然而对较新的MacOSX系统，nautilus（GNOME默认文件管理器）并不能自动给你挂载上。我在fstab上加了一行。

```
# mac
/dev/sda2	  /media/mac	hfsplus auto,user,ro,exec,sizelimit=398905806848	0	0
```

不要照抄哦，你那里可不一定是`/dev/sd2`，sizelimit也不知道是啥。

[关于这个sizelimit的计算参照这里](https://wiki.archlinux.org/index.php/Mac)

不建议做hfs+分区写入。

## 网络配置

在Networkmanager中配置自动，指向本地的PAC文件了。

firefox很尊重system proxy设置，

但是很多地方还是要用proxychains。

## 软件xxx

在Linux下安装开源软件比Mac下方便

0. GNOME software center
1. apt install xxx
2. 官网下载xxx
3. git clone xxx && cd xxx && cat README
4. ~~wget xxx | bash~~

于是我花几分钟装好配好了pyenv、不用sudo的`npm -g`、atom全家桶、neovim、某司才会用的xxx、某司才会用的xx。

装上喜闻乐见的GNOME优秀应用Pomodora，

愉快地用上GNOME Calendar、GNOME TODO、GNOME Box、GNOME XXX...

整个世界都GNOME了。

如果不过瘾，再顺手写了个和GNOME shell 集成更好的gtkrocketchat，gtkwechat、gtkxxx。

然后发现DevHelp真好用啊真好用。

整个世界都是GNOME。

## For Fun

早在2011年，我听说GNOME Shell的采用Web技术（javascript/css）来开发，感到无比震惊，这种震惊直接导致我工作的开始一年成为了一个全职的Web前端。

下面用一个项目展示Gnome Shell无与伦比的灵活性

Let's Rock!

[煎鱼大魔王的转载的视频]
(https://www.bilibili.com/video/av10946982/)

> !!!!!警告：：：请务必理解和检查执行内容再粘帖！！！！！！

```
wget https://raw.githubusercontent.com/bill-mavromatis/gnome-layout-manager/master/layoutmanager.sh
chmod +x layoutmanager.sh
./layoutmanager.sh
```


![Screenshot from 2017-06-14 00-32-39.png](http://upload-images.jianshu.io/upload_images/927981-bbe7d39a37db86c2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![Screenshot from 2017-06-14 00-33-47.png](http://upload-images.jianshu.io/upload_images/927981-503c7ea323b4a56e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![Screenshot from 2017-06-14 00-33-47.png](http://upload-images.jianshu.io/upload_images/927981-e35db7f2655af1a2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![Screenshot from 2017-06-14 00-35-05.png](http://upload-images.jianshu.io/upload_images/927981-ae0504651d4831d3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![Screenshot from 2017-06-14 00-35-22.png](http://upload-images.jianshu.io/upload_images/927981-5e4034bc300f1fd2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![Screenshot from 2017-06-14 00-36-24.png](http://upload-images.jianshu.io/upload_images/927981-5f2562acdd72c3db.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


![Screenshot from 2017-06-14 00-38-10.png](http://upload-images.jianshu.io/upload_images/927981-0e54091c2aba297a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
