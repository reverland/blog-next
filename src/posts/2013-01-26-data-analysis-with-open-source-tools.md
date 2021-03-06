---
layout: post
title: "Data Analysis with Open Source Tools"
excerpt: "书评,不仅仅是书评"
category: reviews
tags: [books]
disqus: true
---


# 基于开源工具的数据分析

![书的图片]()

这是书评，不仅仅是书评。事实上，这本书我还没看完。考研之前大概两个月时偶然在图书馆外文图书阴暗的角落发现了这本书，然后考研复习平常上课都被我扔了，连续一周徜徉在数学和计算机的世界里。再往后？大概到十四还是十五章被迫准备研究生入学考试去，直到现在还没拾起来。

后来在一楼看到有中文图书，感觉翻译的不错，起码比我自己理解的好。就换了本中文的带回家来看。

废话很多？不是么？好吧这篇书评和书的内容没什么大的关联，满篇只因为我又想 _胡扯_ 了。

Amazon上对这本书的评价：Very Insight。Too insight 以致于我真想跑跑题。

## 系统与文化

从书上的一个故事说起。作者建议数据分析工作人员和科学家用Unix系统工作，为此专门举了个例子：

> True story: I needed to send a file containing several millions of keys to a coworker.(The company did not work on Unix.) Since the file was too large to fit safely into an email message, I posted it to a web server on my desktop and sent my coworker the link. (I dutifully had provided the file with the extension .txt, so that he would be able to open it.) Five minutes later, he calls me back: "I can’t open that"—“What do you mean?"—“Well, I click the link, but ScrapPaper [the default text editor for small text files on this particular system] dies because the file is too big.” This coworker was not inept (in fact, he was quite good at his primary job), but he displayed the particular  non-problem-solving attitude that develops in predefined work environments: "Link, click." It did not even occur to him to think of something else to try. That’s a problem!

就在昨天，看到[行者无疆](http://cnlox.is-programmer.com/posts/37276.html)上对百度的公司的风格很是一顿猛批：其为员工预装的系统还是十年前的windows XP，天天用着盗版SecureCRT和Office软件工作。问题是：*This matters？*

我觉得重要！关键在习惯和文化上！

看看作者如何谈论：

> Unix was developed for precisely this kind of ad hoc programming with files
> and data, and it continues to provide the most liberating environment for such work.
> Unix (and its variants, including Linux and Mac OS X) has some obvious technical
> advantages, but its most important property in the present context is that it encourages
> you to devise solutions. It does not try (or pretend) to do the job for you, but it goes out of
> its way to give you tools that you might find handy—without prescribing how or for
> what you use them. In contrast, other operating systems tend to encourage you to stay
> within the boundaries of certain familiar activity patterns—which does not encourage
> the development of your problem-solving abilities (or, more importantly, your
> problem-solving attitudes).

关键就在这里，Unix系统 *encourages you to devise solutions*， 它不尝试为你做完所有事，但是它竭尽所能为你提供各种各样的工具和选择，而不是规定使用的方式和用途。而其它操作系统往往鼓励你留在习惯的活动模式范围内——毫不鼓励你提高解决问题的能力，更重要的是，*解决问题的态度!*

这也就是为什么，Linux、Mac OS和BSD这些Unix系统被称作黑客[^1]的操作系统，而Windows一直饱受诟病，在geek的群体中备受歧视。

从开始接触Linux到现在不到一年半，按理说作为一个noob没什么评头论足的资格，但这一年半却是改变我人生轨迹的一年半，我想分享出来自己的想法和折腾。也为了印证为何我也这么说这么想。

## 从自己说起

一年半时间，世界和自我完全变了。

折腾的苦与乐，爱与恨，交织纷繁。

也许当初真的太闲了才会一脚踏进这个无底洞，不过，who cares。就说说这个系统和文化如何影响、塑造了我。

故事从SAS开始，一款统计软件。当时数学建模用着盗版的SAS，老师说，这个正版太贵，我们买不起。

问题是有多贵？我开始上百度[^2]找答案，听说的答案是：一年几十万。

The price shocked me，从来没想过一个软件会这么贵。缘分就在这里，看到有人在推荐R(A powerful statistics environment)作为替代。这是我第一次听说开源，也是我折腾的开始，踏入新天地的开端。

没体会过的人永远不会理解我为什么说新天地，也不会理解这有什么好感慨的。

我从来没想过将来去从事什么计算机相关的工作，从来。从来觉得数学这东西一无是处，都是空谈。从来觉得世界分工很多事情自己都不该去接触去学习。从来以为世界就是自己身边这么大。从来觉得一生这么混混就过去了。

但一年半后我再也不这样想了。依然迷茫，然而有信心。

这一年半我觉得做了许多让自己骄傲的事，最起码没有虚度。虽然在别人眼里我碌碌无为，甚至一无是处。我依然相信、我的所有努力和折腾不会白费。就像Jobs当在Stanford演讲所说[^3]。

一分耕耘、一分收获。

### 为什么会折腾？和系统有关系吗？

有！文化。有些环境不鼓励探索和设计解决问题，而是鼓励你混日子。

关于开源社区的文化，我想说几条：

#### 热情

大多数人都只因热爱。开源社区是充满热情与爱的社区，开源本身就是个奇迹。你会想到有人无偿将自己的劳动成果贡献出来让所有人都能自由获取和使用吗？然而不光有人做，还有一群人做。他们把技术、心得分享出来，让每个想学习的人都平等的接触他们。他们花费宝贵时间写出组织良好充满热情的文档、教程，录制视频，他们花费宝贵的时间本地化各种应用，在IRC和论坛等地热情帮助他人。他们也做出各种各样的艺术品。

#### 分享

开源社区的分享氛围真是太好了。我为什么倾向于使用Python，因为它本身就是依靠开源发展壮大起来，深受开源文化陶冶的语言。来自各个领域、各个地区的爱好者们开发了各种各样的库分享出来让每个人都能自由获取，以致于很多事情用Python太简单了。数以万计的开源软件使用者在互联网上分享、反馈、改进他们喜欢的东西。这种文化也构成了互联网的分享基础。

#### 好奇心

正如本书作者在前言中所说：

*All You need is just CURIOSITY！* 

开源社区给了每个人自由平等接触学习的机会，你所需要的仅仅是好奇心。从接触linux开始，我在上面折腾过各种数学软件R、octave、scilab、ipython(其实这不是……)、各种风格和特色语言[^4]、自己学习图像处理的基础知识和使用图像处理软件(如果时间很多就去学blender)[^5]、自己学习字体排版的理论折腾LaTeX、自己试着零基础折腾各种动静态网站、在虚拟机上装好各种linux/windows系统然后连着玩……虽然没学到什么或者学过也忘了或者不深入，但学到的是解决问题的态度和能力，这才是我觉得最重要的。时光飞逝，一切都会过时变化，重要的是面对问题的态度和解决问题的能力。

开源的文化改变了我的思想、行动，开阔了我的眼界，我觉得这对每个人都是有益的。剩下的，就是你愿不愿意付出“代价”来改变自己了。

开放的社区欢迎任何人投入其中、分享、学习、进步，接触和尝试各个领域，你也许对计算机知之甚少，对数学一窍不通，但行业的鸿沟真的这么明显吗？*难而不会、会而不难*，你会找到很多开放的社区有热情的人分享的资料文章、看到清晰热情的文档、在论坛IRC等获得热心的帮助。

不妨试试，你会爱上这种文化。

最后顺便说下，开源社区创造了很多很棒的东西，越是重要的东西越默默无闻，然而不可或缺。

## Footnotes

[^1]:这里黑客采用古典的黑客定义，指那些热衷于探索和解决各种问题的人。
[^2]:现在我怎么可能去用百度，google对太多人是别无选择的，就算墙掉、封掉，也得想办法去上。
[^3]:Follow U heart.
[^4]:其实很少，我认真学的第一门语言是common lisp。
[^5]:有兴趣的同学可以去看看Tears of Steel，这是blender、gimp、Inkscape等开源多媒体软件制作的。
[^6]:包括各种国产浏览器什么猎豹360极速的貌似都是chromium
