---
layout: post
title: "Defeating ioli with radare2"
excerpt: "Just For fun"
category: exploit
tags: [reverse-engineer]
disqus: true
---


译者表示：把两篇文章揉合到了一起。


原文自：[Defeating ioli with radare2](http://dustri.org/b/defeating-ioli-with-radare2.html)
和[Crackme solution from pancake](http://radare.nopcode.org/wiki/index.php?n=Examples.Crackme)
需要：

- [radare2](http://www.radare.org/y/)
- [asm cheat sheet](http://www.jegerlehner.ch/intel/)
- [IOLI crackme suite](http://pof.eslack.org/tmp/IOLI-crackme.tar.gz)([another mirror](http://dustri.org/b/files/IOLI-crackme.tar.gz))

## crackme 0x00

第一个crackme，非常简单。

     ✘ ⮀ ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x00
    IOLI Crackme Level 0x00
    Password: 1234
    Invalid Password!

    ⮀ ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x00
     -- I script in C, because fuck you.
    [0x08048360]> aa
    [0x08048360]> pdf@sym.main
    |          ; DATA XREF from 0x08048377 (fcn.08048356)
    / (fcn) sym.main 127
    |          0x08048414    55           push ebp
    |          0x08048415    89e5         mov ebp, esp
    |          0x08048417    83ec28       sub esp, 0x28
    |          0x0804841a    83e4f0       and esp, 0xfffffff0
    |          0x0804841d    b800000000   mov eax, 0x0
    |          0x08048422    83c00f       add eax, 0xf
    |          0x08048425    83c00f       add eax, 0xf
    |          0x08048428    c1e804       shr eax, 0x4
    |          0x0804842b    c1e004       shl eax, 0x4
    |          0x0804842e    29c4         sub esp, eax
    |          0x08048430    c7042468850. mov dword [esp], str.IOLI_Crackme_Level_0x00_n ; str.IOLI_Crackme_Level_0x00_n
    |          0x08048437    e804ffffff   call sym.imp.printf ; (fcn.08048336)
    |             fcn.08048336(unk) ; sym.imp.printf
    |          0x0804843c    c7042481850. mov dword [esp], str.Password_ ; str.Password_
    |          0x08048443    e8f8feffff   call sym.imp.printf ; (fcn.08048336)
    |             fcn.08048336() ; sym.imp.printf
    |          0x08048448    8d45e8       lea eax, [ebp-0x18]
    |          0x0804844b    89442404     mov [esp+0x4], eax
    |          0x0804844f    c704248c850. mov dword [esp], 0x804858c ;  0x0804858c 
    |          0x08048456    e8d5feffff   call sym.imp.scanf ; (fcn.08048326)
    |             fcn.08048326() ; sym.imp.scanf
    |          0x0804845b    8d45e8       lea eax, [ebp-0x18]
    |          0x0804845e    c74424048f8. mov dword [esp+0x4], str.250382 ; str.250382
    |          0x08048466    890424       mov [esp], eax
    |          0x08048469    e8e2feffff   call sym.imp.strcmp ; (fcn.08048346)
    |             fcn.08048346() ; sym.imp.strcmp
    |          0x0804846e    85c0         test eax, eax
    |      ,=< 0x08048470    740e         je 0x8048480
    |      |   0x08048472    c7042496850. mov dword [esp], str.Invalid_Password__n ; str.Invalid_Password__n
    |      |   0x08048479    e8c2feffff   call sym.imp.printf ; (fcn.08048336)
    |      |      fcn.08048336() ; sym.imp.printf
    |     ,==< 0x0804847e    eb0c         jmp 0x804848c ; (sym.main)
    |     ||   ; JMP XREF from 0x08048470 (unk)
    |     |`-> 0x08048480    c70424a9850. mov dword [esp], str.Password_OK____n ; str.Password_OK____n
    |     |    0x08048487    e8b4feffff   call sym.imp.printf ; (fcn.08048336)
    |     |       fcn.08048336() ; sym.imp.printf
    |     `--> 0x0804848c    b800000000   mov eax, 0x0
    |          0x08048491    c9           leave
    \          0x08048492    c3           ret
    [0x08048360]> s 0x0804847e
    [0x0804847e]> wx eb
    [0x0804847e]> px 20
    - offset -   0 1  2 3  4 5  6 7  8 9  A B  C D  E F  0123456789ABCDEF
    0x0804847e  eb0c c704 24a9 8504 08e8 b4fe ffff b800  ....$...........
    0x0804848e  0000 00c9                                ....            
    [0x0804847e]> pD 20
    |      ,=< 0x0804847e    eb0c         jmp 0x804848c ; (sym.main)
    |      |   ; JMP XREF from 0x08048470 (unk)
    |      |   0x08048480    c70424a9850. mov dword [esp], str.Password_OK____n ; str.Password_OK____n
    |      |   0x08048487    e8b4feffff   call sym.imp.printf ; (fcn.08048336)
    |      |      fcn.08048336() ; sym.imp.printf
    |      `-> 0x0804848c    b800000000   mov eax, 0x0
    |          0x08048491    c9           leave
    [0x08048470]> q

输入任何密码。

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x00
    IOLI Crackme Level 0x00
    Password: 12345
    Password OK :)

## crackme0x01

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x01
    IOLI Crackme Level 0x01
    Password: 12345
    Invalid Password!

反汇编我们看到有个跳转到`OK`的`je`，改成`jmp`

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x01
     -- Deltify your life with radare2
    [0x08048330]> aa
    [0x08048330]> pdf@sym.main 
    |          ; DATA XREF from 0x08048347 (fcn.08048322)
    / (fcn) sym.main 113
    |          0x080483e4    55           push ebp
    |          0x080483e5    89e5         mov ebp, esp
    |          0x080483e7    83ec18       sub esp, 0x18
    |          0x080483ea    83e4f0       and esp, 0xfffffff0
    |          0x080483ed    b800000000   mov eax, 0x0
    |          0x080483f2    83c00f       add eax, 0xf
    |          0x080483f5    83c00f       add eax, 0xf
    |          0x080483f8    c1e804       shr eax, 0x4
    |          0x080483fb    c1e004       shl eax, 0x4
    |          0x080483fe    29c4         sub esp, eax
    |          0x08048400    c7042428850. mov dword [esp], str.IOLI_Crackme_Level_0x01_n ; str.IOLI_Crackme_Level_0x01_n
    |          0x08048407    e810ffffff   call sym.imp.printf ; (fcn.08048312)
    |             fcn.08048312(unk) ; sym.imp.printf
    |          0x0804840c    c7042441850. mov dword [esp], str.Password_ ; str.Password_
    |          0x08048413    e804ffffff   call sym.imp.printf ; (fcn.08048312)
    |             fcn.08048312() ; sym.imp.printf
    |          0x08048418    8d45fc       lea eax, [ebp-0x4]
    |          0x0804841b    89442404     mov [esp+0x4], eax
    |          0x0804841f    c704244c850. mov dword [esp], 0x804854c ;  0x0804854c 
    |          0x08048426    e8e1feffff   call sym.imp.scanf ; (fcn.08048302)
    |             fcn.08048302() ; sym.imp.scanf
    |          0x0804842b    817dfc9a140. cmp dword [ebp-0x4], 0x149a
    |      ,=< 0x08048432    740e         je 0x8048442
    |      |   0x08048434    c704244f850. mov dword [esp], str.Invalid_Password__n ; str.Invalid_Password__n
    |      |   0x0804843b    e8dcfeffff   call sym.imp.printf ; (fcn.08048312)
    |      |      fcn.08048312() ; sym.imp.printf
    |     ,==< 0x08048440    eb0c         jmp 0x804844e ; (sym.main)
    |     ||   ; JMP XREF from 0x08048432 (unk)
    |     |`-> 0x08048442    c7042462850. mov dword [esp], str.Password_OK____n ; str.Password_OK____n
    |     |    0x08048449    e8cefeffff   call sym.imp.printf ; (fcn.08048312)
    |     |       fcn.08048312() ; sym.imp.printf
    |     `--> 0x0804844e    b800000000   mov eax, 0x0
    |          0x08048453    c9           leave
    \          0x08048454    c3           ret
    [0x08048330]> s 0x08048432
    [0x08048432]> wx eb
    [0x08048432]> q

接着输入任何密码：

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x01
    IOLI Crackme Level 0x01
    Password: 12345
    Password OK :)

## crackme0x02

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x02
    IOLI Crackme Level 0x02
    Password: 12345
    Invalid Password!

这回还是个比较，将后面的`je`判断改成`nop`。有兴趣还可以笔算下怎么生成的密码。

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x02
     -- Invert the block bytes using the 'I' key in visual mode
    [0x08048330]> aa
    [0x08048330]> pdf@sym.main
    |          ; DATA XREF from 0x08048347 (fcn.08048322)
    / (fcn) sym.main 144
    |          0x080483e4    55           push ebp
    |          0x080483e5    89e5         mov ebp, esp
    |          0x080483e7    83ec18       sub esp, 0x18
    |          0x080483ea    83e4f0       and esp, 0xfffffff0
    |          0x080483ed    b800000000   mov eax, 0x0
    |          0x080483f2    83c00f       add eax, 0xf
    |          0x080483f5    83c00f       add eax, 0xf
    |          0x080483f8    c1e804       shr eax, 0x4
    |          0x080483fb    c1e004       shl eax, 0x4
    |          0x080483fe    29c4         sub esp, eax
    |          0x08048400    c7042448850. mov dword [esp], str.IOLI_Crackme_Level_0x02_n ; str.IOLI_Crackme_Level_0x02_n
    |          0x08048407    e810ffffff   call sym.imp.printf ; (fcn.08048312)
    |             fcn.08048312(unk) ; sym.imp.printf
    |          0x0804840c    c7042461850. mov dword [esp], str.Password_ ; str.Password_
    |          0x08048413    e804ffffff   call sym.imp.printf ; (fcn.08048312)
    |             fcn.08048312() ; sym.imp.printf
    |          0x08048418    8d45fc       lea eax, [ebp-0x4]
    |          0x0804841b    89442404     mov [esp+0x4], eax
    |          0x0804841f    c704246c850. mov dword [esp], 0x804856c ;  0x0804856c 
    |          0x08048426    e8e1feffff   call sym.imp.scanf ; (fcn.08048302)
    |             fcn.08048302() ; sym.imp.scanf
    |          0x0804842b    c745f85a000. mov dword [ebp-0x8], 0x5a ;  0x0000005a 
    |          0x08048432    c745f4ec010. mov dword [ebp-0xc], 0x1ec ;  0x000001ec 
    |          0x08048439    8b55f4       mov edx, [ebp-0xc]
    |          0x0804843c    8d45f8       lea eax, [ebp-0x8]
    |          0x0804843f    0110         add [eax], edx
    |          0x08048441    8b45f8       mov eax, [ebp-0x8]
    |          0x08048444    0faf45f8     imul eax, [ebp-0x8]
    |          0x08048448    8945f4       mov [ebp-0xc], eax
    |          0x0804844b    8b45fc       mov eax, [ebp-0x4]
    |          0x0804844e    3b45f4       cmp eax, [ebp-0xc]
    |      ,=< 0x08048451    750e         jne 0x8048461
    |      |   0x08048453    c704246f850. mov dword [esp], str.Password_OK____n ; str.Password_OK____n
    |      |   0x0804845a    e8bdfeffff   call sym.imp.printf ; (fcn.08048312)
    |      |      fcn.08048312() ; sym.imp.printf
    |     ,==< 0x0804845f    eb0c         jmp 0x804846d ; (sym.main)
    |     ||   ; JMP XREF from 0x08048451 (unk)
    |     |`-> 0x08048461    c704247f850. mov dword [esp], str.Invalid_Password__n ; str.Invalid_Password__n
    |     |    0x08048468    e8affeffff   call sym.imp.printf ; (fcn.08048312)
    |     |       fcn.08048312() ; sym.imp.printf
    |     `--> 0x0804846d    b800000000   mov eax, 0x0
    |          0x08048472    c9           leave
    \          0x08048473    c3           ret
    [0x08048330]> s 0x08048451
    [0x08048451]> wx 9090
    [0x08048451]> px 10
    - offset -   0 1  2 3  4 5  6 7  8 9  A B  C D  E F  0123456789ABCDEF
    0x08048451  9090 c704 246f 8504 08e8                 ....$o....      
    [0x08048451]> q

输入任何密码：

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x02
    IOLI Crackme Level 0x02
    Password: 12345
    Password OK :)

## crackme0x03

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x03
    IOLI Crackme Level 0x03
    Password: 12345
    Invalid Password!

这回发现难一些了，没有明文字符串。main函数调用一个`test`，`test`又调用`shift`。虽然不知道这些函数是干嘛的。但发现`sym.test`中有两个似乎加密过的字符串，可能对应`invalid`和`Ok`两个字符串。

猜测`sym.shift`是一种移位加密方法。

基本上可以猜出来`0x0804848a`是`OK`的地方

     ✘ ⮀ ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x03
     -- Use zoom.byte=entropy and press 'z' in visual mode to zoom out to see the entropy of the whole file
    [0x08048360]> aa
    [0x08048360]> pdf@sym.main
    |          ; UNKNOWN XREF from 0x0804847a (unk)
    |          ; DATA XREF from 0x08048377 (fcn.08048356)
    / (fcn) sym.main 128
    |          0x08048498    55           push ebp
    |          0x08048499    89e5         mov ebp, esp
    |          0x0804849b    83ec18       sub esp, 0x18
    |          0x0804849e    83e4f0       and esp, 0xfffffff0
    |          0x080484a1    b800000000   mov eax, 0x0
    |          0x080484a6    83c00f       add eax, 0xf
    |          0x080484a9    83c00f       add eax, 0xf
    |          0x080484ac    c1e804       shr eax, 0x4
    |          0x080484af    c1e004       shl eax, 0x4
    |          0x080484b2    29c4         sub esp, eax
    |          0x080484b4    c7042410860. mov dword [esp], str.IOLI_Crackme_Level_0x03_n ; str.IOLI_Crackme_Level_0x03_n
    |          0x080484bb    e890feffff   call sym.imp.printf
    |             sym.imp.printf(unk)
    |          0x080484c0    c7042429860. mov dword [esp], str.Password_ ; str.Password_
    |          0x080484c7    e884feffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x080484cc    8d45fc       lea eax, [ebp-0x4]
    |          0x080484cf    89442404     mov [esp+0x4], eax
    |          0x080484d3    c7042434860. mov dword [esp], 0x8048634 ;  0x08048634 
    |          0x080484da    e851feffff   call sym.imp.scanf
    |             sym.imp.scanf()
    |          0x080484df    c745f85a000. mov dword [ebp-0x8], 0x5a ;  0x0000005a 
    |          0x080484e6    c745f4ec010. mov dword [ebp-0xc], 0x1ec ;  0x000001ec 
    |          0x080484ed    8b55f4       mov edx, [ebp-0xc]
    |          0x080484f0    8d45f8       lea eax, [ebp-0x8]
    |          0x080484f3    0110         add [eax], edx
    |          0x080484f5    8b45f8       mov eax, [ebp-0x8]
    |          0x080484f8    0faf45f8     imul eax, [ebp-0x8]
    |          0x080484fc    8945f4       mov [ebp-0xc], eax
    |          0x080484ff    8b45f4       mov eax, [ebp-0xc]
    |          0x08048502    89442404     mov [esp+0x4], eax
    |          0x08048506    8b45fc       mov eax, [ebp-0x4]
    |          0x08048509    890424       mov [esp], eax
    |          0x0804850c    e85dffffff   call sym.test
    |             sym.test()
    |          0x08048511    b800000000   mov eax, 0x0
    |          0x08048516    c9           leave
    \          0x08048517    c3           ret
    [0x08048360]> pdf@sym.test
    |          ; UNKNOWN XREF from 0x0804846e (unk)
    |          ; CALL XREF from 0x0804850c (unk)
    / (fcn) sym.test 42
    |          0x0804846e    55           push ebp
    |          0x0804846f    89e5         mov ebp, esp
    |          0x08048471    83ec08       sub esp, 0x8
    |          0x08048474    8b4508       mov eax, [ebp+0x8]
    |          0x08048477    3b450c       cmp eax, [ebp+0xc]
    |      ,=< 0x0804847a    740e         je loc.0804848a
    |      |   0x0804847c    c70424ec850. mov dword [esp], str.Lqydolg_Sdvvzrug_ ; str.Lqydolg_Sdvvzrug_
    |      |   0x08048483    e88cffffff   call sym.shift
    |      |      sym.shift(unk)
    |     ,==< 0x08048488    eb0c         jmp loc.08048496
    |     ||   ; JMP XREF from 0x0804847a (unk)
    |- loc.0804848a 14
    |     |`-> 0x0804848a    c70424fe850. mov dword [esp], str.Sdvvzrug_RN______ ; str.Sdvvzrug_RN______
    |     |    0x08048491    e87effffff   call sym.shift
    |     |       sym.shift()
    |     |    ; JMP XREF from 0x08048488 (unk)
    |- loc.08048496 2
    |     `--> 0x08048496    c9           leave
    \          0x08048497    c3           ret
    [0x08048360]> s 0x0804847a
    [0x0804847a]> px 20
    - offset -   0 1  2 3  4 5  6 7  8 9  A B  C D  E F  0123456789ABCDEF
    0x0804847a  7400 0000 24ec 8504 08e8 8cff ffff eb0c  t...$...........
    0x0804848a  c704 24fe                                ..$.            
    [0x0804847a]> wx eb
    [0x0804847a]> px 20
    - offset -   0 1  2 3  4 5  6 7  8 9  A B  C D  E F  0123456789ABCDEF
    0x0804847a  eb0e c704 24ec 8504 08e8 8cff ffff eb0c  ....$...........
    0x0804848a  c704 24fe                                ..$.            
    [0x0804847a]> pdf@sym.test
    |          ; UNKNOWN XREF from 0x0804846e (unk)
    |          ; CALL XREF from 0x0804850c (unk)
    / (fcn) sym.test 42
    |          0x0804846e    55           push ebp
    |          0x0804846f    89e5         mov ebp, esp
    |          0x08048471    83ec08       sub esp, 0x8
    |          0x08048474    8b4508       mov eax, [ebp+0x8]
    |          0x08048477    3b450c       cmp eax, [ebp+0xc]
    |      ,=< 0x0804847a    eb0e         jmp loc.0804848a
    |      |   0x0804847c    c70424ec850. mov dword [esp], str.Lqydolg_Sdvvzrug_ ; str.Lqydolg_Sdvvzrug_
    |      |   0x08048483    e88cffffff   call sym.shift
    |      |      sym.shift(unk)
    |     ,==< 0x08048488    eb0c         jmp loc.08048496
    |     ||   ; JMP XREF from 0x0804847a (unk)
    |- loc.0804848a 14
    |     |`-> 0x0804848a    c70424fe850. mov dword [esp], str.Sdvvzrug_RN______ ; str.Sdvvzrug_RN______
    |     |    0x08048491    e87effffff   call sym.shift
    |     |       sym.shift()
    |     |    ; JMP XREF from 0x08048488 (unk)
    |- loc.08048496 2
    |     `--> 0x08048496    c9           leave
    \          0x08048497    c3           ret
    [0x0804847a]> q

输入任意密码

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x03                
    IOLI Crackme Level 0x03
    Password: 12345
    Password OK!!! :)

## crackme0x04

尝试12345竟然成功了……这不重要，README中给出了所有crackme的密码方便破解。

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x04
    IOLI Crackme Level 0x04
    Password: aaaaa
    Password Incorrect!

又一个叫`sym.check`的函数，里头赫然写着明文的`invalid`和`ok`。仍然是将判断跳转改成什么都不做。

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x04
     -- Interpret your own radare2 scripts with '. <path-to-your-script>'. Similar to the bash source alias command.
    [0x080483d0]> aa
    [0x080483d0]> pdf@sym.main
    |          ; UNKNOWN XREF from 0x08048509 (unk)
    |          ; DATA XREF from 0x080483e7 (fcn.080483ba)
    / (fcn) sym.main 92
    |          0x08048509    55           push ebp
    |          0x0804850a    89e5         mov ebp, esp
    |          0x0804850c    81ec88000000 sub esp, 0x88
    |          0x08048512    83e4f0       and esp, 0xfffffff0
    |          0x08048515    b800000000   mov eax, 0x0
    |          0x0804851a    83c00f       add eax, 0xf
    |          0x0804851d    83c00f       add eax, 0xf
    |          0x08048520    c1e804       shr eax, 0x4
    |          0x08048523    c1e004       shl eax, 0x4
    |          0x08048526    29c4         sub esp, eax
    |          0x08048528    c704245e860. mov dword [esp], str.IOLI_Crackme_Level_0x04_n ; str.IOLI_Crackme_Level_0x04_n
    |          0x0804852f    e860feffff   call sym.imp.printf
    |             sym.imp.printf(unk)
    |          0x08048534    c7042477860. mov dword [esp], str.Password_ ; str.Password_
    |          0x0804853b    e854feffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x08048540    8d4588       lea eax, [ebp-0x78]
    |          0x08048543    89442404     mov [esp+0x4], eax
    |          0x08048547    c7042482860. mov dword [esp], 0x8048682 ;  0x08048682 
    |          0x0804854e    e821feffff   call sym.imp.scanf
    |             sym.imp.scanf()
    |          0x08048553    8d4588       lea eax, [ebp-0x78]
    |          0x08048556    890424       mov [esp], eax
    |          0x08048559    e826ffffff   call sym.check
    |             sym.check()
    |          0x0804855e    b800000000   mov eax, 0x0
    |          0x08048563    c9           leave
    \          0x08048564    c3           ret
    [0x080483d0]> pdf@sym.check
    |          ; CALL XREF from 0x08048559 (unk)
    / (fcn) sym.check 133
    |          0x08048484    55           push ebp
    |          0x08048485    89e5         mov ebp, esp
    |          0x08048487    83ec28       sub esp, 0x28
    |          0x0804848a    c745f800000. mov dword [ebp-0x8], 0x0
    |          0x08048491    c745f400000. mov dword [ebp-0xc], 0x0
    |    .---> 0x08048498    8b4508       mov eax, [ebp+0x8]
    |    |     0x0804849b    890424       mov [esp], eax
    |    |     0x0804849e    e8e1feffff   call sym.imp.strlen ; (fcn.0804837a)
    |    |        fcn.0804837a(unk) ; sym.imp.strlen
    |    |     0x080484a3    3945f4       cmp [ebp-0xc], eax
    |    | ,=< 0x080484a6    7353         jae 0x80484fb
    |    | |   0x080484a8    8b45f4       mov eax, [ebp-0xc]
    |    | |   0x080484ab    034508       add eax, [ebp+0x8]
    |    | |   0x080484ae    0fb600       movzx eax, byte [eax]
    |    | |   0x080484b1    8845f3       mov [ebp-0xd], al
    |    | |   0x080484b4    8d45fc       lea eax, [ebp-0x4]
    |    | |   0x080484b7    89442408     mov [esp+0x8], eax
    |    | |   0x080484bb    c7442404388. mov dword [esp+0x4], 0x8048638 ;  0x08048638 
    |    | |   0x080484c3    8d45f3       lea eax, [ebp-0xd]
    |    | |   0x080484c6    890424       mov [esp], eax
    |    | |   0x080484c9    e8d6feffff   call sym.imp.sscanf ; (fcn.0804839a)
    |    | |      fcn.0804839a() ; sym.imp.sscanf
    |    | |   0x080484ce    8b55fc       mov edx, [ebp-0x4]
    |    | |   0x080484d1    8d45f8       lea eax, [ebp-0x8]
    |    | |   0x080484d4    0110         add [eax], edx
    |    | |   0x080484d6    837df80f     cmp dword [ebp-0x8], 0xf
    |    |,==< 0x080484da    7518         jne 0x80484f4
    |    |||   0x080484dc    c704243b860. mov dword [esp], str.Password_OK__n ; str.Password_OK__n
    |    |||   0x080484e3    e8acfeffff   call sym.imp.printf
    |    |||      sym.imp.printf()
    |    |||   0x080484e8    c7042400000. mov dword [esp], 0x0
    |    |||   0x080484ef    e8c0feffff   call sym.imp.exit ; (fcn.080483aa)
    |    |||      fcn.080483aa() ; sym.imp.exit
    |    |`--> 0x080484f4    8d45f4       lea eax, [ebp-0xc]
    |    | |   0x080484f7    ff00         inc dword [eax]
    |    `===< 0x080484f9    eb9d         jmp 0x8048498 ; (sym.check)
    |      |   ; JMP XREF from 0x080484a6 (unk)
    |      `-> 0x080484fb    c7042449860. mov dword [esp], str.Password_Incorrect__n ; str.Password_Incorrect__n
    |          0x08048502    e88dfeffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x08048507    c9           leave
    \          0x08048508    c3           ret
    [0x080483d0]> s 0x080484da
    [0x080484da]> wx 9090
    [0x080484da]> q

输入任何密码：

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x04
    IOLI Crackme Level 0x04
    Password: aaaaa
    Password OK!
 
## crackme0x05

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x05
    IOLI Crackme Level 0x05
    Password: 12345
    Password Incorrect!

`sym.parell`? 在三个地方都有判断，更改到让程序直接执行到`OK`字符串位置。

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x05
     -- Use -e bin.strings=false to disable search for strings when loading the binary.
    [0x080483d0]> aa
    [0x080483d0]> pdf@sym.main
    |          ; UNKNOWN XREF from 0x080484ea (unk)
    |          ; DATA XREF from 0x080483e7 (fcn.080483ba)
    / (fcn) sym.main 92
    |          0x08048540    55           push ebp
    |          0x08048541    89e5         mov ebp, esp
    |          0x08048543    81ec88000000 sub esp, 0x88
    |          0x08048549    83e4f0       and esp, 0xfffffff0
    |          0x0804854c    b800000000   mov eax, 0x0
    |          0x08048551    83c00f       add eax, 0xf
    |          0x08048554    83c00f       add eax, 0xf
    |          0x08048557    c1e804       shr eax, 0x4
    |          0x0804855a    c1e004       shl eax, 0x4
    |          0x0804855d    29c4         sub esp, eax
    |          0x0804855f    c704248e860. mov dword [esp], str.IOLI_Crackme_Level_0x05_n ; str.IOLI_Crackme_Level_0x05_n
    |          0x08048566    e829feffff   call sym.imp.printf
    |             sym.imp.printf(unk)
    |          0x0804856b    c70424a7860. mov dword [esp], str.Password_ ; str.Password_
    |          0x08048572    e81dfeffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x08048577    8d4588       lea eax, [ebp-0x78]
    |          0x0804857a    89442404     mov [esp+0x4], eax
    |          0x0804857e    c70424b2860. mov dword [esp], 0x80486b2 ;  0x080486b2 
    |          0x08048585    e8eafdffff   call sym.imp.scanf
    |             sym.imp.scanf()
    |          0x0804858a    8d4588       lea eax, [ebp-0x78]
    |          0x0804858d    890424       mov [esp], eax
    |          0x08048590    e833ffffff   call sym.check
    |             sym.check()
    |          0x08048595    b800000000   mov eax, 0x0
    |          0x0804859a    c9           leave
    \          0x0804859b    c3           ret
    [0x080483d0]> pdf@sym.check 
    |   |      ; UNKNOWN XREF from 0x080484c8 (unk)
    |   |      ; CALL XREF from 0x08048590 (unk)
    / (fcn) sym.check 120
    |   |      0x080484c8    55           push ebp
    |   |      0x080484c9    89e5         mov ebp, esp
    |   |      0x080484cb    83ec28       sub esp, 0x28
    |   |      0x080484ce    c745f800000. mov dword [ebp-0x8], 0x0
    |   |      0x080484d5    c745f400000. mov dword [ebp-0xc], 0x0
    |   |      ; JMP XREF from 0x08048530 (unk)
    |- loc.080484dc 100
    |   |.---> 0x080484dc    8b4508       mov eax, [ebp+0x8]
    |   ||     0x080484df    890424       mov [esp], eax
    |   ||     0x080484e2    e89dfeffff   call sym.imp.strlen
    |   ||        sym.imp.strlen(unk)
    |   ||     0x080484e7    3945f4       cmp [ebp-0xc], eax
    |   || ,=< 0x080484ea    7346         jae loc.08048532
    |   || |   0x080484ec    8b45f4       mov eax, [ebp-0xc]
    |   || |   0x080484ef    034508       add eax, [ebp+0x8]
    |   || |   0x080484f2    0fb600       movzx eax, byte [eax]
    |   || |   0x080484f5    8845f3       mov [ebp-0xd], al
    |   || |   0x080484f8    8d45fc       lea eax, [ebp-0x4]
    |   || |   0x080484fb    89442408     mov [esp+0x8], eax
    |   || |   0x080484ff    c7442404688. mov dword [esp+0x4], 0x8048668 ;  0x08048668 
    |   || |   0x08048507    8d45f3       lea eax, [ebp-0xd]
    |   || |   0x0804850a    890424       mov [esp], eax
    |   || |   0x0804850d    e892feffff   call sym.imp.sscanf
    |   || |      sym.imp.sscanf()
    |   || |   0x08048512    8b55fc       mov edx, [ebp-0x4]
    |   || |   0x08048515    8d45f8       lea eax, [ebp-0x8]
    |   || |   0x08048518    0110         add [eax], edx
    |   || |   0x0804851a    837df810     cmp dword [ebp-0x8], 0x10
    |   ||,==< 0x0804851e    750b         jne loc.0804852b
    |   ||||   0x08048520    8b4508       mov eax, [ebp+0x8]
    |   ||||   0x08048523    890424       mov [esp], eax
    |   ||||   0x08048526    e859ffffff   call sym.parell
    |   ||||      sym.parell()
    |   |||    ; JMP XREF from 0x0804851e (unk)
    |- loc.0804852b 21
    |   ||`--> 0x0804852b    8d45f4       lea eax, [ebp-0xc]
    |   || |   0x0804852e    ff00         inc dword [eax]
    |   |`===< 0x08048530    ebaa         jmp loc.080484dc
    |   |  |   ; JMP XREF from 0x080484ea (unk)
    |- loc.08048532 14
    |   |  `-> 0x08048532    c7042479860. mov dword [esp], str.Password_Incorrect__n ; str.Password_Incorrect__n
    |          0x08048539    e856feffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x0804853e    c9           leave
    \          0x0804853f    c3           ret
    [0x080483d0]> pdf@sym.parell 
    |          ; CALL XREF from 0x08048526 (unk)
    / (fcn) sym.parell 68
    |          0x08048484    55           push ebp
    |          0x08048485    89e5         mov ebp, esp
    |          0x08048487    83ec18       sub esp, 0x18
    |          0x0804848a    8d45fc       lea eax, [ebp-0x4]
    |          0x0804848d    89442408     mov [esp+0x8], eax
    |          0x08048491    c7442404688. mov dword [esp+0x4], 0x8048668 ;  0x08048668 
    |          0x08048499    8b4508       mov eax, [ebp+0x8]
    |          0x0804849c    890424       mov [esp], eax
    |          0x0804849f    e800ffffff   call sym.imp.sscanf
    |             sym.imp.sscanf(unk)
    |          0x080484a4    8b45fc       mov eax, [ebp-0x4]
    |          0x080484a7    83e001       and eax, 0x1
    |          0x080484aa    85c0         test eax, eax
    |      ,=< 0x080484ac    7518         jne 0x80484c6
    |      |   0x080484ae    c704246b860. mov dword [esp], str.Password_OK__n ; str.Password_OK__n
    |      |   0x080484b5    e8dafeffff   call sym.imp.printf
    |      |      sym.imp.printf()
    |      |   0x080484ba    c7042400000. mov dword [esp], 0x0
    |      |   0x080484c1    e8eefeffff   call sym.imp.exit ; (fcn.080483aa)
    |      |      fcn.080483aa() ; sym.imp.exit
    |      |   ; JMP XREF from 0x080484ac (unk)
    |      `-> 0x080484c6    c9           leave
    \          0x080484c7    c3           ret
    [0x080483d0]> s 0x080484ea
    [0x080484ea]> wx 9090
    [0x080484ea]> s 0x0804851e
    [0x0804851e]> wx 9090
    [0x0804851e]> s 0x080484ac
    [0x080484ac]> wx 9090
    [0x080484ac]> q

输入任意密码

     ✘ ⮀ ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x05      
    IOLI Crackme Level 0x05
    Password: 12345
    Password OK!

## crackme0x06

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x06
    IOLI Crackme Level 0x06
    Password: 12345
    Password Incorrect!

破解么，又不需要知道程序逻辑，只要让程序运行到想要的代码块就好。于是……把所有跳转灭掉。

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x06
     -- Dissasemble? No dissasemble, no dissassemble!!!!!
    [0x08048400]> aa
    [0x08048400]> pdf@sym.main
    |          ; UNKNOWN XREF from 0x080485aa (unk)
    |          ; DATA XREF from 0x08048417 (fcn.080483ee)
    / (fcn) sym.main 99
    |          0x08048607    55           push ebp
    |          0x08048608    89e5         mov ebp, esp
    |          0x0804860a    81ec88000000 sub esp, 0x88
    |          0x08048610    83e4f0       and esp, 0xfffffff0
    |          0x08048613    b800000000   mov eax, 0x0
    |          0x08048618    83c00f       add eax, 0xf
    |          0x0804861b    83c00f       add eax, 0xf
    |          0x0804861e    c1e804       shr eax, 0x4
    |          0x08048621    c1e004       shl eax, 0x4
    |          0x08048624    29c4         sub esp, eax
    |          0x08048626    c7042463870. mov dword [esp], str.IOLI_Crackme_Level_0x06_n ; str.IOLI_Crackme_Level_0x06_n
    |          0x0804862d    e886fdffff   call sym.imp.printf
    |             sym.imp.printf(unk)
    |          0x08048632    c704247c870. mov dword [esp], str.Password_ ; str.Password_
    |          0x08048639    e87afdffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x0804863e    8d4588       lea eax, [ebp-0x78]
    |          0x08048641    89442404     mov [esp+0x4], eax
    |          0x08048645    c7042487870. mov dword [esp], 0x8048787 ;  0x08048787 
    |          0x0804864c    e847fdffff   call sym.imp.scanf
    |             sym.imp.scanf()
    |          0x08048651    8b4510       mov eax, [ebp+0x10]
    |          0x08048654    89442404     mov [esp+0x4], eax
    |          0x08048658    8d4588       lea eax, [ebp-0x78]
    |          0x0804865b    890424       mov [esp], eax
    |          0x0804865e    e825ffffff   call sym.check
    |             sym.check()
    |          0x08048663    b800000000   mov eax, 0x0
    |          0x08048668    c9           leave
    \          0x08048669    c3           ret
    [0x08048400]> pdf@sym.check 
    |          ; UNKNOWN XREF from 0x0804854e (unk)
    |          ; CALL XREF from 0x0804865e (unk)
    / (fcn) sym.check 127
    |          0x08048588    55           push ebp
    |          0x08048589    89e5         mov ebp, esp
    |          0x0804858b    83ec28       sub esp, 0x28
    |          0x0804858e    c745f800000. mov dword [ebp-0x8], 0x0
    |          0x08048595    c745f400000. mov dword [ebp-0xc], 0x0
    |          ; JMP XREF from 0x080485f7 (unk)
    |- loc.0804859c 107
    |    .---> 0x0804859c    8b4508       mov eax, [ebp+0x8]
    |    |     0x0804859f    890424       mov [esp], eax
    |    |     0x080485a2    e801feffff   call sym.imp.strlen
    |    |        sym.imp.strlen(unk)
    |    |     0x080485a7    3945f4       cmp [ebp-0xc], eax
    |    | ,=< 0x080485aa    734d         jae loc.080485f9
    |    | |   0x080485ac    8b45f4       mov eax, [ebp-0xc]
    |    | |   0x080485af    034508       add eax, [ebp+0x8]
    |    | |   0x080485b2    0fb600       movzx eax, byte [eax]
    |    | |   0x080485b5    8845f3       mov [ebp-0xd], al
    |    | |   0x080485b8    8d45fc       lea eax, [ebp-0x4]
    |    | |   0x080485bb    89442408     mov [esp+0x8], eax
    |    | |   0x080485bf    c74424043d8. mov dword [esp+0x4], 0x804873d ;  0x0804873d 
    |    | |   0x080485c7    8d45f3       lea eax, [ebp-0xd]
    |    | |   0x080485ca    890424       mov [esp], eax
    |    | |   0x080485cd    e8f6fdffff   call sym.imp.sscanf
    |    | |      sym.imp.sscanf()
    |    | |   0x080485d2    8b55fc       mov edx, [ebp-0x4]
    |    | |   0x080485d5    8d45f8       lea eax, [ebp-0x8]
    |    | |   0x080485d8    0110         add [eax], edx
    |    | |   0x080485da    837df810     cmp dword [ebp-0x8], 0x10
    |    |,==< 0x080485de    7512         jne loc.080485f2
    |    |||   0x080485e0    8b450c       mov eax, [ebp+0xc]
    |    |||   0x080485e3    89442404     mov [esp+0x4], eax
    |    |||   0x080485e7    8b4508       mov eax, [ebp+0x8]
    |    |||   0x080485ea    890424       mov [esp], eax
    |    |||   0x080485ed    e828ffffff   call sym.parell
    |    |||      sym.parell()
    |    ||    ; JMP XREF from 0x080485de (unk)
    |- loc.080485f2 21
    |    |`--> 0x080485f2    8d45f4       lea eax, [ebp-0xc]
    |    | |   0x080485f5    ff00         inc dword [eax]
    |    `===< 0x080485f7    eba3         jmp loc.0804859c
    |      |   ; JMP XREF from 0x080485aa (unk)
    |- loc.080485f9 14
    |      `-> 0x080485f9    c704244e870. mov dword [esp], str.Password_Incorrect__n ; str.Password_Incorrect__n
    |          0x08048600    e8b3fdffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x08048605    c9           leave
    \          0x08048606    c3           ret
    [0x08048400]> pdf@sym.parell 
    |          ; UNKNOWN XREF from 0x0804851a (unk)
    |          ; CALL XREF from 0x080485ed (unk)
    / (fcn) sym.parell 110
    |          0x0804851a    55           push ebp
    |          0x0804851b    89e5         mov ebp, esp
    |          0x0804851d    83ec18       sub esp, 0x18
    |          0x08048520    8d45fc       lea eax, [ebp-0x4]
    |          0x08048523    89442408     mov [esp+0x8], eax
    |          0x08048527    c74424043d8. mov dword [esp+0x4], 0x804873d ;  0x0804873d 
    |          0x0804852f    8b4508       mov eax, [ebp+0x8]
    |          0x08048532    890424       mov [esp], eax
    |          0x08048535    e88efeffff   call sym.imp.sscanf
    |             sym.imp.sscanf(unk)
    |          0x0804853a    8b450c       mov eax, [ebp+0xc]
    |          0x0804853d    89442404     mov [esp+0x4], eax
    |          0x08048541    8b45fc       mov eax, [ebp-0x4]
    |          0x08048544    890424       mov [esp], eax
    |          0x08048547    e868ffffff   call sym.dummy
    |             sym.dummy()
    |          0x0804854c    85c0         test eax, eax
    |      ,=< 0x0804854e    7436         je loc.08048586
    |      |   0x08048550    c745f800000. mov dword [ebp-0x8], 0x0
    |      |   ; JMP XREF from 0x08048584 (unk)
    |- loc.08048557 49
    |      |   0x08048557    837df809     cmp dword [ebp-0x8], 0x9
    |     ,==< 0x0804855b    7f29         jg loc.08048586
    |     ||   0x0804855d    8b45fc       mov eax, [ebp-0x4]
    |     ||   0x08048560    83e001       and eax, 0x1
    |     ||   0x08048563    85c0         test eax, eax
    |    ,===< 0x08048565    7518         jne loc.0804857f
    |    |||   0x08048567    c7042440870. mov dword [esp], str.Password_OK__n ; str.Password_OK__n
    |    |||   0x0804856e    e845feffff   call sym.imp.printf
    |    |||      sym.imp.printf()
    |    |||   0x08048573    c7042400000. mov dword [esp], 0x0
    |    |||   0x0804857a    e869feffff   call sym.imp.exit
    |    |||      sym.imp.exit()
    |    |     ; JMP XREF from 0x08048565 (unk)
    |- loc.0804857f 9
    |    `---> 0x0804857f    8d45f8       lea eax, [ebp-0x8]
    |     ||   0x08048582    ff00         inc dword [eax]
    |     ||   0x08048584    ebd1         jmp loc.08048557
    |     ||   ; JMP XREF from 0x0804854e (unk)
    |     ||   ; JMP XREF from 0x0804855b (unk)
    |- loc.08048586 2
    |     ``-> 0x08048586    c9           leave
    \          0x08048587    c3           ret
    [0x08048400]> s 0x080485aa
    [0x080485aa]> wx 9090
    [0x080485aa]> s 0x080485de
    [0x080485de]> wx 9090
    [0x080485de]> s 0x0804854e
    [0x0804854e]> wx 9090
    [0x0804854e]> s 0x0804855b
    [0x0804855b]> wx 9090
    [0x0804855b]> s 0x08048565
    [0x08048565]> wx 9090
    [0x08048565]> q

输入任意密码：

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x06
    IOLI Crackme Level 0x06
    Password: 123456
    Password OK!

## crackme0x07

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x07
    IOLI Crackme Level 0x07
    Password: 12345
    Password Incorrect!

这次函数名都变了。大致搜索下就找到`Ok`代码段，把所有跳转清除。

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x07
     -- Wow, my cat knows radare2 hotkeys better than me!
    [0x08048400]> aa
    [0x08048400]> pdf@main
    |          ; UNKNOWN XREF from 0x08048643 (fcn.080485b9)
    |          ; DATA XREF from 0x08048417 (entry0)
    / (fcn) main 99
    |          0x0804867d    55           push ebp
    |          0x0804867e    89e5         mov ebp, esp
    |          0x08048680    81ec88000000 sub esp, 0x88
    |          0x08048686    83e4f0       and esp, 0xfffffff0
    |          0x08048689    b800000000   mov eax, 0x0
    |          0x0804868e    83c00f       add eax, 0xf
    |          0x08048691    83c00f       add eax, 0xf
    |          0x08048694    c1e804       shr eax, 0x4
    |          0x08048697    c1e004       shl eax, 0x4
    |          0x0804869a    29c4         sub esp, eax
    |          0x0804869c    c70424d9870. mov dword [esp], str.IOLI_Crackme_Level_0x07_n ; str.IOLI_Crackme_Level_0x07_n
    |          0x080486a3    e810fdffff   call sym.imp.printf
    |             sym.imp.printf(unk)
    |          0x080486a8    c70424f2870. mov dword [esp], str.Password_ ; str.Password_
    |          0x080486af    e804fdffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x080486b4    8d4588       lea eax, [ebp-0x78]
    |          0x080486b7    89442404     mov [esp+0x4], eax
    |          0x080486bb    c70424fd870. mov dword [esp], 0x80487fd ;  0x080487fd 
    |          0x080486c2    e8d1fcffff   call sym.imp.scanf
    |             sym.imp.scanf()
    |          0x080486c7    8b4510       mov eax, [ebp+0x10]
    |          0x080486ca    89442404     mov [esp+0x4], eax
    |          0x080486ce    8d4588       lea eax, [ebp-0x78]
    |          0x080486d1    890424       mov [esp], eax
    |          0x080486d4    e8e0feffff   call fcn.080485b9
    |             fcn.080485b9()
    |          0x080486d9    b800000000   mov eax, 0x0
    |          0x080486de    c9           leave
    \          0x080486df    c3           ret
    [0x08048400]> pdf@fcn.080485b9
                ; UNKNOWN XREF from 0x08048576 (fcn.08048524)
                ; CALL XREF from 0x080486d4 (unk)
    / (fcn) fcn.080485b9 196
    |           0x080485b9    55           push ebp
    |           0x080485ba    89e5         mov ebp, esp
    |           0x080485bc    83ec28       sub esp, 0x28
    |           0x080485bf    c745f800000. mov dword [ebp-0x8], 0x0
    |           0x080485c6    c745f400000. mov dword [ebp-0xc], 0x0
    |           ; JMP XREF from 0x08048628 (fcn.080485b9)
    |- fcn.080485cd 176
    |     .---> 0x080485cd    8b4508       mov eax, [ebp+0x8]
    |     |     0x080485d0    890424       mov [esp], eax
    |     |     0x080485d3    e8d0fdffff   call sym.imp.strlen
    |     |        sym.imp.strlen(unk)
    |     |     0x080485d8    3945f4       cmp [ebp-0xc], eax
    |     | ,=< 0x080485db    734d         jae loc.0804862a
    |     | |   0x080485dd    8b45f4       mov eax, [ebp-0xc]
    |     | |   0x080485e0    034508       add eax, [ebp+0x8]
    |     | |   0x080485e3    0fb600       movzx eax, byte [eax]
    |     | |   0x080485e6    8845f3       mov [ebp-0xd], al
    |     | |   0x080485e9    8d45fc       lea eax, [ebp-0x4]
    |     | |   0x080485ec    89442408     mov [esp+0x8], eax
    |     | |   0x080485f0    c7442404c28. mov dword [esp+0x4], 0x80487c2 ;  0x080487c2 
    |     | |   0x080485f8    8d45f3       lea eax, [ebp-0xd]
    |     | |   0x080485fb    890424       mov [esp], eax
    |     | |   0x080485fe    e8c5fdffff   call sym.imp.sscanf
    |     | |      sym.imp.sscanf()
    |     | |   0x08048603    8b55fc       mov edx, [ebp-0x4]
    |     | |   0x08048606    8d45f8       lea eax, [ebp-0x8]
    |     | |   0x08048609    0110         add [eax], edx
    |     | |   0x0804860b    837df810     cmp dword [ebp-0x8], 0x10
    |     |,==< 0x0804860f    7512         jne loc.08048623
    |     |||   0x08048611    8b450c       mov eax, [ebp+0xc]
    |     |||   0x08048614    89442404     mov [esp+0x4], eax
    |     |||   0x08048618    8b4508       mov eax, [ebp+0x8]
    |     |||   0x0804861b    890424       mov [esp], eax
    |     |||   0x0804861e    e81fffffff   call fcn.08048542
    |     |||      fcn.08048542()
    |     ||    ; JMP XREF from 0x0804860f (fcn.080485b9)
    |- loc.08048623 90
    |     |`--> 0x08048623    8d45f4       lea eax, [ebp-0xc]
    |     | |   0x08048626    ff00         inc dword [eax]
    |     `===< 0x08048628    eba3         jmp fcn.080485cd
    |       |   ; JMP XREF from 0x080485db (fcn.080485b9)
    |- loc.0804862a 83
    |       `-> 0x0804862a    e8f5feffff   call fcn.08048524
    |       | >    fcn.08048524()
    |           0x0804862f    8b450c       mov eax, [ebp+0xc]
    |           0x08048632    89442404     mov [esp+0x4], eax
    |           0x08048636    8b45fc       mov eax, [ebp-0x4]
    |           0x08048639    890424       mov [esp], eax
    |           0x0804863c    e873feffff   call fcn.080484b4
    |              fcn.080484b4() ; entry0+180
    |           0x08048641    85c0         test eax, eax
    |    ,====< 0x08048643    7436         je loc.0804867b
    |    |      0x08048645    c745f400000. mov dword [ebp-0xc], 0x0
    |    |      ; JMP XREF from 0x08048679 (fcn.080485b9)
    |- loc.0804864c 49
    |    |      0x0804864c    837df409     cmp dword [ebp-0xc], 0x9
    |   ,=====< 0x08048650    7f29         jg loc.0804867b
    |   ||      0x08048652    8b45fc       mov eax, [ebp-0x4]
    |   ||      0x08048655    83e001       and eax, 0x1
    |   ||      0x08048658    85c0         test eax, eax
    |  ,======< 0x0804865a    7518         jne loc.08048674
    |  |||      0x0804865c    c70424d3870. mov dword [esp], str.wtf__n ; str.wtf__n
    |  |||      0x08048663    e850fdffff   call sym.imp.printf
    |  |||         sym.imp.printf()
    |  |||      0x08048668    c7042400000. mov dword [esp], 0x0
    |  |||      0x0804866f    e874fdffff   call sym.imp.exit
    |  |||         sym.imp.exit()
    |  |        ; JMP XREF from 0x0804865a (fcn.080485b9)
    |- loc.08048674 9
    |  `------> 0x08048674    8d45f4       lea eax, [ebp-0xc]
    |   ||      0x08048677    ff00         inc dword [eax]
    |   ||      0x08048679    ebd1         jmp loc.0804864c
    |   ||      ; JMP XREF from 0x08048643 (fcn.080485b9)
    |   ||      ; JMP XREF from 0x08048650 (fcn.080485b9)
    |- loc.0804867b 2
    |   ``----> 0x0804867b    c9           leave
    \           0x0804867c    c3           ret
    [0x08048400]> pdf@fcn.08048542
               ; CALL XREF from 0x0804861e (fcn.080485b9)
    / (fcn) fcn.08048542 119
    |          0x08048542    55           push ebp
    |          0x08048543    89e5         mov ebp, esp
    |          0x08048545    83ec18       sub esp, 0x18
    |          0x08048548    8d45fc       lea eax, [ebp-0x4]
    |          0x0804854b    89442408     mov [esp+0x8], eax
    |          0x0804854f    c7442404c28. mov dword [esp+0x4], 0x80487c2 ;  0x080487c2 
    |          0x08048557    8b4508       mov eax, [ebp+0x8]
    |          0x0804855a    890424       mov [esp], eax
    |          0x0804855d    e866feffff   call sym.imp.sscanf
    |             sym.imp.sscanf(unk)
    |          0x08048562    8b450c       mov eax, [ebp+0xc]
    |          0x08048565    89442404     mov [esp+0x4], eax
    |          0x08048569    8b45fc       mov eax, [ebp-0x4]
    |          0x0804856c    890424       mov [esp], eax
    |          0x0804856f    e840ffffff   call fcn.080484b4
    |             fcn.080484b4() ; entry0+180
    |          0x08048574    85c0         test eax, eax
    |      ,=< 0x08048576    743f         je loc.080485b7
    |      |   0x08048578    c745f800000. mov dword [ebp-0x8], 0x0
    |      |   ; JMP XREF from 0x080485b5 (fcn.08048524)
    |- loc.0804857f 58
    |      |   0x0804857f    837df809     cmp dword [ebp-0x8], 0x9
    |     ,==< 0x08048583    7f32         jg loc.080485b7
    |     ||   0x08048585    8b45fc       mov eax, [ebp-0x4]
    |     ||   0x08048588    83e001       and eax, 0x1
    |     ||   0x0804858b    85c0         test eax, eax
    |    ,===< 0x0804858d    7521         jne loc.080485b0
    |    |||   0x0804858f    833d2ca0040. cmp dword [0x804a02c], 0x1
    |   ,====< 0x08048596    750c         jne loc.080485a4
    |   ||||   0x08048598    c70424c5870. mov dword [esp], str.Password_OK__n ; str.Password_OK__n
    |   ||||   0x0804859f    e814feffff   call sym.imp.printf
    |   ||||      sym.imp.printf()
    |   |      ; JMP XREF from 0x08048596 (fcn.08048524)
    |- loc.080485a4 21
    |   `----> 0x080485a4    c7042400000. mov dword [esp], 0x0
    |    |||   0x080485ab    e838feffff   call sym.imp.exit
    |    |||      sym.imp.exit()
    |    |     ; JMP XREF from 0x0804858d (fcn.08048524)
    |- loc.080485b0 9
    |    `---> 0x080485b0    8d45f8       lea eax, [ebp-0x8]
    |     ||   0x080485b3    ff00         inc dword [eax]
    |     ||   0x080485b5    ebc8         jmp loc.0804857f
    |     ||   ; JMP XREF from 0x08048576 (fcn.08048524)
    |     ||   ; JMP XREF from 0x08048583 (fcn.08048524)
    |- loc.080485b7 2
    |     ``-> 0x080485b7    c9           leave
    \          0x080485b8    c3           ret
    [0x08048400]> s 0x080485db
    [0x080485db]> wx 9090
    [0x080485db]> s 0x0804860f
    [0x0804860f]> wx 9090
    [0x0804860f]> s 0x08048576
    [0x08048576]> wx 9090
    [0x08048576]> s 0x08048583
    [0x08048583]> wx 9090
    [0x08048583]> s 0x0804858d
    [0x0804858d]> wx 9090
    [0x0804858d]> s 0x08048596
    [0x08048596]> wx 9090
    [0x08048596]> q

输入任意密码

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x07
    IOLI Crackme Level 0x07
    Password: 12345
    Password OK!

## crackme0x08

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x08
    IOLI Crackme Level 0x08
    Password: 12345
    Password Incorrect!

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x08
     -- THE ONLY WINNING MOVE IS NOT TO PLAY.
    [0x08048400]> aa
    [0x08048400]> pdf@main 
    |          ; UNKNOWN XREF from 0x08048643 (unk)
    |          ; DATA XREF from 0x08048417 (fcn.080483ee)
    / (fcn) sym.main 99
    |          0x0804867d    55           push ebp
    |          0x0804867e    89e5         mov ebp, esp
    |          0x08048680    81ec88000000 sub esp, 0x88
    |          0x08048686    83e4f0       and esp, 0xfffffff0
    |          0x08048689    b800000000   mov eax, 0x0
    |          0x0804868e    83c00f       add eax, 0xf
    |          0x08048691    83c00f       add eax, 0xf
    |          0x08048694    c1e804       shr eax, 0x4
    |          0x08048697    c1e004       shl eax, 0x4
    |          0x0804869a    29c4         sub esp, eax
    |          0x0804869c    c70424d9870. mov dword [esp], str.IOLI_Crackme_Level_0x08_n ; str.IOLI_Crackme_Level_0x08_n
    |          0x080486a3    e810fdffff   call sym.imp.printf
    |             sym.imp.printf(unk)
    |          0x080486a8    c70424f2870. mov dword [esp], str.Password_ ; str.Password_
    |          0x080486af    e804fdffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x080486b4    8d4588       lea eax, [ebp-0x78]
    |          0x080486b7    89442404     mov [esp+0x4], eax
    |          0x080486bb    c70424fd870. mov dword [esp], 0x80487fd ;  0x080487fd 
    |          0x080486c2    e8d1fcffff   call sym.imp.scanf
    |             sym.imp.scanf()
    |          0x080486c7    8b4510       mov eax, [ebp+0x10]
    |          0x080486ca    89442404     mov [esp+0x4], eax
    |          0x080486ce    8d4588       lea eax, [ebp-0x78]
    |          0x080486d1    890424       mov [esp], eax
    |          0x080486d4    e8e0feffff   call sym.check
    |             sym.check()
    |          0x080486d9    b800000000   mov eax, 0x0
    |          0x080486de    c9           leave
    \          0x080486df    c3           ret
    [0x08048400]> pdf@sym.check
    |           ; UNKNOWN XREF from 0x08048576 (unk)
    |           ; CALL XREF from 0x080486d4 (unk)
    / (fcn) sym.check 196
    |           0x080485b9    55           push ebp
    |           0x080485ba    89e5         mov ebp, esp
    |           0x080485bc    83ec28       sub esp, 0x28
    |           0x080485bf    c745f800000. mov dword [ebp-0x8], 0x0
    |           0x080485c6    c745f400000. mov dword [ebp-0xc], 0x0
    |           ; JMP XREF from 0x08048628 (unk)
    |- fcn.080485cd 176
    |     .---> 0x080485cd    8b4508       mov eax, [ebp+0x8]
    |     |     0x080485d0    890424       mov [esp], eax
    |     |     0x080485d3    e8d0fdffff   call sym.imp.strlen
    |     |        sym.imp.strlen(unk)
    |     |     0x080485d8    3945f4       cmp [ebp-0xc], eax
    |     | ,=< 0x080485db    734d         jae loc.0804862a
    |     | |   0x080485dd    8b45f4       mov eax, [ebp-0xc]
    |     | |   0x080485e0    034508       add eax, [ebp+0x8]
    |     | |   0x080485e3    0fb600       movzx eax, byte [eax]
    |     | |   0x080485e6    8845f3       mov [ebp-0xd], al
    |     | |   0x080485e9    8d45fc       lea eax, [ebp-0x4]
    |     | |   0x080485ec    89442408     mov [esp+0x8], eax
    |     | |   0x080485f0    c7442404c28. mov dword [esp+0x4], 0x80487c2 ;  0x080487c2 
    |     | |   0x080485f8    8d45f3       lea eax, [ebp-0xd]
    |     | |   0x080485fb    890424       mov [esp], eax
    |     | |   0x080485fe    e8c5fdffff   call sym.imp.sscanf
    |     | |      sym.imp.sscanf()
    |     | |   0x08048603    8b55fc       mov edx, [ebp-0x4]
    |     | |   0x08048606    8d45f8       lea eax, [ebp-0x8]
    |     | |   0x08048609    0110         add [eax], edx
    |     | |   0x0804860b    837df810     cmp dword [ebp-0x8], 0x10
    |     |,==< 0x0804860f    7512         jne loc.08048623
    |     |||   0x08048611    8b450c       mov eax, [ebp+0xc]
    |     |||   0x08048614    89442404     mov [esp+0x4], eax
    |     |||   0x08048618    8b4508       mov eax, [ebp+0x8]
    |     |||   0x0804861b    890424       mov [esp], eax
    |     |||   0x0804861e    e81fffffff   call sym.parell
    |     |||      sym.parell()
    |     ||    ; JMP XREF from 0x0804860f (unk)
    |- loc.08048623 90
    |     |`--> 0x08048623    8d45f4       lea eax, [ebp-0xc]
    |     | |   0x08048626    ff00         inc dword [eax]
    |     `===< 0x08048628    eba3         jmp fcn.080485cd
    |       |   ; JMP XREF from 0x080485db (unk)
    |- loc.0804862a 83
    |       `-> 0x0804862a    e8f5feffff   call sym.che
    |       | >    sym.che()
    |           0x0804862f    8b450c       mov eax, [ebp+0xc]
    |           0x08048632    89442404     mov [esp+0x4], eax
    |           0x08048636    8b45fc       mov eax, [ebp-0x4]
    |           0x08048639    890424       mov [esp], eax
    |           0x0804863c    e873feffff   call sym.dummy
    |              sym.dummy()
    |           0x08048641    85c0         test eax, eax
    |    ,====< 0x08048643    7436         je loc.0804867b
    |    |      0x08048645    c745f400000. mov dword [ebp-0xc], 0x0
    |    |      ; JMP XREF from 0x08048679 (unk)
    |- loc.0804864c 49
    |    |      0x0804864c    837df409     cmp dword [ebp-0xc], 0x9
    |   ,=====< 0x08048650    7f29         jg loc.0804867b
    |   ||      0x08048652    8b45fc       mov eax, [ebp-0x4]
    |   ||      0x08048655    83e001       and eax, 0x1
    |   ||      0x08048658    85c0         test eax, eax
    |  ,======< 0x0804865a    7518         jne loc.08048674
    |  |||      0x0804865c    c70424d3870. mov dword [esp], str.wtf__n ; str.wtf__n
    |  |||      0x08048663    e850fdffff   call sym.imp.printf
    |  |||         sym.imp.printf()
    |  |||      0x08048668    c7042400000. mov dword [esp], 0x0
    |  |||      0x0804866f    e874fdffff   call sym.imp.exit
    |  |||         sym.imp.exit()
    |  |        ; JMP XREF from 0x0804865a (unk)
    |- loc.08048674 9
    |  `------> 0x08048674    8d45f4       lea eax, [ebp-0xc]
    |   ||      0x08048677    ff00         inc dword [eax]
    |   ||      0x08048679    ebd1         jmp loc.0804864c
    |   ||      ; JMP XREF from 0x08048643 (unk)
    |   ||      ; JMP XREF from 0x08048650 (unk)
    |- loc.0804867b 2
    |   ``----> 0x0804867b    c9           leave
    \           0x0804867c    c3           ret
    [0x08048400]> pdf@sym.che
    |          ; UNKNOWN XREF from 0x08048524 (unk)
    |          ; CALL XREF from 0x0804862a (unk)
    / (fcn) sym.che 149
    |          0x08048524    55           push ebp
    |          0x08048525    89e5         mov ebp, esp
    |          0x08048527    83ec08       sub esp, 0x8
    |          0x0804852a    c70424ad870. mov dword [esp], str.Password_Incorrect__n ; str.Password_Incorrect__n
    |          0x08048531    e882feffff   call sym.imp.printf
    |             sym.imp.printf(unk)
    |          0x08048536    c7042400000. mov dword [esp], 0x0
    |          0x0804853d    e8a6feffff   call sym.imp.exit
    |             sym.imp.exit()
    |          ; CALL XREF from 0x0804861e (unk)
    / (fcn) sym.parell 119
    |          0x08048542    55           push ebp
    |          0x08048543    89e5         mov ebp, esp
    |          0x08048545    83ec18       sub esp, 0x18
    |          0x08048548    8d45fc       lea eax, [ebp-0x4]
    |          0x0804854b    89442408     mov [esp+0x8], eax
    |          0x0804854f    c7442404c28. mov dword [esp+0x4], 0x80487c2 ;  0x080487c2 
    |          0x08048557    8b4508       mov eax, [ebp+0x8]
    |          0x0804855a    890424       mov [esp], eax
    |          0x0804855d    e866feffff   call sym.imp.sscanf
    |             sym.imp.sscanf(unk)
    |          0x08048562    8b450c       mov eax, [ebp+0xc]
    |          0x08048565    89442404     mov [esp+0x4], eax
    |          0x08048569    8b45fc       mov eax, [ebp-0x4]
    |          0x0804856c    890424       mov [esp], eax
    |          0x0804856f    e840ffffff   call sym.dummy
    |             sym.dummy()
    |          0x08048574    85c0         test eax, eax
    |      ,=< 0x08048576    743f         je loc.080485b7
    |      |   0x08048578    c745f800000. mov dword [ebp-0x8], 0x0
    |      |   ; JMP XREF from 0x080485b5 (unk)
    |- loc.0804857f 58
    |      |   0x0804857f    837df809     cmp dword [ebp-0x8], 0x9
    |     ,==< 0x08048583    7f32         jg loc.080485b7
    |     ||   0x08048585    8b45fc       mov eax, [ebp-0x4]
    |     ||   0x08048588    83e001       and eax, 0x1
    |     ||   0x0804858b    85c0         test eax, eax
    |    ,===< 0x0804858d    7521         jne loc.080485b0
    |    |||   0x0804858f    833d2ca0040. cmp dword [sym.LOL], 0x1
    |   ,====< 0x08048596    750c         jne loc.080485a4
    |   ||||   0x08048598    c70424c5870. mov dword [esp], str.Password_OK__n ; str.Password_OK__n
    |   ||||   0x0804859f    e814feffff   call sym.imp.printf
    |   ||||      sym.imp.printf()
    |   |      ; JMP XREF from 0x08048596 (unk)
    |- loc.080485a4 21
    |   `----> 0x080485a4    c7042400000. mov dword [esp], 0x0
    |    |||   0x080485ab    e838feffff   call sym.imp.exit
    |    |||      sym.imp.exit()
    |    |     ; JMP XREF from 0x0804858d (unk)
    |- loc.080485b0 9
    |    `---> 0x080485b0    8d45f8       lea eax, [ebp-0x8]
    |     ||   0x080485b3    ff00         inc dword [eax]
    |     ||   0x080485b5    ebc8         jmp loc.0804857f
    |     ||   ; JMP XREF from 0x08048576 (unk)
    |     ||   ; JMP XREF from 0x08048583 (unk)
    |- loc.080485b7 2
    |     ``-> 0x080485b7    c9           leave
    \          0x080485b8    c3           ret
    [0x08048400]> s 0x080485db
    [0x080485db]> wx 9090
    [0x080485db]> s 0x0804860f
    [0x0804860f]> wx 9090
    [0x0804860f]> s 0x08048576
    [0x08048576]> wx 9090
    [0x08048576]> s 0x08048583
    [0x08048583]> wx 9090
    [0x08048583]> s 0x0804858d
    [0x0804858d]> wx 9090
    [0x0804858d]> s 0x08048596
    [0x08048596]> wx 9090
    [0x08048596]> q

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x08
    IOLI Crackme Level 0x08
    Password: 12345
    Password OK!

## crackme0x09

     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x09
    IOLI Crackme Level 0x09
    Password: 12345
    Password Incorrect!

稍微计算下。看出来`ebp`作为某个时刻的栈顶指针用来索引字符串。一番搜索在某个`printf`中发现了`OK`

    ✘ ⮀ ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ r2 -w ./crackme0x09
     -- Use scr.accel to browse the file faster!
    [0x08048420]> aa
    [0x08048420]> pdf@main
    |          ; UNKNOWN XREF from 0x080486ae (fcn.08048616)
    |          ; DATA XREF from 0x08048437 (entry0)
    / (fcn) main 120
    |          0x080486ee    55           push ebp
    |          0x080486ef    89e5         mov ebp, esp
    |          0x080486f1    53           push ebx
    |          0x080486f2    81ec84000000 sub esp, 0x84
    |          0x080486f8    e869000000   call fcn.08048766
    |             fcn.08048766(unk, unk)
    |          0x080486fd    81c3f7180000 add ebx, 0x18f7
    |          0x08048703    83e4f0       and esp, 0xfffffff0
    |          0x08048706    b800000000   mov eax, 0x0
    |          0x0804870b    83c00f       add eax, 0xf
    |          0x0804870e    83c00f       add eax, 0xf
    |          0x08048711    c1e804       shr eax, 0x4
    |          0x08048714    c1e004       shl eax, 0x4
    |          0x08048717    29c4         sub esp, eax
    |          0x08048719    8d8375e8ffff lea eax, [ebx-0x178b]
    |          0x0804871f    890424       mov [esp], eax
    |          0x08048722    e8b9fcffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x08048727    8d838ee8ffff lea eax, [ebx-0x1772]
    |          0x0804872d    890424       mov [esp], eax
    |          0x08048730    e8abfcffff   call sym.imp.printf
    |             sym.imp.printf()
    |          0x08048735    8d4588       lea eax, [ebp-0x78]
    |          0x08048738    89442404     mov [esp+0x4], eax
    |          0x0804873c    8d8399e8ffff lea eax, [ebx-0x1767]
    |          0x08048742    890424       mov [esp], eax
    |          0x08048745    e876fcffff   call sym.imp.scanf
    |             sym.imp.scanf()
    |          0x0804874a    8b4510       mov eax, [ebp+0x10]
    |          0x0804874d    89442404     mov [esp+0x4], eax
    |          0x08048751    8d4588       lea eax, [ebp-0x78]
    |          0x08048754    890424       mov [esp], eax
    |          0x08048757    e8bafeffff   call fcn.08048616
    |             fcn.08048616()
    |          0x0804875c    b800000000   mov eax, 0x0
    |          0x08048761    8b5dfc       mov ebx, [ebp-0x4]
    |          0x08048764    c9           leave
    \          0x08048765    c3           ret
    [0x08048420]> pdf@fcn.08048616
                ; UNKNOWN XREF from 0x080485cb (fcn.0804855d)
                ; CALL XREF from 0x08048757 (unk)
    / (fcn) fcn.08048616 216
    |           0x08048616    55           push ebp
    |           0x08048617    89e5         mov ebp, esp
    |           0x08048619    53           push ebx
    |           0x0804861a    83ec24       sub esp, 0x24
    |           0x0804861d    e844010000   call fcn.08048766
    |              fcn.08048766(unk, unk)
    |           0x08048622    81c3d2190000 add ebx, 0x19d2
    |           0x08048628    c745f400000. mov dword [ebp-0xc], 0x0
    |           0x0804862f    c745f000000. mov dword [ebp-0x10], 0x0
    |           ; JMP XREF from 0x08048693 (fcn.08048616)
    |- fcn.08048636 184
    |     .---> 0x08048636    8b4508       mov eax, [ebp+0x8]
    |     |     0x08048639    890424       mov [esp], eax
    |     |     0x0804863c    e88ffdffff   call sym.imp.strlen
    |     |        sym.imp.strlen()
    |     |     0x08048641    3945f0       cmp [ebp-0x10], eax
    |     | ,=< 0x08048644    734f         jae loc.08048695
    |     | |   0x08048646    8b45f0       mov eax, [ebp-0x10]
    |     | |   0x08048649    034508       add eax, [ebp+0x8]
    |     | |   0x0804864c    0fb600       movzx eax, byte [eax]
    |     | |   0x0804864f    8845ef       mov [ebp-0x11], al
    |     | |   0x08048652    8d45f8       lea eax, [ebp-0x8]
    |     | |   0x08048655    89442408     mov [esp+0x8], eax
    |     | |   0x08048659    8d835ee8ffff lea eax, [ebx-0x17a2]
    |     | |   0x0804865f    89442404     mov [esp+0x4], eax
    |     | |   0x08048663    8d45ef       lea eax, [ebp-0x11]
    |     | |   0x08048666    890424       mov [esp], eax
    |     | |   0x08048669    e882fdffff   call sym.imp.sscanf
    |     | |      sym.imp.sscanf()
    |     | |   0x0804866e    8b55f8       mov edx, [ebp-0x8]
    |     | |   0x08048671    8d45f4       lea eax, [ebp-0xc]
    |     | |   0x08048674    0110         add [eax], edx
    |     | |   0x08048676    837df410     cmp dword [ebp-0xc], 0x10
    |     |,==< 0x0804867a    7512         jne loc.0804868e
    |     |||   0x0804867c    8b450c       mov eax, [ebp+0xc]
    |     |||   0x0804867f    89442404     mov [esp+0x4], eax
    |     |||   0x08048683    8b4508       mov eax, [ebp+0x8]
    |     |||   0x08048686    890424       mov [esp], eax
    |     |||   0x08048689    e8fbfeffff   call fcn.08048589
    |     |||      fcn.08048589()
    |     ||    ; JMP XREF from 0x0804867a (fcn.08048616)
    |- loc.0804868e 96
    |     |`--> 0x0804868e    8d45f0       lea eax, [ebp-0x10]
    |     | |   0x08048691    ff00         inc dword [eax]
    |     `===< 0x08048693    eba1         jmp fcn.08048636
    |       |   ; JMP XREF from 0x08048644 (fcn.08048616)
    |- loc.08048695 89
    |       `-> 0x08048695    e8c3feffff   call fcn.0804855d
    |       | >    fcn.0804855d()
    |           0x0804869a    8b450c       mov eax, [ebp+0xc]
    |           0x0804869d    89442404     mov [esp+0x4], eax
    |           0x080486a1    8b45f8       mov eax, [ebp-0x8]
    |           0x080486a4    890424       mov [esp], eax
    |           0x080486a7    e828feffff   call fcn.080484d4
    |              fcn.080484d4() ; entry0+180
    |           0x080486ac    85c0         test eax, eax
    |    ,====< 0x080486ae    7438         je loc.080486e8
    |    |      0x080486b0    c745f000000. mov dword [ebp-0x10], 0x0
    |    |      ; JMP XREF from 0x080486e6 (fcn.08048616)
    |- loc.080486b7 55
    |    |      0x080486b7    837df009     cmp dword [ebp-0x10], 0x9
    |   ,=====< 0x080486bb    7f2b         jg loc.080486e8
    |   ||      0x080486bd    8b45f8       mov eax, [ebp-0x8]
    |   ||      0x080486c0    83e001       and eax, 0x1
    |   ||      0x080486c3    85c0         test eax, eax
    |  ,======< 0x080486c5    751a         jne loc.080486e1
    |  |||      0x080486c7    8d836fe8ffff lea eax, [ebx-0x1791]
    |  |||      0x080486cd    890424       mov [esp], eax
    |  |||      0x080486d0    e80bfdffff   call sym.imp.printf
    |  |||         sym.imp.printf()
    |  |||      0x080486d5    c7042400000. mov dword [esp], 0x0
    |  |||      0x080486dc    e82ffdffff   call sym.imp.exit
    |  |||         sym.imp.exit()
    |  |        ; JMP XREF from 0x080486c5 (fcn.08048616)
    |- loc.080486e1 13
    |  `------> 0x080486e1    8d45f0       lea eax, [ebp-0x10]
    |   ||      0x080486e4    ff00         inc dword [eax]
    |   ||      0x080486e6    ebcf         jmp loc.080486b7
    |   ||      ; JMP XREF from 0x080486ae (fcn.08048616)
    |   ||      ; JMP XREF from 0x080486bb (fcn.08048616)
    |- loc.080486e8 6
    |   ``----> 0x080486e8    83c424       add esp, 0x24
    |           0x080486eb    5b           pop ebx
    |           0x080486ec    5d           pop ebp
    \           0x080486ed    c3           ret
    [0x08048420]> pdf@fcn.08048589
               ; CALL XREF from 0x08048689 (fcn.08048616)
    / (fcn) fcn.08048589 141
    |          0x08048589    55           push ebp
    |          0x0804858a    89e5         mov ebp, esp
    |          0x0804858c    53           push ebx
    |          0x0804858d    83ec14       sub esp, 0x14
    |          0x08048590    e8d1010000   call fcn.08048766
    |             fcn.08048766(unk, unk)
    |          0x08048595    81c35f1a0000 add ebx, 0x1a5f
    |          0x0804859b    8d45f8       lea eax, [ebp-0x8]
    |          0x0804859e    89442408     mov [esp+0x8], eax
    |          0x080485a2    8d835ee8ffff lea eax, [ebx-0x17a2]
    |          0x080485a8    89442404     mov [esp+0x4], eax
    |          0x080485ac    8b4508       mov eax, [ebp+0x8]
    |          0x080485af    890424       mov [esp], eax
    |          0x080485b2    e839feffff   call sym.imp.sscanf
    |             sym.imp.sscanf()
    |          0x080485b7    8b450c       mov eax, [ebp+0xc]
    |          0x080485ba    89442404     mov [esp+0x4], eax
    |          0x080485be    8b45f8       mov eax, [ebp-0x8]
    |          0x080485c1    890424       mov [esp], eax
    |          0x080485c4    e80bffffff   call fcn.080484d4
    |             fcn.080484d4() ; entry0+180
    |          0x080485c9    85c0         test eax, eax
    |      ,=< 0x080485cb    7443         je loc.08048610
    |      |   0x080485cd    c745f400000. mov dword [ebp-0xc], 0x0
    |      |   ; JMP XREF from 0x0804860e (fcn.0804855d)
    |- loc.080485d4 66
    |      |   0x080485d4    837df409     cmp dword [ebp-0xc], 0x9
    |     ,==< 0x080485d8    7f36         jg loc.08048610
    |     ||   0x080485da    8b45f8       mov eax, [ebp-0x8]
    |     ||   0x080485dd    83e001       and eax, 0x1
    |     ||   0x080485e0    85c0         test eax, eax
    |    ,===< 0x080485e2    7525         jne loc.08048609
    |    |||   0x080485e4    8b83fcffffff mov eax, [ebx-0x4]
    |    |||   0x080485ea    833801       cmp dword [eax], 0x1
    |   ,====< 0x080485ed    750e         jne loc.080485fd
    |   ||||   0x080485ef    8d8361e8ffff lea eax, [ebx-0x179f]
    |   ||||   0x080485f5    890424       mov [esp], eax
    |   ||||   0x080485f8    e8e3fdffff   call sym.imp.printf
    |   ||||      sym.imp.printf()
    |   |      ; JMP XREF from 0x080485ed (fcn.0804855d)
    |- loc.080485fd 25
    |   `----> 0x080485fd    c7042400000. mov dword [esp], 0x0
    |    |||   0x08048604    e807feffff   call sym.imp.exit
    |    |||      sym.imp.exit()
    |    |     ; JMP XREF from 0x080485e2 (fcn.0804855d)
    |- loc.08048609 13
    |    `---> 0x08048609    8d45f4       lea eax, [ebp-0xc]
    |     ||   0x0804860c    ff00         inc dword [eax]
    |     ||   0x0804860e    ebc4         jmp loc.080485d4
    |     ||   ; JMP XREF from 0x080485cb (fcn.0804855d)
    |     ||   ; JMP XREF from 0x080485d8 (fcn.0804855d)
    |- loc.08048610 6
    |     ``-> 0x08048610    83c414       add esp, 0x14
    |          0x08048613    5b           pop ebx
    |          0x08048614    5d           pop ebp
    \          0x08048615    c3           ret
    [0x08048420]> s 
    0x8048420
    [0x08048420]> s 0x08048644
    [0x08048644]> wx 9090
    [0x08048644]> s 0x0804867a
    [0x0804867a]> wx 9090
    [0x0804867a]> s 0x080485cb
    [0x080485cb]> wx 9090
    [0x080485cb]> s 0x080485d8
    [0x080485d8]> wx 9090
    [0x080485d8]> s 0x080485e2
    [0x080485e2]> wx 9090
    [0x080485e2]> s 0x080485ed
    [0x080485ed]> wx 9090
    [0x0804852d]> s 0x080485c4
    [0x080485c4]> wx 9090909090
    [0x080485c4]> q
    
     ~/Work/project/reverse/IOLI-crackme/bin-linux ⮀ ./crackme0x09
    IOLI Crackme Level 0x09
    Password: 12345
    Password OK!

这不叫逆向……这叫把目标代码之外的东西都注释掉……

到此，忽然觉得吧，少了点东西。

- r2的动态调试功能
- 说好的reverse-engineer

I find an interesting book: RE-for-beginers
