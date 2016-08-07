---
layout: post
title: "GNS3 on Gentoo Linux"
excerpt: "在Gentoo Linux上配置GNS3"
category: network
tags: [linux, gentoo, gns3]
disqus: true
---


## Install and Configure GNS3

First, You should install gns3:

    sudo emerge --autounmask-write gns3
    sudo dispatch-conf
    sudo emerge gns3

Then you need to prepare for ios images, You can download them from:

    ftp://ftp.unikon-ua.net/pub/Cisco/IOS/
    http://115.com/file/clsclmjb

Then you should configure them:

    Edit>IOS Images and Hypervisors

And calculate 'Idle PC'。

You may want to get rid of warning of `baseconfig.txt`, refer to:

    http://forum.gns3.net/post12717.html

If you are using KDE, you may use konsole's preconfigured terminal commands.

    Edit>Preferences>General>Terminal Settings

You need to install and configure virtualbox at `Edit>Preferences>VirtualBox`:

- modify `Path to vboxwrapper` to:

      /usr/libexec/gns3/vboxwrapper.py

- emerge virtualbox with sdk and python USE flags
- install vboxapi:

      cd /usr/lib/virtualbox/sdk/installer/
      export VBOX_INSTALL_PATH=/usr/lib/virtualbox/
      python vboxapisetup.py install

- install xdotool(It's quite an interesting tool!)
      sudo emerge xdotool
- add virtual system:
      Edit>Preferences>VirtualBox>VirtualBox Guest

You need to install qemu at `Edit>Preferences>Qemu`:

- modify `Path to qemu`:

      qemu-system-x86_64

- modify path to qemuwrapper to:

      /usr/libexec/gns3/qemuwrapper.py

- kernel should support kvm-intel:

       ⮀ ~ ⮀ lsmod|grep kvm
      kvm_intel             117933  0 
      kvm                   225670  1 kvm_intel

- and add you user to:

    gpasswd -a username kvm

- add virtual system, which can be `vdi`

- If you want to use PIX firewall, download pemu from [Sourceforge](http://sourceforge.net/projects/gns-3/files/Pemu/2008-03-03/pemu_2008-03-03_bin.tar.bz2/download) and cp them to the directory which has `qemuwrapper.py`. You can reffer to: [http://www.gns3.net/documentation/gns3/pix-firewall-emulation/](http://www.gns3.net/documentation/gns3/pix-firewall-emulation/)

- if you re-compile kernel, don't forget to re-compile kernel modules for virtualbox and modprobe them

## More configuration

More configuration and downloads(I tried and failed, do not know what is actually is and how to use it):

- [分享--实现用GNS3模拟 PC，PIX，Juniper，ASA，IPS的应用 (中文)](http://xinchq2011.blog.51cto.com/2086938/1256837)


## A Simple Test

- Calc idle PC, very important!!

configure the router with the help of [OSPF configure(中文)](http://www.linkwan.com/gb/routertech/routerbase/ciscomanual/015.htm)

A better choice to learn without these configuration, try [GNS3 WorkBench](http://sourceforge.net/projects/gns3workbench/files/v5.8/)
