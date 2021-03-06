---
layout: post
title: "在Gentoo下开发Launchpad MSP430程序"
excerpt: "单片机初体验"
category: microcontroller
tags: [microcontroller]
disqus: true
---


同学给我了片申请到的MSP-EXP430G2单片机玩。

从来没有玩过单片机，虽然本科专业还开设了一门叫做单片机的课程，课上完了我也没见到单片机是什么样的，当然，我也没去过几次。研究生阶段选修了一门嵌入式系统设计的课程，只记的老师拿着ppt讲的吐沫星子飞起，似乎ppt上有图，最后却还是没注意单片机是什么样的。

几天前第一次在工地上见到了单片机，一个同学在树莓派的基础上不停假设外设，当时他去采购了一大批物资其中就有一小块单片机。当时一个师兄拿着给我说：这个是单片机。我第一次知道，噢～原来这就是单片机。

没想到几天后一个做硬件的同学给了我块开发板。

同学说：我这里有CCS，但是实验室的正版软件，没法装到其它机器上。你可能没法玩。

我：没事，上学期上嵌入式的课老师给拷过CCS……

同学：！！！！那给你玩吧……

于是在回来在Ti的wiki上被科普了一把，想要使用msp430单片机可以用TI提供的两种IDE，iar和ccs。

ccs提供免费版本，限制16k程序，使用需要遵循美国政府blabla进出口管理条例法律，特别麻烦，不过注册申请后两小时就批准了。
  
win下的同学还可以去使用iar，同样免费版本限制十六kb程序，我特马第一个程序还不到200字节。我之所以下载ccs，因为ccs有linux版本

但是……我装不上……原因就不说了,各种依赖问题，我本来也不倾向使用IDE。

还有一套开源的东西可以用来开发，gcc/gdb/一堆binutils和c库+mspdebug，自由无限制，不需要注册，没有程序大小限制，开放可信赖，还是熟悉的工具集。

## 在gentoo上设置开发环境

> Generating a cross-compiler by hand is a long and painful process. This is why it has been fully integrated into Gentoo!

gentoo下的交叉编译似乎特别容易= =，因为crossdev的存在。

不要问我怎么设置：看这里 [cross-compiler](http://www.gentoo.org/proj/en/base/embedded/handbook/cross-compiler.xml?style=printable)

我之前似乎在linux下写win32程序时把东西都搞好了……不记得当时做了什么，大概就是

    emerge crossdev

紧接着就可以生成msp430平台的系列工具了，我们要指定target、需要gdb等等……

sudo crossdev -S --ov-output /usr/portage/ --ex-gdb -t msp430

经过不那么漫长的等待，你会发现msp430一整套toolchain都已经搭好了。

让我们写个程序吧，LED闪灯小程序 main.c

```c
#include <msp430g2553.h>

int main(int argc, const char *argv[])
{
     volatile int i;

     /* Stop watchdog timer */
     WDTCTL = WDTPW | WDTHOLD;

     /* Setup bit 0 of P1 and bit 6 of P1 as output */
     P1DIR = 0x41;

     /* Setup bit 0 of P1 to 0 and bit 6 of P1 to 1*/
     P1OUT = 0x40;

     /* Loop forever */
     while (1){
         /* Toggle bit 0,6 of P1 */
         P1OUT ^= 0x41;
         /* Just delay */
         for (i = 0; i < 0x9000; i++){}
     }
}
```

其实我都是抱着试试看的心理一边改别人的程序一边试的，单片机上确实写的是

    MSP430G2553

然后编译，编译时要指定芯片，不要问我为什么，msp430-gcc就是这个德性

    msp430-gcc -mmcu=msp430g2553 -g main.c -o main.elf

最后写进单片机吧。其实板子预先内置的就是这个程序。你可以把它改成只闪一个灯的。

我们要先安装mspdebug。

> MSPDebug is a free debugger for use with MSP430 MCUs

    sudo emerge --autounmask-write mspdebug
    sudo dispatch-conf
    sudo emerge mspdebug

然后指定驱动，至于这个驱动是调试接口的驱动，详情参考[这里](http://www.ti.com.cn/cn/lit/ug/zhcu025e/zhcu025e.pdf)

    sudo mspdebug rf2500

接触读写硬件的权限是必要的。

      ~/Work/msp430 $ sudo mspdebug rf2500                              
    MSPDebug version 0.22 - debugging tool for MSP430 MCUs
    Copyright (C) 2009-2013 Daniel Beer <dlbeer@gmail.com>
    This is free software; see the source for copying conditions.  There is NO
    warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
      
    Trying to open interface 1 on 007
    rf2500: warning: can't detach kernel driver: No such file or directory
    Initializing FET...
    FET protocol version is 30394216
    Set Vcc: 3000 mV
    Configured for Spy-Bi-Wire
    fet: FET returned error code 4 (Could not find device or device not supported)
    fet: command C_IDENT1 failed
    Using Olimex identification procedure
    Device ID: 0x2553
       Code start address: 0xc000
       Code size         : 16384 byte = 16 kb
       RAM  start address: 0x200
       RAM  end   address: 0x3ff
       RAM  size         : 512 byte = 0 kb
    Device: MSP430G2xx3
    Number of breakpoints: 2
    fet: FET returned NAK
    warning: device does not support power profiling
    Chip ID data: 25 53
      
    Available commands:
         =           erase       isearch     power       save_raw    simio        
         alias       exit        load        prog        set         step        
         break       fill        load_raw    read        setbreak    sym          
         cgraph      gdb         md          regs        setwatch    verify      
         delbreak    help        mw          reset       setwatch_r  verify_raw  
         dis         hexout      opt         run         setwatch_w  
      
    Available options:
         color                       gdb_loop                    
         enable_bsl_access           gdbc_xfer_size              
         enable_locked_flash_access  iradix                      
         fet_block_size              quiet                        
         gdb_default_port            
      
    Type "help <topic>" for more information.
    Use the "opt" command ("help opt") to set options.
    Press Ctrl+D to quit.
      
    (mspdebug)  

接着输入

    prog main.elf

就把程序烧进……不知道什么东西去了。当年嵌入式的课白听了，就记的几个名词……

    (mspdebug) prog main.elf
    Erasing...
    Programming...
    Writing  148 bytes at c000 [section: .text]...
    Writing   32 bytes at ffe0 [section: .vectors]...
    Done, 180 bytes total

接着run就可以看灯轮流闪了

    (mspdebug) run
    Running. Press Ctrl+C to interrupt...

如果要调试，直接输入gdb就可以，

    (mspdebug) gdb
    Bound to port 2000. Now waiting for connection...

在另一个终端：

      ~/Work/msp430 ? msp430-gdb -q
    (gdb) target remote localhost:2000
    Remote debugging using localhost:2000
    0x0000c076 in ?? ()
    (gdb) file main.elf
    A program is being debugged already.
    Are you sure you want to change the file? (y or n) y
    Reading symbols from /home/lyy/Work/msp430/main.elf...done.
    (gdb) n

接着还能用makefile简化这些过程，但，我不会makefile……

## last but not least

这套工具链可以在其它linux如debian上很容易的搭建起来，就几个apt-get的事，虽然还没在debian下试过，但debian质量，值得信赖。

在windows下也可以使用这一整套工具，相比ccs来说具有……好处开头说了，支持也不错。

参考文献，不一一标注引用，还有好多忘了:

- [http://coldnew.github.io/blog/2013/11/18\_686\_g.html](http://coldnew.github.io/blog/2013/11/18_686_g.html)
- [http://processors.wiki.ti.com/index.php/Download_CCS](http://processors.wiki.ti.com/index.php/Download_CCS)
- [http://www.ti.com.cn/cn/lit/ug/zhcu010c/zhcu010c.pdf](http://www.ti.com.cn/cn/lit/ug/zhcu010c/zhcu010c.pdf)
- [http://home.eeworld.com.cn/my/space-uid-139222-blogid-72202.html](http://home.eeworld.com.cn/my/space-uid-139222-blogid-72202.html)
- [http://blog.sina.com.cn/s/blog_a47d75c60101axsp.html](http://blog.sina.com.cn/s/blog_a47d75c60101axsp.html)
- [http://develissimo.com/forum/topic/115418/](http://develissimo.com/forum/topic/115418/)
- [http://processors.wiki.ti.com/index.php/Blink_your_first_LED](http://processors.wiki.ti.com/index.php/Blink_your_first_LED)
- [http://43oh.com/2010/08/10-beginner-msp430-tutorials-and-counting/](http://43oh.com/2010/08/10-beginner-msp430-tutorials-and-counting/)

哈，第一次玩硬件……向赞助我片子的同学汇报时同学说你怎么进展这么快！！！！

只来得及玩了一天就陷入加班写文档的狂潮之中去了……摔！！！

最后附上个呼吸灯程序：

```c
//Original code is here, //http://osx-launchpad.blogspot.com/2010/11/breathing-led-effect-with-launchpad.html
//This is slight modification to work with Ti CCS devtool


#include  <msp430.h>

int idx = 0;   // Index to PWM's duty cycle table (= brightness)

const unsigned char curve[] = {
    1,     1,     1,     1,     1,     1,     1,     1,
    1,     1,     1,     1,     1,     1,     1,     1,
    1,     1,     1,     2,     2,     2,     2,     2,
    2,     2,     3,     3,     3,     3,     3,     3,
    4,     4,     4,     4,     4,     5,     5,     5,
    5,     6,     6,     6,     6,     7,     7,     7,
    8,     8,     8,     8,     9,     9,     9,    10,
   10,    10,    11,    11,    11,    12,    12,    13,
   13,    13,    14,    14,    15,    15,    15,    16,
   16,    17,    17,    18,    18,    18,    19,    19,
   20,    20,    21,    21,    22,    22,    23,    23,
   24,    24,    25,    25,    26,    26,    27,    27,
   28,    29,    29,    30,    30,    31,    31,    32,
   33,    33,    34,    34,    35,    36,    36,    37,
   38,    38,    39,    39,    40,    41,    41,    42,
   43,    43,    44,    45,    46,    46,    47,    48,
   48,    49,    50,    50,    51,    52,    53,    53,
   54,    55,    56,    56,    57,    58,    59,    59,
   60,    61,    62,    62,    63,    64,    65,    66,
   66,    67,    68,    69,    70,    70,    71,    72,
   73,    74,    75,    75,    76,    77,    78,    79,
   80,    80,    81,    82,    83,    84,    85,    86,
   87,    87,    88,    89,    90,    91,    92,    93,
   94,    95,    95,    96,    97,    98,    99,   100,
  101,   102,   103,   104,   105,   106,   106,   107,
  108,   109,   110,   111,   112,   113,   114,   115,
  116,   117,   118,   119,   120,   121,   122,   122,
  123,   124,   125,   126,   127,   128,   129,   130,
  131,   132,   133,   134,   135,   136,   137,   138,
  139,   140,   141,   142,   143,   144,   145,   146,
  147,   148,   149,   150,   151,   152,   153,   154,
  155,   156
};

int main(void)
{
  // Stop watchdog
  WDTCTL = WDTPW + WDTHOLD;

  // Set clock to 1 MHz
  DCOCTL= 0;
  BCSCTL1= CALBC1_1MHZ;
  DCOCTL= CALDCO_1MHZ;

  // SMCLK = 1 MHz / 8 = 125 KHz (SLAU144E p.5-15)
  BCSCTL2 |= DIVS_3;

  // Make P1.6 (green led) an output. SLAU144E p.8-3
  P1DIR |= BIT6;

  // P1.6 = TA0.1 (timer A's output). SLAS694C p.41
  P1SEL |= BIT6;

  // PWM period = 125 KHz / 625 = 200 Hz
  TACCR0 = 625;

  // Source Timer A from SMCLK (TASSEL_2), up mode (MC_1).
  // Up mode counts up to TACCR0. SLAU144E p.12-20
  TACTL = TASSEL_2 | MC_1;

  // OUTMOD_7 = Reset/set output when the timer counts to TACCR1/TACCR0
  // CCIE = Interrupt when timer counts to TACCR1
  TACCTL1 = OUTMOD_7 | CCIE;

  // Initial CCR1 (= brightness)
  TACCR1 = 0;

  // LPM0 (shut down the CPU) with interrupts enabled
  __bis_SR_register(CPUOFF | GIE);

}

// This will be called when timer counts to TACCR1.
#pragma vector=TIMER0_A1_VECTOR
__interrupt void Timer_A(void)
{
  int new_ccr1 = 1;

  // Clear interrupt flag
  TACCTL1 &= ~CCIFG;

  if (idx < 500) {
    new_ccr1 = curve[idx++ >> 1];
  } else if (idx < 1000) {
    new_ccr1 = curve[(999 - idx++) >> 1];
  } else {
    idx = 0;
  }
  // Wait to set the new TACCR1 until TAR has gone past it, so that we
  // don't get interrupted again in this period.
  while (TAR <= new_ccr1);
  TACCR1 = new_ccr1;
}
```
