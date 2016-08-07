---
layout: post
title: "Better and Beautiful Console"
excerpt: ""
category: 
tags: []
disqus: true
---


一般的linux控制台（这还是gentoo配置过的默认bash呢）是这样的

![普通控制台](/images/plainconsole.png)

而经过一番简单的配置之后，你的控制台是这样的

![fbterm](/images/fbterm.png)

---

## 如何美化Linux下控制台（Better Framebuffer）

如果你运气足够好，碰上个有良心的发行版会帮你稍微配置下bash，增加些显示当前目录啊、彩色输出啊的功能。如果你足够悲剧，选择了一个以KISS为目标的发行版或者碰到一个无良发行版，你的bash就是个勉强能用的悲剧。

为了让终端在即使没有X也能漂亮起来，为了更加愉快的在没有X的Server下工作，为了不装X胜似装X。让我们开始配置一个漂亮的Linux控制台吧。

我是在gentoo linux完成配置的，首先安装必要的程序：

    emerge fbterm fcitx-fbterm fbv fbdump zsh oh-my-zsh gpm

## zsh

1.把zsh改成默认shell

    chsh -s zsh

2.修改zsh主题

    ZSH_THEME="agnoster"

至此，zsh配置完成。

## fbterm背景图片

3.为了让fbterm显示背景图像，建立一个比如说`.background_fbterm`作为fbterm启动的封装

     ~ ⮀ cat .background_fbterm
    #!/bin/bash
    # fbterm-bi: a wrapper script to enable background image with fbterm
    # usage: fbterm-bi /path/to/image fbterm-options
    echo -ne "\e[?25l" # hide cursor
    fbv -ciuker "$1" << EOF
q
    EOF
    shift
    export FBTERM_BACKGROUND_IMAGE=1
    exec fbterm "$@"

4. 在`.zshrc`中添加一个别名，指定背景图片。

    # fbterm
    alias fbterm="sh ~/.background_fbterm ~/Pictures/wallpaper/girl.png"

## 中文输入法

5. 在`.fbtermrc`中写入以下行，提供framebuffer下的中文输入法。

    # specify the favorite input method program to run
    input-method=fcitx-fbterm
## 鼠标支持

你会迷恋上中键粘帖的。

---

看到没有，简单5步，即使没有X，一个漂亮、高效、支持中文显示和输入的控制台就诞生了。

ps:关于终端截图。`fbgrab`获取的图像错位，

即使多次尝试w和h：

    cat /dev/fb0 > fb.raw
    fbgrab -i -w 1056 -h 1024 -b 32 -f framebuffer.raw fb.png

获取的也是错位的图像。

后来编译个`fbdump`挺好用的。

    fbdump > fb.ppm

然后用gimp啊等转成其它格式就随意了

    gimp fb.ppm
