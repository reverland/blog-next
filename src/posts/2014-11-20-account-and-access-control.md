---
layout: post
title: "Account and Access Control"
excerpt: "账户和访问控制"
category: linux
tags: [security, linux]
disqus: true
---


传统的Unix中，一旦攻击者获得对应帐号的shell，他就能执行该账户所能行使的任何行为，存取该账户能存取的任何文件。因此，让未授权的人获得指定帐号shell更加困难(特别是对权限账户)，是系统安全重要的部分。本文介绍如何引入限制账户登录的机制。

## 限制基于密码的登录来保护账户

传统Unix账户通过提供用户名和密码登录，这些用户名和密码会和储存在`/etc/passwd`和`/etc/shadow`中的内容对比。密码登录可能被被猜测，被嗅探，被中间人截取，无论是从网络还是不安全的控制台中。因此，限制账户密码登录的机制很重要。

### 限制root只能在系统控制台登录

编辑`/etc/securetty`，确保只有以下行：

- 基本的系统控制台设备：

        console

- 虚拟控制台设备

        tty1
        tty2
        tty3
        tty4
        ...

- 如果需要，保留这些废弃的控制台接口来保留向后兼容。

        vc/1
        vc/2
        ...

- 如果需要，添加串口控制台：

        ttyS0
        ttyS1

仅在紧急情况下才允许root直接登录。通常，管理员可以通过唯一的非权限用户使用`su`或者`sudo`来执行权限命令。不鼓励管理员直接使用root用户有助于对多管理员系统的审计工作。减少root能直接连接的通道减少了root密码被猜解的几率。

`login`程序使用`/etc/securetty`确定哪些接口允许root登录。虚拟设备`/dev/console`和`/dev/tty*`代表系统控制台(通过`Ctrl-Alt-F1`等打开)。默认的`securetty`文件也包含`/dev/vc/*`，来保留历史兼容性。

root用户也应该禁止通过网络协议登录。本文暂不讨论。

### 限制su到root账户

确保组`wheel`存在，所有持有root权限的管理员用户名作为其中的组员。

    grep ^wheel /etc/group

编辑文件`/etc/pam.d/su`，添加、注释或者更改该行：

    auth    required    pam_wheel.so    use_uid

`su`命令允许用户从其它用户通过输入密码获得权限。因此限制已知管理员使用root是必要的。一般`wheel`用户组包含允许运行权限命令的全部用户。PAM模块`pam_wheel.so`被用来限制一组用户的接入。

### 配置sudo改善对root访问的审计

确保`wheel`存在，所有持有root权限的管理员用户名作为其中的组员。

    grep ^wheel /etc/group

编辑`/etc/sudoers`，添加、取消注释或者更改如下行：

    %wheel  ALL=(ALL)   ALL

`sudo`能很好的控制哪个用户能用其它账户执行命令。这为每个权限用户执行的命令提供了审计可能。也许恶意管理员会绕过这个限制，但这个机制保证审计更容易。

手工编辑`/etc/sudoer`很危险，配置错误也许会禁用远程root访问。推荐的方式是用`visudo`命令编辑这个文件，该命令会在保存前检查文件语法。

权衡sudo带来的审计好处和安全风险。永远不要使用`NOPASSWD`指令，这会允许任何获取管理员账户的人在不知管理员密码的情况下以root身份执行命令。

更多定制参见`sudoers` man页面

### 禁止非root系统账户登录和使用shell

！！！！！！！！注意：不要对root执行以下配置

使用一下命令查看`/etc/passwd`

    awk -F: '{print $1 ":" $3 ":" $7}' /etc/passwd

找到那些UID低于500(系统账户)，不是root的账户：

对每个系统账户`SYSACCT`，锁定：

    usermod -L SYSACCT

禁用它们的shell：

    usermod -s /sbin/nologin SYSACCT

### 确认密码被适当存储和哈希

#### 确保没有账户有空密码

使用以下命令查看：

    awk -F: '($2 == "") {print}' /etc/shadow

如果有输出，检查这些账户并设置密码。

#### 确保所有账户密码哈希都被shadow

确保没有在`/etc/passwd`中保存密码哈希：

    awk -F: '($2 != "x") {print}' /etc/passwd

这个命令应该没有输出，所有密码哈希应该保存在`/etc/shadow`而不是所有用户都能读的`/etc/passwd`

### 确认没有非root用户的UID为0

列出所有UID为0的用户：

    awk -F: '($3 == "0") {print}' /etc/passwd

通常，最好的审计实践是所有root账户的使用都限制到使用su或这sudo。有些站点使用多个管理员拥有UID 0，这种做法可能有意料外的副作用，并不推荐。

### 设置密码过期参数

编辑`/etc/login.defs`指定某个新账户的密码过期时间。添加或修改如下行：

    PASS_MAX_DAYS 60
    PASS_MIN_DAYS 7
    PASS_MIN_LEN 14
    PASS_WARN_AGE 7

对已经存在的人类用户`USER`，更改当前过期设置如下：

    chage -M 60 -m 7 -W 7 USER

更改密码要在稳定性和安全性之间权衡，90到360天比较推荐。

#### 从libuser.conf移除密码参数

确保`/etc/libuser.conf`在`[import]`节包含：

    login_defs = /etc/login.defs

同时确保在`[userdefaults]`下没有以下单词开头的行，这些设定会覆盖`/etc/log   in.defs`的设定：

    LU_SHADOWMAX
    LU_SHADOWMIN
    LU_SHADOWWARNING

`/etc/libuser.conf`文件包含libuser库的配置选项，这个库提供了一套操作和管理用户和组帐号的标准接口。默认情况下从`/etc/login.defs`读取密码设置，但是`/etc/libuser.conf`能覆盖这些参数。查看`libuser.conf`的man页面获取更多信息。

### 移除密码文件中遗留的+条目

用一下命令找到这些行：

    grep "^+:" /etc/passwd /etc/shadow /etc/group

确保没有输出。

`+`被用来将来自NIS的数据映射到已知文件。一个`/etc/passwd`中NIS包含错误，但NIS没有运行会导致任意用户以`+`用户名免密码访问。

告诉本地系统使用网络数据库，比如LDAP或NIS，来获取用户信息的正确的方式是确保在`/etc/nsswitch.conf`中适当的配置。

## 通过Unix组来加强安全

通过标准Unix权限的访问控制很弱，但也可以利用。

### 为每个账户创建一个唯一默认组

当使用`useradd`命令时，不要使用`-g`参数覆盖默认组。

RedHat默认为每个用户创建相同名称的唯一所属组。推荐这样，保护组写权限的文件。

### 创建和维护包含所有人类账户的组

找到系统上所有人类用户，比如UID大于500的，一旦确认，创建一个`usergroup`组，并且把每个人类账户加进去：

    groupadd usergroup
    usermod -G usergroup human1
    usermod -G usergroup human2
    usermod -G usergroup human3
    usermod -G usergroup human4

当用`useradd`添加新用户时，用`-G usergroup`将人类账户添加到改组。

这样做便于管理人类用户，比如为`/path/to/graphical/command`授权用户：

    chgrp usergroup /path/to/graphical/command
    chmod 750 /path/to/graphical/command

同时，限制非人类系统账户执行命令也非常重要。

## 通过配置PAM保护帐号

PAM，可插拔认证模块是为linux程序提供认证的模块。PAM是一个框架，提供可配置的系统认证架构来最小化系统所面对的风险。

PAM被作为一套动态共享库实现，在任何应用程序想认证用户的时候被加载和调用。通常为了使用PAM应用程序需要以root运行，传统的权限网络监听比如sshd和SUID程序比如sudo已经满足了这个要求。一个叫做`userhelper`的SUID root应用被用来为没有SUID或权限的程序提供利用PAM的可能。

PAM在`/etc/pam.d/`下搜寻应用特异的配置信息。比如对`login`程序，PAM库会遵循`/etc/pam.d/login`中的指示。

一个非常重要的文件是`/etc/pam.d/system-auth`。这个文件被许多其它文件包含(奇怪的是从RHEL6开始sshd只包含`/etc/pam.d/password-auth`)，作为默认的系统认证措施，更改这个文件能确保全面的更改。

更改PAM的配置要十分小心，语法很复杂，更改可能有意料外的结果。默认配置对大多数用户足够了。

注意！！！！！！！！！！：运行`authconfig`或者`system-config-authentication`将覆盖PAM配置文件，摧毁任何手动的更改，将其覆盖成系统默认。

### 设定密码质量要求

默认的PAM模块`pam_cracklib`提供了加强的密码检查。它可以执行一系列检查包含字典单词的相似，最小长度，不是之前的密码，不是之前密码的简单大小写修改等。也能要求密码包含特定类型的字符。

`pam_passwdqc`模块提供了更严格的密码强度强制要求。可通过RPM包下载。

#### 如果使用pam_cracklib,设置密码质量需求

用`pam_cracklib`配置密码至少包含一个大写、小写、数字和其它字符，定位`/etc/pam.d/system-auth`中的一下行：

    password requisite pam_cracklib.so retry=3

更改为(呵呵，required意指即使失败仍然会继续后面required的模块验证，然后在返回错误，让用户不知道哪里出的问题)

    password required pam_cracklib.so retry=3 minlen=14 \
                        dcredit=-1, ucredit=-1 ocredit=-1 lcredit=-1

如果必要，更改为符合你要求的配置。

#### 如果使用pam_passwdqc,设置密码质量需求

如果需要比`pam_cracklib`保证的密码强度更强，使用`pam_passwdqc`模块。

更改`/etc/pam.d/system-auth`中的如下行：

    password requisite pam_cracklib.so retry=3

为(呵呵，这个直接requisite，只要不符合要求PAM就直接返回错误了)
    password requisite pam_passwdqc.so min=disabled,disabled,16,12,8

按自己需要配置。

### 设置失败密码尝试锁定

使用`pam_tally2.so`模块来实现一定数量错误登录尝试后锁定账户。在`/etc/pam.d/system-auth`中添加到第一个auth开头的行上头(呵呵，RHEL6后`/etc/pam.d/sshd`包含的是`/etc/pam.d/password-auth`而不是`/etc/pam.d/system-auth`，所以，对ssh登录尝试锁定应该是对`password-auth`这个文件更改。)

    auth required pam_tally2.so deny=5 onerr=fail unlock_time=900

在account开头的行上头加上一行：

    account required pam_tally2.so

root要单独设置`root_unlock_time=900`

要解锁用户使用`pam_tally2`命令

    /sbin/pam_tally2 --user username --reset

锁定用户造成潜在的DOS攻击，但能阻止密码猜解。权衡利弊设置`unlock_time`

### 使用pam_deny.so快速禁止访问服务

通过PAM阻止服务SVCNAME的访问，编辑`/etc/pam.d/SVCNAME`文件，添加这一行：

    auth    requisite   pam_deny.so

这不是啥值得推荐的方法，不过挺方便，呵呵。

### 仅控制台用户执行userhelper

如果你的环境定义了一个组`usergroup`包含所有系统上的人类用户，限制`userhelper`程序只能由这些用户执行。(4710中的4表示suid/guid)

    chgrp usergroup /usr/sbin/userhelper
    chmod 4710 /usr/sbin/userhelper

`userhelper`程序提供必须以root运行的图形服务认证，比如`system-config-`族图形配置程序。只有登录到系统控制台的人类用户可以运行这些。以上提供了一定对`userhelper`实现缺陷的保护，防止被侵入的系统账户进一步提权。

`userhelper`程序在`/etc/securetty/console.app/`下的文件配置。每个文件指定了程序以什么身份运行，成功认证后应该执行什么。

注意：这些配置和PAM的配置`/etc/pam.d`下的配置相配合才能起作用。首先`userhelper`决定服务应该以什么身份运行(比如root)，然后`userhelper`使用PAM API来允许运行程序的用户尝试认证为想要借身份运行的用户。PAM的API交互被封装在GUI中，如果程序配置要求的话。

### 升级密码哈希算法到SHA-512

需要编辑3个文件：

首先`/etc/pam.d/system-auth`中确保sha512被`pam_unix.so`模块在password节使用。而不是使用其它算法：(可能得改password-auth)

    password sufficient pam_unix.so sha512 shadow nullok try_first_pass use_authtok

其次，编辑文件`/etc/login.defs`添加或更改以下行(确认下就好)：

    ENCRYPT_METHOD SHA512

最后，编辑`/etc/libuser.conf`添加或更改以下行：

    crypt_style=sha512

其实吧，这是RHEL6的默认配置，呵呵。

### 限制密码重用

`pam_unix`模块使用`remember`参数可以防止用户重用最近的密码。为了阻止用户使用最近5次的密码，向`/etc/pam.d/system-auth`文件中，使用`pam_unix`模块的`password`行添加`remember=5`参数。

旧的密码(禁止重用的)保存在`/etc/security/opasswd`中。

### 尽可能移除pam_crreds包

除非用到认证缓存功能，移除`pam_ccreds`包：

    yum erase pam_ccreds

该包包含setuid文件`/usr/sbin/ccreds_validate`。如果系统被入侵，任何系统上缓存的认证信息都会被获取。

## 对登录用户使用安全会话配置文件

当一个用户登录进Unix账户时，系统通过读取大量文件配置用户会话。许多这些文件在家目录下。错误或者不当的配置都会造成弱权限。攻击者可以修改甚至读取特定类型的账户信息，对受影响的账户获得全面的访问权限。因此，额是和修正账户特别是权限账户的配置文件权限非常重要。

### 确保Root PATH不存在危险目录

登录一个root shell运行：

    echo $PATH

将给出冒号分隔的文件夹路径。

防止root执行未知或者不受信任的程序很重要，这些程序可能带有恶意代码。因此，root不应该运行非权限用户安装的程序。root经常工作在不受信任的目录，比如`.`代表的当前目录总不该出现在root的PATH中，任何非权限用户或系统用户能写入的目录都是如此。

对系统管理员来说，总是打出命令的绝对路径是个好习惯。

#### 确保Root PATH不包含相对路径或者空目录

对每个路径中的目录`DIR`，确保`DIR`不是一个单一的`.`，或者任何可能导致相对路径遍历的符号比如`..`，或者不是以`/`开头。同时，确保路径中没有空元素，如下：

    PATH=:/bin
    PATH=/bin:
    PATH=/bin::/sbin

这些空元素和一个`.`有相同效果。

我觉得这样比较方便：

    echo $PATH | awk -F: '{for(i=1;i<NF;i++) print $i}'

#### 确保ROOT路径不包含全局可写或组可写的目录

对PATH中的每一个元素，执行：

    ls -ld DIR

确保组和其它的写权限被禁用。

我觉得这样比较好：

    ls -ld `echo $PATH | awk -F: '{for(i=1;i<NF;i++) print $i}'`

### 确保用户家目录不是组可写或者全局可读的

首先通知你的用户。

对每个人类账户`USER`，查看账户权限：

    ls -ld /home/USER

确保目录不是组可写和全局可读的，必要时修正：

    chmod g-w /home/USER
    chmod o-rwx /home/USER

家目录包含许多影响账户行为的配置，其它用户不该有权限写入。组共享目录应该在子目录或者其它什么地方而不是家目录。通常，家目录也不该全局可读。如果有一小撮用户非得读取其它用户目录，通过组来提供权限。

### 确保用户dot文件不是全局可写

确保用户USER家目录下的dot文件不是全局可写：

    ls -ld /home/USER /.[A-Za-z0-9]*

确保任何文件都不是组或全局可写的。通过以下方式修正某个`FILE`：

    chmod go-w /home/USER/FILE

能更改其它用户配置文件的用户可能以那个用户权限执行命令，窃取数据，摧毁文件或者发起进一步攻击。

### 确保用户有合理的umask值

编辑全局配置`/etc/profile`,`/etc/bashrc`和`/etc/csh.cshrc`.添加或修改以下行:

    umask 077

其实profile里看是不是uid大于200且有效组名等于用户名,则设为002(目录775，文件644).否则设为022(目录755，文件644).

编辑`/etc/login.defs`:

    UMASK   077

查看`/etc/csh.login`和`/etc/profile.d/*`中的其它文件，确保没有重定义umask。除非有什么好的理由重定义umask。

    grep -r umask /etc/profile /etc/csh.* /etc/bashrc /etc/login.defs

编辑root shell的配置文件`/root/.bashrc`和`/root/.bash_profile`,`/root/.cshrc`，`/root/.tcshrc`。添加或修改以下行：

    umask 077

这样做确保任何用户创建的文件不会被其它用户读写与执行。如果有特殊需要，则使用`chmod`命令修改它。单个用户可以通过将umask设为`027`让其所在组用户能读和执行其文件。用户名和默认组一致，完全可以直接设成`007`来与组成员共享文件。

另外，暂时更改root 的umask来安装能让其它用户读取的软件或文件，或者修改特定服务帐号的umask默认设定的行为，都是必要的。但严格的默认限制能更好的保护意外泄漏。

### 确保用户没有.netrc文件

对每个人类用户`USER`，确保没有用户有`.netrc`文件。

    find /home -name .netrc

应该没有返回。如果有联系用户讨论删除事宜。

`.netrc`是用来通过ftp无人登录到其它系统的配置文件。这个文件通常包含攻击其它系统未加密的密码。

## 保护物理控制台访问

不大可能保护系统免于物理接触攻击。有些步骤能让攻击者更加难以快速和不被发现地从控制台更改系统。

### 设置BIOS密码

x86系统的BIOS是机器首先运行代码的地方，控制着许多非常重要的系统参数，包含系统从哪个设备以什么顺序启动的信息。

为BIOS配置设置密码防止修改。尽管物理接触的攻击者通常很容易清除密码。

### 设置Boot Loader密码

Boot Loader通常负责启动内核并把参数传递给它。boot loader允许选择多个分区或者介质上的不同内核，能传递给内核的参数包括单用户模式(提供无需认证的root访问)，禁用SELinux。阻止本地用户更改启动参数。为防止本地用户更改启动参数危害安全，启动器配置需要用密码保护：

Grub这样保护：

运行`grub-md5-crypt`得到md5后的哈希`password-hash`

在`/etc/grub.conf`注释头下第一行添加：

    password --md5 password-hash

确保`/etc/grub.conf`的权限。(指向`../boot/grub/grub.conf`)

    chown root:root /etc/grub.conf
    chmod 600 /etc/grub.conf

其它boot loader有类似的密码保护特性。

### 要求单用户模式登录认证

单用户模式被设计用来回复系统，通过启动选项给单用户root权限。默认情况下不需要认证，这造成了安全隐患。

即使以单用户模式启动，也要求输入root密码。在`/etc/sysconfig/init`文件中更改：

    sed -i 's/SINGLE=\/sbin\/sushell/SINGLE=\/sbin\/sulogin/' /etc/sysconfig/init

### 禁用交互式启动

编辑`/etc/sysconfig/init`。添加或更改设置：

    sed -i 's/^PROMPT.*/PROMPT=no/g' /etc/sysconfig/init

交互式启动，用户也许能禁用审计、防火墙和其它服务弱化系统安全。

### 对登录shell实现不活动超时

如果系统不运行X windows，登录shell可以配置为一段时间不活动自动登出用户。以下指令对运行X Windows的系统不合适，因为这将自动(深有体会！！)关闭X环境下的终端。

针对`/bin/bash`，实现一个15分钟的空闲超时，在目录`/etc/profile.d/`下新建文件`tmout.sh`，写入如下行：

    TMOUT=900
    readonly TMOUT
    export TMOUT

对`tcsh`，在`/etc/profile.d/`下新建`autologout.sh`，添加如下行：

    set -r autologout 15

其它登录shell应该类似。

仅仅在shell是前台进程时才会自动登录超时。比如，一个`vi`会话空闲着并不会自动超时登出。

当通过远程连接时，比如SSH，通过该服务设置超时更加有效。

### 配置锁屏

一个是图形界面的锁屏(比如kde的Lock Screen)，一个是控制台(vlock)。
