---
layout: post
title: "linux安全审计"
excerpt: "audit"
category: linux
tags: [security, linux]
disqus: true
---


[Guide to the Secure Configuration of Red Hat Enterprise Linux 5](https://www.nsa.gov/ia/_files/os/redhat/rhel5-guide-i731.pdf)安全审计部分，章节2.6.2


rhel提供了安全审计服务audit，默认情况下，该服务审计SELinux [AVC](https://www.nsa.gov/research/_files/selinux/papers/slinux/node30.shtml) denials和一些类型的安全事件。比如程序执行的系统登录、账户修改、和认证事件。

默认情况下，auditd消耗的磁盘空间不影响系统性能。无论你的系统有没有开启SELinux支持，都建议开启auditd的默认配置。

比如美国国防部常见的审计需求有：

- 确保审计确定的系统事件：
    - 成功和不成功的使用打印机的命令
    - 成功或不成功的启动和关闭事件
- 确保被审计软件可以被记录以下审计事件：
    - 事件的日期和时间
    - 执行时间的用户id
    - 时间类型
    - 时间成功或失败
    - 标识和认证事件请求的来源(比如terminal ID)
    - 对向用户地址空间引入对象的事件，对对象删除操作、对象名称和[MLS系统](http://en.wikipedia.org/wiki/Multilevel_security)中对象的安全级别。
- 确保至少每周备份到另一个系统或媒介上
- 确保旧日志被关闭，新的审计日志每天开始。
- 确保配置不可更改。在audit.rule中`-e 2`设定更改审计规则需要重启。
- 确保审计数据文件权限为`644`或者更严格。

## 开启auditd服务

enable auditd服务：

    chkconfig auditd on

默认情况下，auditd只记录SELinux denials，特定安全事件类型比如用户账户更改，登录事件和调用`sudo`

数据保存在`/var/log/audit/audit.log`。默认情况下`auditd`rotates 4个5MB日志，总共占据20MB空间。这样减小了系统压力，但可能丢失审计数据。

## 配置auditd数据存储

- 确定当个日志文件的最大大小`STOREMB`(单位为mb)，增减或更改`/etc/audit/auditd.conf`的如下行：

    max_log_file = STOREMB

- 对日志文件使用单独的分区或者逻辑卷。在安装时分区，要比auditd要用的稍微大点(大于`max_log_file x num_logs`)，确保审计分区挂载在`/var/log/audit`
- 如果当审计无法执行时需要停机，配置auditd在磁盘空间不足时中止系统。编辑`/etc/audit/auditd.conf`，增加或修改如下行(磁盘空间不足给管理员发邮件)：

    space_left_action = email
    action_mail_act = root
    admin_space_left_action= halt

默认的action是当日志达到单个日志的最大大小，循环日志，丢弃最老的。如果保留尽可能多的日志很重要，即使空间耗尽执行`admin_space_left_action`中定义行为，添加或修改如下行：

    max_log_file_action = keep_logs

需要日志文件的大小和审计的事件类型密切相关。首先配置审计记录所有感兴趣的事件，人工监控一段时间日志大小去做决定。

使用单独的分区`/var/log/audit`来阻止auditd日志耗尽磁盘空间影响系统功能，最重要的是，阻止其它/var中的程序填满审计日志空间。

有些机器需要不做出action，如果是这样，直接设定成在耗尽磁盘空间时关机就行。

注意：较老的日志会被循环丢弃！

注意！！！！：如果系统配置为不能记录日志时停机，确定正常情况下不会发生这种事！确保`/var/log/audit`在单独的分区上，并且比auditd需要的保留数据的最大大小要大。

## 配置使先于audit守护进程启动的进程生效

为了确保先于audit进程启动的进程被审计，在`/etc/grub.conf`添加内核启动参数`audit=1`：

    kernel /vmlinuz-version ro vga=ext root=/dev/VolGroup00/LogVol00 rhgb quiet audit=1

系统上每个进程都有个`auditable`标志标识它们是否能被审计。尽管auditd负责使所有它之后被启动的进程被审计，添加内核参数确保在启动时为每个进程设置参数。

## 配置全面的审计规则

auditd能对系统活动实行全面的审计。这一部分描述了推荐的设置，更全面的请参照其它资源。`linux-audit@redhat.com`邮件列表是个好的信息来源。

审计子系统支持大量事件类型，包括：

- 追踪任何进入或退出的系统调用(以名称或编号命名)。
- 以PID，UID，调用成功与否，系统调用参数(有些限制)等等来过滤。
- 监控特殊文件内容和元数据的更改。

审计规则在`/etc/audit/audit.rules`控制，添加满足你审计需求的规则。该文件中每一行代表一系列传递给`auditctl`的参数，能用`auditctl`独立测试。参见`/usr/share/doc/audit-version`和相关man页面获取更多信息。

推荐的审计规则在`/usr/share/doc/audit-version/stig.rules`提供，激活这些规则：

    cp /usr/share/doc/audit-version/stig.rules /etc/audit/audit.rules

然后编辑`/etc/audit/audit.rules`注释掉不适合你的架构的包含`arch=`的行。然后检查和理解其中的规则，确保需要的规则在合适的架构上被激活。

检查完所有规则后，阅读以下章节，编辑和激活需要的新规则：

    service auditd restart

## 记录更改日期和时间信息的事件

添加以下规则到`/etc/audit/audit.rules`，设置`ARCH`为你系统合适的架构，要么是`b32`，要么是`b64`:

    -a always,exit -F arch=ARCH -S adjtimex -S settimeofday -S stime -k time-change
    -a always,exit -F arch=ARCH -S clock_settime -k time-change
    -w /etc/localtime -p wa -k time-change

(参见`man auditctl`)

## 记录更改用户/组信息的事件

添加以下规则到`/etc/audit/audit.rules`，为了捕捉更改账户变化的事件：

    -w /etc/group -p wa -k identity
    -w /etc/passwd -p wa -k identity
    -w /etc/gshadow -p wa -k identity
    -w /etc/shadow -p wa -k identity
    -w /etc/security/opasswd -p wa -k identity

## 记录更改系统网络环境的事件

添加以下规则到`/etc/audit/audit.rules`，根据系统架构设置`ARCH`为或者`b32`或者`b64`：

    -a exit,always -F arch=ARCH -S sethostname -S setdomainname -k system-locale
    -w /etc/issue -p wa -k system-locale
    -w /etc/issue.net -p wa -k system-locale
    -w /etc/hosts -p wa -k system-locale
    -w /etc/sysconfig/network -p wa -k system-locale

## 记录更改系统强制访问存取(MAC)策略的事件

添加`/etc/audit/audit.rules`:

    -w /etc/selinux/ -p wa -k MAC-policy

## 记录登入注销变更事件的尝试

审计系统已经收集了所有用户和root的登录信息。去监视尝试手工更改存储登入事件的文件，向`/etc/audit.rules`添加以下行：

    -w /var/log/faillog -p wa -k logins # RHEL6中再无这个，pam_tally不再写入其中
    -w /var/log/lastlog -p wa -k logins

## 记录更改进程和会话初始化信息的尝试

    -w /var/run/utmp -p wa -k session
    -w /var/log/btmp -p wa -k session
    -w /var/log/wtmp -p wa -k session

## 确保auditd收集任意存取控制权限更改事件

最起码审计系统会收集所有用户和root的文件权限更改。添加以下到`/etc/audit/audit.rules`，设置`ARCH`为系统合适的架构，要么`b32`或者`b64`：

    -a always,exit -F arch=ARCH -S chmod -S fchmod -S fchmodat -F auid>=500 \
        -F auid!=4294967295 -k perm_mod
    -a always,exit -F arch=ARCH -S chown -S fchown -S fchownat -S lchown -F auid>=500 \
        -F auid!=4294967295 -k perm_mod
    -a always,exit -F arch=ARCH -S setxattr -S lsetxattr -S fsetxattr -S removexattr -S \
        lremovexattr -S fremovexattr -F auid>=500 -F auid!=4294967295 -k perm_mod # 红帽的非权限用户起始uid为500, 4294967295为最大32位无符号整数

## 使用auditd收集未认证的文件访问尝试(失败)

最起码审计系统收集所有用户和root的未授权文件访问信息。添加以下行到`/etc/audit/audit.rules`，设置`ARCH`：

    -a always,exit -F arch=ARCH -S creat -S open -S openat -S truncate -S ftruncate \
        -F exit=-EACCES -F auid>=500 -F auid!=4294967295 -k access
    -a always,exit -F arch=ARCH -S creat -S open -S openat -S truncate -S ftruncate \
        -F exit=-EPERM -F auid>=500 -F auid!=4294967295 -k access

## 确保auditd收集权限命令使用的信息

最起码审计系统收集所有用户和root的权限命令执行信息。这需要为每个要监视执行的`setuid`或者`setgid`程序添加规则。

首先运行以下命令找到所有本地分区`PART`来生成规则，每个`setuid`或`setgid`程序一个规则：

    find PART -xdev \( -perm -4000 -o -perm -2000 \) -type f | awk {print \
        "-a always,exit -F path=" $1 " -F perm=x -F auid>=500 -F auid!=4294967295 \
        -k privileged" }

然后添加打印的行到`/etc/audit/audit.rules`。

## 确保auditd搜集导出到介质上的信息(成功)

(我不是很明白，看上去似乎是收集非权限用户的挂载信息)

最起码审计系统收集所有用户和root的媒体导出事件。添加以下行到`/etc/audit/audit.rules`，设置`ARCH`：

    -a always,exit -F arch=ARCH -S mount -F auid>=500 -F auid!=4294967295 -k export

## 确保auditd搜集用户的文件删除事件(成功与失败)

最起码审计系统应该收集所有用户和root的文件删除事件。添加以下行到`/etc/audit/audit.rules`，设置ARCH：

    -a always,exit -F arch=ARCH -S unlink -S unlinkat -S rename -S renameat -F auid>=500 \
        -F auid!=4294967295 -k delete

## 确保auditd收集系统管理行为

(其实就是监视sudoer文件)

最起码审计系统应该收集用户和root的管理员行为。添加以下到`/etc/audit/audit.rules`:

    -w /etc/sudoers -p wa -k actions

## 确保auditd收集内核加载卸载信息

添加以下到`/etc/audit/audit.rules`，设置ARCH：

    -w /sbin/insmod -p x -k modules
    -w /sbin/rmmod -p x -k modules
    -w /sbin/modprobe -p x -k modules
    -a always,exit -F arch=ARCH -S init_module -S delete_module -k modules

## 确保auditd配置不可更改

添加以下作为`/etc/audit/audit.rules`的 _最后一行_ ：

    -e 2

通过这个设定，更改审计规则需要重启机器。

## 通过aureport总结和查看审计日志

仔细检查`aureport`的man页面。然后设计一系列便于日常研究审计日志的命令。这些命令可以通过在合适的命名文件在`/etc/crond.daily`中被加入到cron job中。(其它章节中有有关如何确保审计系统收集所有需要事件的信息)

例如，为每个登录到机器的用户生成日报，可在`cron`中运行以下命令：

    aureport -l -i -ts yesterday -te today

查看所有异常行为审计活动，通常先从被触发审计规则摘要看起：

    aureport --key --summary

如果违规访问很多，检查它们：

    ausearch --key access --raw | aureport --file --summary

看看执行了哪些可执行文件：

    ausearch --key access --raw | airport -x --summary

如果非法访问发生在特定文件上，并且你想看看哪个用户做的：

    ausearch --key access --file /etc/shadow --raw | aureport --user --summary -i

检查异常活动(比如网卡设备更改到混杂模式，进程异常中止，登录失败次数达到上限)

    aureport --anomaly

审计分析的基础是使用key来分类事件。有关使用ausearch获取SELinux问题的信息在其它章节讨论
