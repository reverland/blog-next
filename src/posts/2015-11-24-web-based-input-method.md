---
layout: post
title: "百度云输入法Userscript——实践和思考"
excerpt: "写了一个基于web技术的百度云输入法GreaseMonkey脚本"
category: javascript
tags: [javascript]
disqus: true
---

two days’ dirty hack，很多天之前写的一个利用[百度云输入法的Userscript](https://greasyfork.org/zh-CN/scripts/13193-baiducloudinput)，没有你们想得这么高大上两天自己开发了个输入法ORZ。。。

2015.10.18 23:32, 首发[简书](http://www.jianshu.com/p/5e56524c91fc)。

我想总结下在写这个过程中学到了些什么。

![最终版本](http://img.vim-cn.com/5d/a20cb0ec4c83d7f3e6d8cbd6e2e8bf36930958.gif)

## 综述

设计很简单，简单分为网络请求-用户界面-控制逻辑三部分。

## 网络请求

原理非常简单。简单分析下百度云输入法，关键在这么一个请求

    http://olime.baidu.com/py?input=shuru&inputtype=py&bg=0&ed=20&result=hanzi&resultcoding=unicode&ch_en=0&clientinfo=web&version=1

其中参数也很清晰，其中参数`input`后面是输入的拼音，`inputtype`是输入法类型(`py`代表拼音)。`bg`代表begin，`ed`代表end，后面是啥管它呢。。。

这个请求会返回一个json，该json包含`shuru`这个拼音对应的结果，通过bg和ed能指定返回的范围。

```json
{"status":"T","errno":"0","errmsg":"","result":[[["\u8f93\u5165",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u9f20\u5973",5,{"pinyin":"shu'ru","type":"NEWWORD"}],["\u672f\u5112",5,{"pinyin":"shu'ru","type":"NEWWORD"}],["\u6dd1\u5982",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u7ad6\u5112",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u9f20\u4e73",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u6691\u6ebd",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u83fd\u4e73",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u67a2\u5112",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u6f8d\u6fe1",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u758f\u8339",5,{"pinyin":"shu'ru","type":"IMEDICT"}],["\u4e66",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u6570",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u5c5e",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u6811",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u672f",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u8f93",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u8212",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u6055",3,{"pinyin":"shu","type":"CHAINFIND_RES"}],["\u53d4",3,{"pinyin":"shu","type":"CHAINFIND_RES"}]],"shu'ru"]}
```


所以，最后Userscript的核心简单来说就是:

```javascript
var p = new Promise(function(resolve, reject) {
  var ret = GM_xmlhttpRequest({
    method: "GET",
    url: `http://olime.baidu.com/py?input=${IME.inputString}&inputtype=py&bg=0&ed=100&result=hanzi&resultcoding=unicode&ch_en=0&clientinfo=web&version=1`,
    onload: function(res) {
      //console.log("[DEBUG connect]")
      resolve(res.responseText);
    }
  })
});

p.then(parseJSON).then(parseRes, printError);
```

`parseRes`完成对返回json文件的解析，并更新用户界面，存储信息到输入法内部状态。

## 用户界面。

如果说还有什么比较恶心的事情，就是用户界面。一个简单的输入法用户界面显示如下

    --------------------
    shuru               |<---输入提示(已经输入的内容)
    --------------------\
    1\. 选择1             |
    2\. 选择2             |
    3\. 选择3             | <----选择列表
    4\. 选择4             |
    5\. 选择5             |
    ---------------------

好像也简单的不行。。。

这个用户界面应该有些良好的特性：

1.  跟随当前输入文本框光标的位置。
2.  随着按键作出相应更新和变化。

## 控制逻辑

控制逻辑简单来说就是一个有穷状态自动机，监听各种按键然后根据输入法自身状态进行下一步。

输入法对象有些必须的基本状态：

```javascript
var IME = {
  status: 'hidden',
  inputString: '',
  TEXTS: [],
  page: 0
}
```

*   `status`: 表征输入法状态，主要是界面状态。
*   `inputString`：存储已输入数据——输入法缓存的未处理数据。
*   `TEXTS`： 用来存储百度云输入法返回后解析得到的候选词列表。
*   `page`: 存储页码，将用来决定显示`TEXTS`的哪些部分。

接下来就是逻辑，我虽然不知道有穷状态自动机是什么鬼，每次面试都被虐成渣，但混乱的逻辑依然把逻辑写出来了，请观者自行优化：

1.  页面加载完成后，输入法界面初始化(插入页面)，初始化状态为未显示状态。
2.  检测是否有输入，如果当前是未显示状态，变成显示状态。更新界面上输入提示，向百度发出请求。解析百度返回的json文件，存储TEXTS，更新选择列表。
3.  继续监听用户输入：
    1.  如果是空格或数字键1-5，在输入目标光标处插入对应文本或更改选中文本。status变为不显示，重置状态。
    2.  如果是翻页按键，更新page，更新选择列表。
    3.  如果是字符按键，则更新输入提示，并继续发送请求，解析返回的json文件，更新内部存储的TEXTS，更新选择列表。
    4.  如果是回车键，将输入提示在输入目标光标处插入或更改选中文本。状态改为不显示，重置状态。
    5.  如果是退格键，更新输入提示，并继续发送请求，解析返回的json文件，更新内部存储的TEXTS，更新选择列表。
        1.  如果输入提示中没有内容更新显示状态为消失，重置状态。

很简单。。。就是这么简单。

## 其他

接下来说一些实践者才会碰到的问题。

### 按键监听

我们都知道，你可以在`textarea`或者`input`上监听`keydown`、`keyup`、`keypress`事件来监听各种按键。

只有实践者才知道这简单描述后日了狗的现状。

### 按键冲突

首先，你想跟系统或者其他软件按键绑定冲突么，你监听个`alt`试试…我这里可以监听到，但ubuntu unity也会被触发。。。结果就是，如果你尝试绑定`Alt+F`这种快捷键基本上会被firefox直接劫持根本不会监听到F的按下。

### 用多个层次的事件监听不同按键

其次，我会告诉你[`keydown`](http://devdocs.io/dom_events/keydown)是不能区分大小写的，而[`keypress`](http://devdocs.io/dom_events/keypress)是可以的。但后者却不能监听非输入字符。参考以下firefox中例子：

```javascript
$p.addEventListener("keypress",e=>console.log(e))
undefined
$p.addEventListener("keyup",e=>console.log(e))
undefined
$p.addEventListener("keydown",e=>console.log(e))
undefined
// 当我按下a时，输入A时
keydown charCode=0, keyCode=65
keypress charCode=65, keyCode=0
keyup charCode=0, keyCode=65
// 当我按下Caps Lock时
keydown charCode=0, keyCode=20
keyup charCode=0, keyCode=20
// 当我按下a时，输入a时
keydown charCode=0, keyCode=65
keypress charCode=97, keyCode=0
keyup charCode=0, keyCode=65
```

可以看到`keypress`对象中的`charCode`属性很好的反映了真正的输入字符。而`keydown`或者`keyup`则用在监听非输入字符上。(似乎最开始也是这么设计的)

所以，我这里最后采用了分层的事件处理机制(扯的这么高大上实际上就是允许绑定多个事件顺序触发)来监听不同按键，分层执行逻辑。

```javascript
tt.addEventListener('keydown', checkNonCharacter);
tt.addEventListener('keyup', reqAndRefresh);
tt.addEventListener('keypress', intercept);
```

另外，chromium和firefox的事件对象稍有差别，注意下就好。

### 事件捕获

当你截获按键之后，_必须_ 要考虑清楚是否要阻止目标捕获该按键。比如我们用回车将输入提示内容输入到textarea光标位置后，显然不希望textarea捕获回车再来个换行。结果就是，上面简洁的逻辑过程有了很多真正使用时才发现的细节逻辑错误，接着就是靠各种判断来fix(dirty hack)。

参照以下退格键的例子，我们只想在输入法输入提示上回删，不希望在textarea或者input中也发生回删。

```javascript
switch (String.fromCharCode(e.which)) {
  case String.fromCharCode(8): // 退格
    e.preventDefault();

    IME.inputString = IME.inputString.substr(0, IME.inputString.length - 1);
    if (IME.inputString.length == 0) {
      IME.status = 'hidden';
      showImePop(false);
    }
  ...
```

### 文本内容更新

怎么更新textarea或者input内的内容呢。有两种情况：

1.  在光标后插入，并把光标置于更新文字之后
2.  替换选中文字，并把光标置于替换后文字之后

实际上，输入框（textarea或者input）元素提供了`selectionStart`和`selectionEnd`属性来读取选择文本的开始和结束，如果没有选中文字，则两个值一样都为光标现在所在位置。所以，根据这两个值更新内容和光标位置就行。

```javascript
var curStart = tt.selectionStart;
var curEnd = tt.selectionEnd;
var selectedText = imePop.querySelector('ol').children[index].textContent; // 这个是选中的词语
tt.value = tt.value.substring(0, curStart) + selectedText + tt.value.substring(curEnd, tt.value.length);
tt.selectionStart = curStart + selectedText.length;
tt.selectionEnd = curStart + selectedText.length;
```

### 输入法UI跟随

好的输入法，应该时刻跟随在输入光标附近。我们不希望输入法UI一直在屏幕最上方而是能够一直跟随在光标位置附近。

遗憾的是，并没有什么好的方法能定位光标相对于文本框的位置。好在天才灵动的前端人有的是[黑魔法](https://github.com/component/textarea-caret-position/blob/master/index.js)。简单来说，就是添加一个不可见的`div`，将`textarea`的属性复制过去使他们几何上看上去一样。在把光标位置之前文本复制过去，在文本之后加入一个`span`标签，获取这个`span`标签相对与该`div`位置，也就获得了光标相对于文本框的位置。当然位置获取后就把这个镜像`div`删除掉了。

接下来，[根据光标相对文本框的位置可以计算出光标相对于文档(`document.body`)的位置](http://www.quirksmode.org/js/findpos.html)，依此我们可以设置输入法UI插入到文档内并设置绝对位置(`absolute`)。

这样就实现了输入法UI跟随输入光标。

### 智能边界

我再之前提到的[取词Userscript脚本](http://reverland.org/javascript/2015/11/17/greasemonkey-userscript/)中使用了这项功能，而实际上呢，这个东西来源于几个月前跟着《30天实现操作系统》写操作系统界面处理拖动窗口时的实践。

话说，很多次面试我都说我写了个操作系统玩，然后面试官就睁大眼睛那我问问你进程管理，我说啥叫进程管理，然后就没有然后了。。。做了没什么卵用的东西挺多，但是，那里学到的处理窗口在边界的方法倒真用上了。顺便一说facebook的react虚DOM，应该对看过《30天瞎逼写操作系统》的同学也很眼熟。

说得这么高大上，实际上就是如果检测到界面超出窗口范围就平移到窗口内。233

获取元素相对viewport位置参考[getBoundingClientRect](http://devdocs.io/dom/element/getboundingclientrect)，我昨天在[Eloquent Javascript](http://eloquentjavascript.net/13_dom.html)中看到了这个。当然，也许你不想插入元素之后再获取位置再变更位置，我目前也不知道怎样已知相对文档位置判断相对viewport位置。劳烦熟悉的、专业的朋友在评论中给我指正。(也许得减下`pageYOffset`吧，我猜233)

另外，如果你监听鼠标或触摸事件，那个事件有个`clientX`和`clientY`属性也是相对于viewport。比如取词的场景中，监听到鼠标按键弹起，判断在`clientX`和`clientY`位置生成一个弹出框会不会超出viewport范围(也许是`window.innerWidth`和`window.innerHeight`)，这样也能实现在边界的智能平移行为。

其实输入法脚本中还没实现这个。我感觉[这些API挺乱](http://stackoverflow.com/questions/21064101/understanding-offsetwidth-clientwidth-scrollwidth-and-height-respectively)

### 现实并不简单

事件绑定冲突。考虑以下情况：

1.  比如devdocs这种网页应用，网页在body或者哪里绑定了按键监听，并且不让接下来的元素捕获了。
2.  网页神奇的用DOM level1的方式比如`textarea1.onkeydown = function(e){console.log("233，失效了吧")}`来监听
3.  简书这种根据用户交互用js操作页面的，忽然出现了一个textarea然而我们输入法只在第一次页面加载时在输入框上绑定。
4.  知乎这种页面，输入框并不是textarea或者input，而是div你敢信。。。

总之，真正一个跨页面可用程序，大概各种监听DOM变化，启发式搜索输入框，对事件绑定进行重排等等黑魔法，这。。。就不在本文的探讨范围内了。

另外，UI也最好明确指定高度宽度，不然，如果跟随内容变化，那么比如选择列表从无到有时界面会有大幅抖动，当然，UI设计和前端细节什么的，也不是我这个前端渣渣有能力讨论的了。

## 思考

作为一个不务正业的非专业拉圾前端，不是professional app开发者的瞎逼写少年。我做了很多没卵用的东西，从Photomosaic生成器到仿Shodan设备搜索引擎，从拥抱machine learning的shellcode检测到项目中瞎逼搞的安全shell……等等等等。经常直接上手挑战各种根本我自己都不知道是什么的东西，缺乏专业素养也就算了，learning from the ground也就算了，写出渣一样的东西也就算了，性能优化数据结构算法都现学转眼还忘了也就算了，被当成sb也就算了，

但，我玩得很开心啊。

这世界太险恶了，不同的人有不同的用心，我这种渣号称全栈的权利都被剥夺的一干二净。有些人总绞尽脑汁想着如何能从别人身上搜刮更多，有些人则在支持帮助他人的过程中最终成就了自己。他们将各得命运，谢谢后者，去你妈的前者。

### 思考和实践

说说对思考与实践的关系。

我经常做之前没做过的事情，所以，往往觉得困难重重。在这个过程中，慢慢也磨砺了自己搜集信息和判断问题的能力。但因为没有经验，总是还会走各种弯路。

所以每次做完什么都想，如果动手之前我多想一想，想好了，再写就会顺利很多。不致于在一些简单的问题上挣扎很久。

但另一方面，你想再久，大多数问题也只会在你碰到之后才浮现出来，因为你根本就不知道你将面对什么。再多他人的经验都是浮云，要么你不理解，要么根本不符合场景，要么你碰到才想起来。除非，你就重复了下别人做过的事情，那都不一定能顺利。

我想，这就是人生。所以多想还是多做？永远没有答案，想、做、想、做，理论和实践螺旋上升。

你可以吸取他人的经验，但不可能重复他人的人生，或者你真的愿意仅仅跟随？我个人觉得，只有在摔得半死不活的时候，才能明白他人留下的经验再说什么，不然盲从经验仅仅是束缚。

我忽然想到毛姆在《人生的枷锁》中的观点，我想这观点也束缚了我之后几年的态度和选择，也许还会束缚未来几年甚至一生。想到这里，背后直觉一阵冷汗。

叹人间，美中不足今方信。

### 基础知识和复杂逻辑

基本上，我做什么东西都是现学，强行在复杂逻辑中现学基础。

经常想，如果之前，我把xxx先学好了，就会少走这多少弯路了。

然而这是个伪命题，我没真正想做什么需要去学什么，大概也不会记得自己学过什么。顺便说自己做过的东西都因为接触太多会忘得几乎一干二净，何况那种所谓“系统学习过的呢？”。我的第一门认真学的语言是common lisp，然而在几天前兴致盎然忽然回头看之前甚至连括号之外的语法都不记得了。我都不敢相信当时还用common lisp写过web server，做过DSL，搞过人工智能网页游戏？

但我记得很清楚，_lazy evaluation_ ，我觉得面对复杂世界的学习过程也该这样，lazy是一种策略：）

正如[Xenon](http://blog.xen0n.name/)那个“云破月来”的一起膜蛤的夜晚对我说的，也许你忘记的东西，都内化为自己的一部分了吧哈哈哈。

真正重要的，应该是学习的能力而不是知识本身。

我想，未来是属于掌握渔而不是掌握鱼的人。

再复杂的东西，不是一步一步构建的吗？不要因为某些自以为的专家搞得好像多高深似的。

如果你对此心存疑问，建议看看[Neural Network and Deep Learning](http://neuralnetworksanddeeplearning.com/)这本书。看看为什么很多似乎凭空而来复杂概念最初是怎么来的，看看我们人类整体面对复杂世界的无力感。也许你不做神经网络也不搞深度学习，但是它将enlighten you.

重要的从来不是知识，而是我们如何得到发展知识。

可惜估计谁也没办法考察你的这项能力。只能你自己觉得233

### Last But Not Least

有两本非常喜欢的书：《Land of Lisp》和《Eloquent Javascript》。

然而世人一般喜欢看两种书：

1.  21天精通xx系列
2.  xx导论/xx权威指南/xx精粹/xx高级xx/你不知道的XX

请自行对号入座。

人生苦短，我就是不看。找不到工作拉倒。我不至于因为有谁告诉我该看去看，hacking对我也不仅仅是混饭这么简单。

我对第二类书的作者致以崇高的敬意，但并不代表，就一定得去看什么什么的。有缘的终会有缘，该看的终会去看。

每次看网上有人问我想学XX，我该如何XX.都有人说你去读XX读XXfollowXX就怎样怎样。我都觉得好笑，不是笑觉得错了，而是觉得，情怀呢？

当然，情怀是不能当饭吃的。

所以，有次面试，面试官说再看看YDKJS应付面试没问题了，当时就想喷他，虽然并没有只是微笑地看着他。

现在喷：）_你当我看什么看什么写什么学什么是为了应付面试糊弄工作？_，你看过[phrack magazine](http://phrack.org/)么，那上面经常说，

> for fun and profit

这些年，也积极参与了很多很多活动。但越来越反感某些活动的宣传方式。当然，只是反感而已，毕竟活动组织费心费力又费钱，他们也未必没有吹嘘的本钱。反感谁就不说了，一般这种我也不会去，我也不会有机会去。。。作为loser门票都买不起：（

有些另外的活动则非常喜欢，只在这里向我非常感谢的活动组织方致以谢意：红帽中国Jboss User Group、360奇舞团。感谢精彩的分享和热情的招待。

我想对所有能看到这里的读者说，我不相信那些声称自己多xx多xx拯救世界颠覆宇宙，离地两万英尺飞来飞去的牛皮。如果见有人声称他们多牛逼能做到别人做不到的东西，他们头上光环无数出身高贵血统优良，我想说。

_我们所有人，都是平等的，一样的。只因为不同人对我们的希求不同而体现出看似不同的价值，因此体现出优秀和差劲的差别。_

无论境况比他人好或坏，我们都不比他人优越和差劲。

引用[Eloquent Javascript]中的一句话

> I’ve often felt that some human inventions were so immensely clever and complicated that I’d never be able to understand them. But with a little reading and tinkering, such things often turn out to be quite mundane.

所以，除了物理条件限制，没有什么别人能做到而我不可能做到。计算机是个伟大的发明，让我们在其上超越物理限制有了平等的舞台。

引用我经常看到的一句话：

> 限制你的只有你的想象力。

请捍卫这个平等，[支持自由软件基金会](https://my.fsf.org/donate/)。

> to preserve, protect and promote the freedom to use, study, copy, modify, and redistribute computer software, and to defend the rights of Free Software users.

至此，这篇瞎逼扯的文章变成一篇软文233。

最后奉上原始版本。

![输入法的第一个版本](http://img.vim-cn.com/2f/d42431ca004bae8ab13fd18d15bef4d4549844.gif)

写到这里好累，前前后后几个小时过去。文笔很乱也不加修改，如若能于其中有半点涟漪，也不负我在屏幕前的叹息了。

Have fun
