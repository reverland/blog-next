---
layout: post
title: "linux权限控制"
excerpt: "linux权限控制笔记"
category: linux
tags: [ACL, security]
disqus: true
---


最近工作上要用到加固linux系统，还有各种权限控制。发现[鸟哥的书](http://vbird.dic.ksu.edu.tw/)简直是相当赞啊。用了这么久linux，其实真是对其中的各种权限控制策略一无所知。

除了传统的基于user-group-others和rwx的权限控制。还有ACL、SELinux。


## 基本权限控制

对文件所属用户、组、其它分别设置读、写、执行权限。

这里只提下，`ls`需要目录有执行权限.

## PAM模块

一个统一权限认证接口，其它程序通过PAM来进行权限认证。

## ACL

Acess Control List。可以针对某一用户单一文件、单一目录进行rwx权限控制。ACL来自文件系统支持。

ACL支持需要在挂载时指定挂载参数(`mount options`)支持，目前流行的ext2,ext3,ext4, xfs, ReiserFS都支持。

这里提下判断顺序，分为两步，先检查ACL条目，再检查基本权限.

    If
        the user ID of the process is the owner, the owner entry determines access
    
    else if
        the user ID of the process matches the qualifier in one of the named user entries, this entry determines access
    
    else if
        one of the group IDs of the process matches the owning group and the owning group entry contains the requested permissions, this entry determines access
    
    else if
        one of the group IDs of the process matches the qualifier of one of the named group entries and this entry contains the requested permissions, this entry determines access
    else if
        one of the group IDs of the process matches the owning group or any of the named group entries, but neither the owning group entry nor any of the matching named group entries contains the requested permissions, this determines that access is denied
    
    else
        the other entry determines access.
    
    If
        the matching entry resulting from this selection is the owner or other entry and it contains the requested permissions, access is granted
    
    else if
        the matching entry is a named user, owning group, or named group entry and this entry contains the requested permissions and the mask entry also contains the requested permissions (or there is no mask entry), access is granted
    
    else
        access is denied.

更改和查看acl通过`setfacl`和`getfacl`实现。

## SELinux

传统的权限控制是控制使用者的行为，SELinux则是控制程序的行为。SELinux功能实现在内核部分。

程序有什么行为时，SELinux先进行判断，如果有权限再交给传统的权限控制机制判断。

详细请参考鸟哥的[SELinux 管理原则](http://vbird.dic.ksu.edu.tw/linux_server/0210network-secure.php#selinux)

后来看到这个了[https://www.centos.org/docs/5/html/Deployment\_Guide-en-US/selg-overview.html](https://www.centos.org/docs/5/html/Deployment_Guide-en-US/selg-overview.html)

还是红帽厉害……[SELinux User's and Administrator's Guide](https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/7/html/SELinux_Users_and_Administrators_Guide/index.html)

还有gentoo的[维基](http://wiki.gentoo.org/wiki/SELinux)

## 参考资料

- [How do UNIX file permissions work?](http://docs.joomla.org/How_do_UNIX_file_permissions_work%3F)
- [POSIX Access Control Lists on Linux](http://users.suse.com/~agruen/acl/linux-acls/online/)
- [ 第十七章、程序管理与 SELinux 初探](http://vbird.dic.ksu.edu.tw/linux_basic/0440processcontrol_5.php)

