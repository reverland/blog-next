webpackJsonp([2,170],{344:function(n,e){n.exports="\n\n这两天，写了一个简单的基于有道在线翻译的GreaseMonkey屏幕取词脚本。\n\n[点我查看GreaseFork](https://greasyfork.org/en/scripts/12758-youdaodict)\n\n![有道取词Userscript](http://img.vim-cn.com/6d/513d2b37bf298b4ae77bc663c597260e5a115e.gif)\n\n我想做这件事很久了，从我还不是一个前端开发者的时候，就一直想做这么一个轻量的浏览器脚本，方便自己查看英文的文档和文章。没想到想了这么久，真正没做多久。\n\n作为一个Ubuntu Linux用户，浏览器取词我有几个选择：\n\n1.  尝试安装有道词典Linux版本、openyoudao或者其他stardict或者goldendict这种本地词典。但我并不觉得我需要桌面软件。\n\n2.  有人做了个Google translate tooltip的GreaseMonkey脚本实现这个，非常棒。但谷歌的服务在国内的服务非常不稳定，取词功能经常不能正常使用。\n\n3.  有道提供了[网页翻译2.0](http://fanyi.youdao.com/web2/?keyfrom=fanyiweb)，通过书签执行一段代码把取词功能注入当前页面。然而，首先随着浏览器安全特性的加强，该书签不能正常使用，其次每次都要先点书签才能取词(也许是快捷键)。\n\n## 选择是难\n\n很多网站，包括cnblog发现都提供了取词版本。我面临的选择是：\n\n1.  在这些已有的浏览器取词脚本基础上学习修改。\n2.  凭借着自己的感觉从新设计\n\n选择上花了很多时间。\n\n方案一的优点有：\n\n1.  成熟美观。\n2.  能学习到很多东西\n\n方案一问题在于：\n\n1.  源码难理解。代码量较大，都是压缩甚至混淆变量过的。\n2.  有些和当前页面的样式或者脚本搅和在一起。不易分离\n3.  被浏览器或网站安全设置废掉，未必能使用\n\n终于，由于我的智商被有道在线翻译那个脚本所碾压，我想还是看看功能自己设计下，做个简单版本。\n\n想的很简单\n\n## 设计是易\n\n想法很简单。\n\n1.  鼠标选词\n2.  向第三方发起请求，比如bing的翻译或者有道的\n3.  读取返回，弹出tooltip，格式化数据\n4.  其他辅助功能比如发音、单词本等等\n\n设计是最简单的一环，后面你会看到时间都花到哪里了。\n\n## 知易行难\n\n通过谷歌，很容易完成第一步，在脚本中得到选中的文字。\n\n第二步就开始面临问题。作为前信息安全专业从业者，很清楚ajax这种东西跨域是受限制的。稍微翻阅scriptish文档发现GM_xmlhttpRequest可以满足我的需求。\n\n除却和 `XMLHttpRequest`这种东西并不太一样的api造成的各种细节错误，之后碰到的问题是我整个开发过程最棘手、花费时间最长的问题。\n\n无论onload、onerror还是onreadystate的回调中，`GM_log`都没有打印出任何信息。\n\nfirebug和火狐内置调试器也没有显示任何通信。这和我在网络上看到的GreaseMonkey相关信息并不太相符。\n\n经检查脚本元数据`@grant`，觉得已经授权这个跨域函数也没什么问题。\n\n折腾一阵，确认API调用和细节都无法确认问题后，采取曲线调试方案。\n\n更改请求地址到本地，确认请求确实发出了。那么，它有返回吗？\n\n在本地用netcat模拟返回数据，仍然没有打印任何信息。我开始怀疑难道GM_xmlhttpRequest是会对返回结果做验证？必须报头正确？\n\n第一天就这么过去了。\n\n第二天我决定尝试代理来看来往的通信是否正常。\n\n方便起见，先用nc充当了下代理，检查了下相互通信，未见有什么不对的。\n\n为严谨起见，用burpsuite来设置一个透明本地代理，让浏览器指向那个代理。经过检验，完全没看出通信有什么问题。但onload和其他回调也不会被触发。\n\n谷歌搜索得到一些stackoverflow、github issue和greasewiki上的信息，但问题仍不能确认和解决。\n\n只是昨天晚上baidu时心心念念，发现firefox贴吧里有人吐槽scriptish不稳定的一些地方，今天又看到一些讨论，决定换回GreaseMonkey试试，事实证明这是明智的。\n\n然而，一换发现什么都打印不出来了。后来反复尝试，发现GM_log不能用，我简直震惊了，wiki上写着玩的么，还是有什么变化。反正我发现console.log可以使用，那就继续开发下去了。\n\n最难的部分就这么糊里糊涂过去了。\n\n## 数据请求顺风顺水\n\n一旦请求完成，解析json数据，按需展示就是水到渠成的事情。\n\n然而，并不是那么简单。\n\n## JS异步与回调之难\n\nJS的异步特性带来了这些不符合人类直观思维方式的流程控制风格。\n\n按理说我应该很习惯javascript的异步操作流程控制的种种问题，但还是踩了次坑。\n\n弹出和渲染tooltip的函数没有读到返回数据！\n\n好在对javascript程序员debug这种问题比之前的问题简单太多。一看想起来GM_xmlhttpRequest是异步过程，而不是同步，我这里却要待异步过程返回结果再执行下一个函数。\n\n想想promise应该不用，虽然firefox41肯定原生支持ES6 promise了。但，就这点函数干脆。。。还是回调“地狱”吧。\n\n## JS难中有易\n\n说到ES6，ES6提供了很多方便javascript编程的好东西，通过`let`和`=>`实现更好的this和作用域一致，通过`Template`方便字符串操作等等。\n\n很庆幸，GreaseMonkey的话我只考虑firefox用户，反正好早的时候这些ES6特性浏览器都支持了。\n\n## JS易中又难\n\nJS让人非常难过的一个地方，是DOM操作和各种webAPI。只能说丧心病狂。你记得清楚如何获得viewport区域大小么？知道如何获得鼠标相对viewport位置么？知道为啥获取区域高度或宽度并没有获得么？看到clientWidth、offsetWidth、availWidth…有没有想砍人？\n\n为了让脚本能正确在屏幕边缘让tooltip出现在viewport内，在各种边界条件数学计算题这里又纠结了好久。\n\nGreaseMonkey相比Scriptish少了一个比较方便的特性： `@css`。虽然可以在head标签中通过`GM_addStyle()`来注入样式，我总觉得会不合时宜的覆盖不该覆盖的东西，我对Google Translate Tooltip在阮一峰大大的网站上奇葩的样式表现印象深刻。所以，还是选择在DOM中注入的样式。\n\n这是体力活，你说体力活难不难呢？\n\n## 最难的部分\n\n安全是最难以面对的一个问题。之所以，很多标签、脚本在页面上失效，都是由于近年来浏览器越来越严格的安全策略。我在开发这个脚本时碰到了两点：\n\n1.  在https网站页面中无法加载http的资源。在调试工具中可以看到[mixed content](https://developer.mozilla.org/en/docs/Security/MixedContent)的字样。\n2.  如果网站报头中有CSP限制。调试工具中也能看到提示。\n\n问题一，可以通过GM_xmlhttpRequest方法实现混合协议内容，如果外部资源也支持https请求也行。当我开发发音功能时就发现有道的语音api可以用https访问。\n\n问题二，只能通过各种CORS技术实现(参见附录)。<del>我还没开始做。</del>但看到[Stackoverflow上有个示例](http://stackoverflow.com/questions/28554022/how-can-i-play-sound-with-a-greasemonkey-script-in-firefox-when-theres-a-conte)\n\n> 你确定要通过打开`about:config`禁用firefox对CSP的支持吗？\n\n不！！\n\n通过`GM_xmlhttpRequest`完成异步请求，将数据用浏览器播放出来实现跨域资源引用。这样，在一定程度上并不降低浏览器安全性，却能够实现需求，完成功能。\n\nCheers！\n\n## 附录\n\n*   [https://bugzilla.mozilla.org/show_bug.cgi?id=866522](https://bugzilla.mozilla.org/show_bug.cgi?id=866522)\n*   [https://github.com/greasemonkey/greasemonkey/issues/2046](https://github.com/greasemonkey/greasemonkey/issues/2046)\n*   [http://forums.mozillazine.org/viewtopic.php?f=38&t=2958293](http://forums.mozillazine.org/viewtopic.php?f=38&t=2958293)\n*   [http://stackoverflow.com/questions/28554022/how-can-i-play-sound-with-a-greasemonkey-script-in-firefox-when-theres-a-conte](http://stackoverflow.com/questions/28554022/how-can-i-play-sound-with-a-greasemonkey-script-in-firefox-when-theres-a-conte)\n"}});
//# sourceMappingURL=2.3acbcb74580388990c68.js.map