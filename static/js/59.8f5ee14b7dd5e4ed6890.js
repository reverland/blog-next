webpackJsonp([59,192],{563:function(n,t){n.exports={rawContent:"\n\n胡乱翻译自[On Disk Encryption with Red Hat Enterprise Linux](http://people.redhat.com/~bowe/summit/2011/tot/on_disk_encryption/)，个人笔记，随便看看。\n\n## 硬盘加密\n\n### 目标\n\n我们的愿景是：在数据不在使用时保密硬盘数据。\n\n### 情景\n\n- 电脑丢失\n- U盘丢失\n- 一个月才用一次的个人金融信息\n- 敏感隐私数据存储\n\n### 不保护\n\n- 应用不断读取和写入的数据(依靠权限控制、SElinux等)\n- 在互联网上传输的数据(TLS)\n- 键盘输入嗅探\n\n### 两种基本方式\n\n- `dm-crypt`: 块层级的加密。\n  - 加密整个卷\n  - 通过设备映射实现\n  - 把加密后的块设备以虚拟明文块设备呈现\n- `eCryptfs`: 文件系统加密\n  - 加密单个文件\n  - 作为文件系统层实现\n  - 呈现明文文件\n\n## dm-crypt和LUKS块设备加密\n\n### dm-crypt和LUKS块设备加密\n\n- `dm-crypt`提供块加密能力\n- `LUKS`：Linux Unified Key Setup。一种硬盘加密标准。定义密钥管理和在硬盘上的格式。\n\n### 应用场景1：保护用户文件\n\n- 加密`/home`分区(比如'/dev/sda3')\n- 让所安装的OS不加密\n\n#### 演示\n\n<font style=\"color: red\">警告：不要试，这个例子就看看。会摧毁/home下数据你可以试试下个例子</font>\n\n首先别忘了加载必要的内核模块\n\n    modprobe aes \n    modprobe dm_crypt\n\n1. 初始化随机数据\n\n        dd if=/dev/urandom of=/dev/sda3\n\n2. 格式化LUKS加密层：\n\n        cryptsetup luksFormat /dev/sda3\n\n3. 打开LUKS加密层：\n\n        cryptsetup luksOpen /dev/sda3 home_plaintext\n\n4. 格式化文件系统：\n\n        mkfs.ext4 /dev/mapper/home_plaintext\n\n5. 挂载准备好的文件系统，写入`/etc/fstab`：\n\n        /dev/mapper/home_plaintext  /home       ext4    defaults        0   0\n\n6. 在加密硬盘上注册，写入`/etc/crypttab`\n\n        home_plaintext      /dev/sda3\n\n### 应用场景2：一个文件加密容器\n\n仅仅加密文件。\n\n#### 演示：\n\n1. 创建一个100M的文件：\n\n        dd if=/dev/urandom of=crypt.img bs=1M count=100\n\n2. 把文件和设备连接起来：\n\n        losetup /dev/loop0 crypt.img\n\n3. 格式化LUKS加密层：\n\n        cryptsetup luksFormat /dev/loop0\n\n4. 打开LUKS加密层：\n\n        cryptsetup luksOpen /dev/loop0 container\n\n5. 格式化文件系统(可以先用`dm-table`或者`ls /dev/mapper`来检查)。\n\n        mkfs.ext4 /dev/mapper/container\n\n6. 挂载文件系统\n\n        mount /dev/mapper/container /mnt\n\n7. 这时就可以向`/mnt`下写入想加密的文件了。\n\n8. 使用完毕后，卸载分区\n\n        umount /mnt\n\n9. 关闭luks磁盘：\n\n        cryptsetup luksClose container\n\n10. 设备文件脱钩：\n\n        losetup -d /dev/loop0\n\n这时你的文件就加密保存在`container`中。\n\n## ecrypt-fs\n\n### eCryptfs文件系统\n\n### 场景：创建一个隐私文件夹\n\n- 创建一个`~/Private`内的文件是加密的。\n- `~/Private`外的文件都是明文的\n\n#### 展示\n\n首先别忘了加载内核模块，如果没有默认加载的话：\n\n      modprobe ecryptfs\n\n1. 创建一个表文件夹'~/Private'和里文件夹'~/.Private'\n\n        mkdir -m 700 ~/.Private\n        mkdir -m 500 ~/Private\n\n2. 将里文件夹挂载到表文件夹上：\n\n        mount -t ecryptfs .Private Private\n\n3. 对表文件夹操作写入等等\n\n4. 卸载表文件夹，只剩下加密后的里文件夹\n\n        umount ~/Private\n\n### 为最终用户创建私密文件夹\n\necryptfs-util提供了方便的脚本：\n\n- `ecryptfs-setup-private`\n- `ecryptfs-mount-private`\n- `ecryptfs-umount-private`\n\n提供了几个便利：\n\n- 提升挂载和卸载权限\n- 需要是组`ecryptfs`中的成员\n- 用登录密码封装FEKEK(文件加密密钥密钥)\n\n暂不讨论，我这里出错了。\n",metaData:{layout:"post",title:"On Disk Encryption",excerpt:" linux硬盘数据加密概要",category:"linux",tags:["security","linux"],disqus:!0}}}});