webpackJsonp([84,197],{558:function(n,e){n.exports={rawContent:"\n\n## Install and Configure GNS3\n\nFirst, You should install gns3:\n\n    sudo emerge --autounmask-write gns3\n    sudo dispatch-conf\n    sudo emerge gns3\n\nThen you need to prepare for ios images, You can download them from:\n\n    ftp://ftp.unikon-ua.net/pub/Cisco/IOS/\n    http://115.com/file/clsclmjb\n\nThen you should configure them:\n\n    Edit>IOS Images and Hypervisors\n\nAnd calculate 'Idle PC'。\n\nYou may want to get rid of warning of `baseconfig.txt`, refer to:\n\n    http://forum.gns3.net/post12717.html\n\nIf you are using KDE, you may use konsole's preconfigured terminal commands.\n\n    Edit>Preferences>General>Terminal Settings\n\nYou need to install and configure virtualbox at `Edit>Preferences>VirtualBox`:\n\n- modify `Path to vboxwrapper` to:\n\n      /usr/libexec/gns3/vboxwrapper.py\n\n- emerge virtualbox with sdk and python USE flags\n- install vboxapi:\n\n      cd /usr/lib/virtualbox/sdk/installer/\n      export VBOX_INSTALL_PATH=/usr/lib/virtualbox/\n      python vboxapisetup.py install\n\n- install xdotool(It's quite an interesting tool!)\n      sudo emerge xdotool\n- add virtual system:\n      Edit>Preferences>VirtualBox>VirtualBox Guest\n\nYou need to install qemu at `Edit>Preferences>Qemu`:\n\n- modify `Path to qemu`:\n\n      qemu-system-x86_64\n\n- modify path to qemuwrapper to:\n\n      /usr/libexec/gns3/qemuwrapper.py\n\n- kernel should support kvm-intel:\n\n       ⮀ ~ ⮀ lsmod|grep kvm\n      kvm_intel             117933  0 \n      kvm                   225670  1 kvm_intel\n\n- and add you user to:\n\n    gpasswd -a username kvm\n\n- add virtual system, which can be `vdi`\n\n- If you want to use PIX firewall, download pemu from [Sourceforge](http://sourceforge.net/projects/gns-3/files/Pemu/2008-03-03/pemu_2008-03-03_bin.tar.bz2/download) and cp them to the directory which has `qemuwrapper.py`. You can reffer to: [http://www.gns3.net/documentation/gns3/pix-firewall-emulation/](http://www.gns3.net/documentation/gns3/pix-firewall-emulation/)\n\n- if you re-compile kernel, don't forget to re-compile kernel modules for virtualbox and modprobe them\n\n## More configuration\n\nMore configuration and downloads(I tried and failed, do not know what is actually is and how to use it):\n\n- [分享--实现用GNS3模拟 PC，PIX，Juniper，ASA，IPS的应用 (中文)](http://xinchq2011.blog.51cto.com/2086938/1256837)\n\n\n## A Simple Test\n\n- Calc idle PC, very important!!\n\nconfigure the router with the help of [OSPF configure(中文)](http://www.linkwan.com/gb/routertech/routerbase/ciscomanual/015.htm)\n\nA better choice to learn without these configuration, try [GNS3 WorkBench](http://sourceforge.net/projects/gns3workbench/files/v5.8/)\n",metaData:{layout:"post",title:"GNS3 on Gentoo Linux",excerpt:"在Gentoo Linux上配置GNS3",category:"network",tags:["linux","gentoo","gns3"],disqus:!0}}}});