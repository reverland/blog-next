webpackJsonp([77,192],{545:function(n,t){n.exports={rawContent:'\n\n随便写写端口扫描器，估计不会写多。最近事情太多。\n\n## 原理\n\nTCP端口扫描的基本原理，就是尝试与被探测端口建立连接，如果这个连接能够建立上，则说明端口是开放的。另一方面，按照TCP三次握手标准其实探测端口是否开放并不用完成三次握手建立连接，仅仅收到第二次握手的包基本就足以说明该端口确实打开并提供服务。\n\nUDP是另一种无连接不可靠数据报交付协议，仅仅发送UDP报文到指定端口，然后等待返回。如果收到回复信息则说明该端口确实提供UDP服务，如果在有限时间内没收到任何回复就当作该端口不存在吧。\n\n在扫描大量机器的大量端口时，比如对TCP端口扫描，如果我们发送一个包后等待建立连接，可能由于网络原因等待很久才会收到回复的报文。这样其它待扫描端口不得不等着，整个扫描器在这段时间内除了等待什么都不做。网络上行带宽没得到充分利用。所以，一般采用多线程或者异步的方式来实现扫描器的并发。\n\n扫描器往往不仅仅就看看端口是否开放，它们往往还搜集信息供人判断，甚至可以提供payload来与目标进行交互。\n\n## 检阅\n\n最简单的扫描器，比如说netcat：\n\n     ~ ⮀ nc -v -z bbs.byr.cn 80\n    Warning: inverse host lookup failed for 10.3.18.66: \n    bbs.byr.cn [10.3.18.66] 80 (http) open\n\n事实上你只要找个能建立连接或者构造包的东西都能作为扫描器，比如hping\n\n     ~ ⮀ sudo hping -c 1 google.com -S -V -p 80 \n    using eth0, addr: 10.210.96.200, MTU: 1500\n    HPING google.com (eth0 74.125.128.100): S set, 40 headers + 0 data bytes\n    len=46 ip=74.125.128.100 ttl=29 id=13203 tos=0 iplen=44\n    sport=80 flags=SA seq=0 win=42900 rtt=185.2 ms\n    seq=2055062331 ack=2123742633 sum=2338 urp=0\n    \n    \n    --- google.com hping statistic ---\n    1 packets tramitted, 1 packets received, 0% packet loss\n\n更专业一点的扫描器有nmap，非常专业的扫描器，在nmap script engine的扩展(lua)下更是可以方便的实现各种功能。功能强大、使用简洁暴力。\n\n    ✘ ⮀ ~ ⮀ sudo nmap -sS baidu.com\n    \n    Starting Nmap 6.25 ( http://nmap.org ) at 2014-05-10 10:10 CST\n    Nmap scan report for baidu.com (220.181.111.86)\n    Host is up (0.0019s latency).\n    Other addresses for baidu.com (not scanned): 123.125.114.144 220.181.111.85\n    Not shown: 999 filtered ports\n    PORT   STATE SERVICE\n    80/tcp open  http\n    \n    Nmap done: 1 IP address (1 host up) scanned in 37.67 seconds\n\n近两年出现了更加高效的面向整个互联网的扫描器。一个叫zmap，紧接着是masscan。和nmap的多线程实现不同，这两种扫描器靠异步实现高并发。\n\n## 实践\n\n我本来想详细写写最近研究扫描器的一些心得，可是，最近事情太多，没有心情也没有时间。大致用python写扫描器的一些心得吧。\n\n1. 你不一定要用别人现成的库。因为你可能根本搞不清有些东西是怎么运作的，而一些细节会让你痛不欲生。事实上如果你只想抓取部分信息，不妨直接自己解析报文对应字段。有时你不得不自己去做什么，比如面对某些用ActiveX的奇葩系统而你还想用python来扫描并搜集信息时。\n2. gevent面对网络I/O真是毫无压力，但同时给内存和CPU带来了更大的负担。据说一个Greenlet占用四个文件描述符，gevent要拷贝大量上下文等等。实际上我这里有时并发根本上不去。超过2000就看着CPU一直处于100%左右而网络流量没有任何变化。不知道是哪里的限制，网络上行无法到达顶峰。但一些简单的例子可以无压力达到。\n3. 在进行大范围扫描时不要将某个可能会变的巨大变量塞进内存，虽然把对象放入内存也许会运行的更快，但你的内存满掉时它就不会更快了。这时通过shelve来实现字典相比直接把巨大的dict读入内存并不断扩展更合适。在我的某个例子中，把变量放到硬盘上而不是一股脑塞进内存后性能得到极大改善。\n4. 大文件的读写时，python有个优雅的方式。一行一行读取。无论是什么巨大的东西，比如说15G的字典文件，这样一行一行读入内存然后让python的垃圾回收机制慢慢回收基本不会占用什么内存。\n\n        with open("./data/netbios/temp") as f:\n            for line in f:\n                pool.spawn(get_netbios, line.strip())\n\n\n还有些其它想法。\n\n1. 一个是twisted，虽然之前把一个非常棒的教程完整实践下来，寒假拿着手机把文档直接都看完了，甚至Gsoc的时候还想着如果twisted是mentor organization争取报名参加下。结果几个月没接触，完全不知道怎么使用这个框架了。\n\n2. 一个是python对select和epoll的支持，我觉得可能直接使用epoll实现一些并发比gevent会好很多。可是没空去试，我一直觉得epoll和select这种东西用python写出来真是不堪入目。如果是py3，async也许是个好主意。\n\n3. 在使用python做一些比如ip地址处理等等的时候，你也许会发现python3有着内置的模块，更优雅的处理方式。有那么几次真想完全用python3改写已经使用的东西。不过，还是没空。\n\n还有，同学给了我片单片机，我忽然觉得扫描器玩腻了……\n\n不过面对积累的大量扫描数据，我觉得做做数据分析和可视化还是不错的。不会遥遥无期吧，尽管只对python的工具稍微熟悉，更想去用d3.js做展示。\n\n时间和精力有限，语言技能点该怎么点呢？\n\n汇编、C、javascript、python3、lua、也许go、也许再个ruby.\n\n还有两本书等着看或正在看，TCP/IP internetworking和深入理解计算机系统.\n',metaData:{layout:"post",title:"扫描器原理与实现",excerpt:"我们来看看轮子如何工作和制造轮子",category:"network",tags:["network","security"],disqus:!0}}}});