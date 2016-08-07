---
layout: post
title: "On Disk Encryption"
excerpt: " linux硬盘数据加密概要"
category: linux
tags: [security, linux]
disqus: true
---


胡乱翻译自[On Disk Encryption with Red Hat Enterprise Linux](http://people.redhat.com/~bowe/summit/2011/tot/on_disk_encryption/)，个人笔记，随便看看。

## 硬盘加密

### 目标

我们的愿景是：在数据不在使用时保密硬盘数据。

### 情景

- 电脑丢失
- U盘丢失
- 一个月才用一次的个人金融信息
- 敏感隐私数据存储

### 不保护

- 应用不断读取和写入的数据(依靠权限控制、SElinux等)
- 在互联网上传输的数据(TLS)
- 键盘输入嗅探

### 两种基本方式

- `dm-crypt`: 块层级的加密。
  - 加密整个卷
  - 通过设备映射实现
  - 把加密后的块设备以虚拟明文块设备呈现
- `eCryptfs`: 文件系统加密
  - 加密单个文件
  - 作为文件系统层实现
  - 呈现明文文件

## dm-crypt和LUKS块设备加密

### dm-crypt和LUKS块设备加密

- `dm-crypt`提供块加密能力
- `LUKS`：Linux Unified Key Setup。一种硬盘加密标准。定义密钥管理和在硬盘上的格式。

### 应用场景1：保护用户文件

- 加密`/home`分区(比如'/dev/sda3')
- 让所安装的OS不加密

#### 演示

<font style="color: red">警告：不要试，这个例子就看看。会摧毁/home下数据你可以试试下个例子</font>

首先别忘了加载必要的内核模块

    modprobe aes 
    modprobe dm_crypt

1. 初始化随机数据

        dd if=/dev/urandom of=/dev/sda3

2. 格式化LUKS加密层：

        cryptsetup luksFormat /dev/sda3

3. 打开LUKS加密层：

        cryptsetup luksOpen /dev/sda3 home_plaintext

4. 格式化文件系统：

        mkfs.ext4 /dev/mapper/home_plaintext

5. 挂载准备好的文件系统，写入`/etc/fstab`：

        /dev/mapper/home_plaintext  /home       ext4    defaults        0   0

6. 在加密硬盘上注册，写入`/etc/crypttab`

        home_plaintext      /dev/sda3

### 应用场景2：一个文件加密容器

仅仅加密文件。

#### 演示：

1. 创建一个100M的文件：

        dd if=/dev/urandom of=crypt.img bs=1M count=100

2. 把文件和设备连接起来：

        losetup /dev/loop0 crypt.img

3. 格式化LUKS加密层：

        cryptsetup luksFormat /dev/loop0

4. 打开LUKS加密层：

        cryptsetup luksOpen /dev/loop0 container

5. 格式化文件系统(可以先用`dm-table`或者`ls /dev/mapper`来检查)。

        mkfs.ext4 /dev/mapper/container

6. 挂载文件系统

        mount /dev/mapper/container /mnt

7. 这时就可以向`/mnt`下写入想加密的文件了。

8. 使用完毕后，卸载分区

        umount /mnt

9. 关闭luks磁盘：

        cryptsetup luksClose container

10. 设备文件脱钩：

        losetup -d /dev/loop0

这时你的文件就加密保存在`container`中。

## ecrypt-fs

### eCryptfs文件系统

### 场景：创建一个隐私文件夹

- 创建一个`~/Private`内的文件是加密的。
- `~/Private`外的文件都是明文的

#### 展示

首先别忘了加载内核模块，如果没有默认加载的话：

      modprobe ecryptfs

1. 创建一个表文件夹'~/Private'和里文件夹'~/.Private'

        mkdir -m 700 ~/.Private
        mkdir -m 500 ~/Private

2. 将里文件夹挂载到表文件夹上：

        mount -t ecryptfs .Private Private

3. 对表文件夹操作写入等等

4. 卸载表文件夹，只剩下加密后的里文件夹

        umount ~/Private

### 为最终用户创建私密文件夹

ecryptfs-util提供了方便的脚本：

- `ecryptfs-setup-private`
- `ecryptfs-mount-private`
- `ecryptfs-umount-private`

提供了几个便利：

- 提升挂载和卸载权限
- 需要是组`ecryptfs`中的成员
- 用登录密码封装FEKEK(文件加密密钥密钥)

暂不讨论，我这里出错了。
