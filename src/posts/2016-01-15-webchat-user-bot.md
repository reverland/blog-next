---
layout: post
title: "Web 微信与基于Node的微信机器人实现"
excerpt: "web微信协议详解，介绍Javascript实现的微信机器人"
category: javascript
tags: [javascript, protocol]
disqus: true
---

## 协议分析

我使用firefox浏览器调试工具，查看浏览器通信及美化web微信javascript代码。非常好用，没出现Chromium中文乱码的问题。

### 登录

#### 获取uuid

与登录有关的第一个GET请求。

    https://login.weixin.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=en_US&_=1452859503801

响应

    window.QRLogin.code = 200; window.QRLogin.uuid = "gd94hc3_fg==";

我们猜200表示OK，uuid表示什么呢，难道不是universe unique identy?

#### 获取uuid对应的二维码图片

接着第二个GET请求，使用上面得到的uuid请求二维码图像。

    https://login.weixin.qq.com/qrcode/gd94hc3_fg==

响应就是一个二维码图片。

#### 检查二维码扫描状态

一个GET请求

    https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=true&uuid=gd94hc3_fg==&tip=0&r=-1160587432&_=1452859503803

这里的参数r是时间戳(`~Date.now()`)，而`_`这个是jquery强行加上防止IE缓存的参数，服务器并不使用。服务器保持连接不中断，在大概27000ms后返回：

    window.code=408;

HTTP code 408表示连接超时。接着又一个这种请求

    https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=true&uuid=gd94hc3_fg==&tip=0&r=-1160614525&_=1452859503804

大概若干次后， 很久很久这个请求还是被服务器hold住没有返回。然后我再扫描时二维码失效了。。

如果在移动端扫描过二维码，那么上面的请求将返回

    window.code=201;window.userAvatar = 'data:img/jpg;base64,/9j/4...'

显然，http code 201一般表示新资源被建立(created)。同时继续另一个稍有不同的新的GET请求。

    https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=true&uuid=gfKtKTG7EQ==&tip=0&r=-1163246522&_=1452862177016

注意，这时候tip变成0了。

移动端如果不确认登录，经过27000ms左右后依然返回

    window.code=408;

因此可以确定大概408就是状态不变超时继续的意义。接下来继续上述GET请求。

一旦移动端点击确认登录，上述GET请求立马返回

    window.code=200;
    window.redirect_uri="https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxnewloginpage?ticket=Ac8jAIUKtSn5vBxlXAinpFXL@qrticket_0&uuid=gd94hc3_fg==&lang=en_US&scan=1452862897";

scan参数就是`Date.now()`。这时一个重定向页面又参数中附加上了一个ticket，看到这里，Oauth五个大字从脑海中无名升起。下面，域名就变了。

#### webwxnewloginpage

接下来一个GET请求

    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=-1163944362&lang=en_US&pass_ticket=KlRMZmPcELxJHikrTsq6UEuDiy%252BZn1wFQ1VoeVAHUls82tXXB4L89ePbSghP6ICI

返回这么个东西:

    <error><ret>0</ret><message>OK</message><skey>@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c</skey><wxsid>L9W0ddcaijmzhYhu</wxsid><wxuin>2684027137</wxuin><pass_ticket>KlRMZmPcELxJHikrTsq6UEuDiy%2BZn1wFQ1VoeVAHUls82tXXB4L89ePbSghP6ICI</pass_ticket><isgrayscale>1</isgrayscale></error>

这些返回的参数

*   skey: 我有点考据癖，发现[qq空间也用这个东西](http://www.feifeiboke.com/gongfang/2346.html)，维基百科说是一种一次性密码生成系统。大概这个值也是这么若干次哈希生成出来的。
*   wxsid: weixin session id
*   wxuin: weixin user identity number
*   pass_ticket: 通关文牒

同时，返回的包头里包含`set-cookie`设置了cookie来标识用户。Cookie设置了上面的

*   wxsid
*   wxuin

另有

*   wxloadtime: web微信页面加载时间。它是在计时并且不断汇报给服务器的。
*   mm_lang: 界面语言，我还想考证下mm什么意思然而并没有考证出来
*   webwx_data_ticket(这个域在qq.com上，其他都在wx.qq.com上)，不知道干什么用的，似乎标识用户资源信息时得用上。所有的用户资源比如图片音频什么的都在qq的域名上。（后面会讨论这个问题）

至此，登录过程完成。获取了cookie、pass_ticket和skey。

### 基本信息获取

#### webwxinit

初始化整个webqq的信息获取。

一个POST请求（sorry，我忘记和上文的passticket啊uin啊对应一致了。

    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=-1163944362&lang=en_US&pass_ticket=KlRMZmPcELxJHikrTsq6UEuDiy%252BZn1wFQ1VoeVAHUls82tXXB4L89ePbSghP6ICI

post payload

    {"BaseRequest":{"Uin":"2684027137","Sid":"L9W0ddcaijmzhYhu","Skey":"@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c","DeviceID":"e159973572418266"}}

返回一个巨大的json，包含页面首次更新所需的基本信息

*   BaseResponse： 标识返回是否出错
*   Count：登录时显示的常用联系人列表中条目个数
*   ContactList：常用联系人列表(包括特殊联系人、群和私信)
*   SyncKey：更新Key，不太清楚是啥，似乎类似activesync的一种协议
*   User: 自己的信息，用户uin，Username，NickName，HeadImgUrl等
*   ClientVersion
*   SystemTime
*   GrayScale: 不知什么
*   InviteStartCount: 不知什么
*   MPSubscribeMsgCount： 这两条是有关web微信中间一栏阅读列表的
*   MPSubscribeMsgList: 同上
*   ClickReportInterval：点击报告间隔，似乎只是为了报告些性能信息<a href="">https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxstatreport?fun=new</a>

这个请求会在ContactList里获得常用联系人信息，接着web微信会使用这些信息来batchgetcontact获取详细群组或者个人信息（详见下文）。并且，最最关键的是Synckey，用这个key来不断跟踪web微信客户端的变化。

#### webwxgetcontact

获取联系人列表的GET请求。

    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=en_US&pass_ticket=KlRMZmPcELxJHikrTsq6UEuDiy%252BZn1wFQ1VoeVAHUls82tXXB4L89ePbSghP6ICI&r=1452862903198&seq=0&skey=@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c

返回包含联系人信息列表的JSON数据

*   BaseResponse
*   MemberCount
*   MemberList
*   Seq： 只见过返回0

#### batchgetcontact

这是获取用户信息最重要的请求。POST请求：

    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxbatchgetcontact?type=ex&r=1453373586582&pass_ticket=cNQtWm5HAlkezd4WDrmrb6TBQYtkdHM4jaqbSWWYCT0EzIWzxBLHTu6Rb4fPw%252Fhf

`type=ex`硬编码不知道想表达什么，r是时间戳。

post data有两种，分别对应针对用户和群的查询：

    // UserName是要查询具体信息的用户名，EncryChatRoomId是该用户所属的群用户名。不知道为什么web微信要这么设计
    {"BaseRequest":{"Uin":2684027137,"Sid":"rnggO94JNo8B3Irp","Skey":"@crypt_3bb2969_890811a1e096f98662389b04dac3dcb8","DeviceID":"e559659465724952"},"Count":1,"List":[{"UserName":"@83cdf89d8ae7bf82d1fba26693b4952f","EncryChatRoomId":"@@8432d9b1c96038e5229185af62caa626add1a6b87554eb91cc5f5b63a207c8b3"}]}
    {"BaseRequest":{"Uin":2684027137,"Sid":"rnggO94JNo8B3Irp","Skey":"@crypt_3bb2969_890811a1e096f98662389b04dac3dcb8","DeviceID":"e559659465724952"},"Count":1,"List":[{"UserName":"@83cdf89d8ae7bf82d1fba26693b4952f","EncryChatRoomId":"@@8432d9b1c96038e5229185af62caa626add1a6b87554eb91cc5f5b63a207c8b3"}]}

    // UserName是想要查询具体信息的群UserName
    {"BaseRequest":{"Uin":2684027137,"Sid":"L9W0ddcaijmzhYhu","Skey":"@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c","DeviceID":"e017670883684764"},"Count":2,"List":[{"UserName":"@@9dc894837da0c2ac9932a85afb91af2d085807013562857e8b4a0ca66661ec68","EncryChatRoomId":""},{"UserName":"@@69dfa612d6bbefebbf24c323b6103680ac32c6a7b41e0862cc24f0b6f3174a08","EncryChatRoomId":""}]}

返回典型User集合如下，上文提及的getcontact和batchgetcontact得到的都是这样：

    {
    "Uin": 0,
    "UserName": "filehelper",
    "NickName": "文件传输助手",
    "HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=620730115&username=filehelper&skey=@crypt_3bb2969_2e9301eaab7a4b13a3a893a0bb5e8dfb",
    "ContactFlag": 3,
    "MemberCount": 0,
    "MemberList": [],
    "RemarkName": "",
    "HideInputBarFlag": 0,
    "Sex": 0,
    "Signature": "",
    "VerifyFlag": 0,
    "OwnerUin": 0,
    "PYInitial": "WJCSZS",
    "PYQuanPin": "wenjianchuanshuzhushou",
    "RemarkPYInitial": "",
    "RemarkPYQuanPin": "",
    "StarFriend": 0,
    "AppAccountFlag": 0,
    "Statues": 0,
    "AttrStatus": 0,
    "Province": "",
    "City": "",
    "Alias": "",
    "SnsFlag": 0,
    "UniFriend": 0,
    "DisplayName": "",
    "ChatRoomId": 0,
    "KeyWord": "fil",
    "EncryChatRoomId": ""
    }

典型群信息集合

    {
    "Uin": 0,
    "UserName": "@@3376dc306923e39c2c5c43915012b1157af80fdc21f1cfb703ee720d09e13315",
    "NickName": "BJ NodeJS Club",
    "HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgetheadimg?seq=639556586&username=@@3376dc306923e39c2c5c43915012b1157af80fdc21f1cfb703ee720d09e13315&skey=",
    "ContactFlag": 3,
    "MemberCount": 421,
    "MemberList": [{
      "Uin": 0,
      "UserName": "@eb59926a7755e31f3030a883845eb647",
      "NickName": "hain",
      "AttrStatus": 98407,
      "PYInitial": "",
      "PYQuanPin": "",
      "RemarkPYInitial": "",
      "RemarkPYQuanPin": "",
      "MemberStatus": 0,
      "DisplayName": "",
      "KeyWord": "hai"
      }
    ...// 省略若干Member
    ],
    "RemarkName": "",
    "HideInputBarFlag": 0,
    "Sex": 0,
    "Signature": "",
    "VerifyFlag": 0,
    "OwnerUin": 246642915,
    "PYInitial": "BJNODEJSCLUB",
    "PYQuanPin": "BJNodeJSClub",
    "RemarkPYInitial": "",
    "RemarkPYQuanPin": "",
    "StarFriend": 0,
    "AppAccountFlag": 0,
    "Statues": 0,
    "AttrStatus": 0,
    "Province": "",
    "City": "",
    "Alias": "",
    "SnsFlag": 0,
    "UniFriend": 0,
    "DisplayName": "",
    "ChatRoomId": 0,
    "KeyWord": "",
    "EncryChatRoomId": "@9d9762417362d83c838bb54afacdac14"
    }

比较有意思的是，这里群信息中的EncryChatRoomId只用来请求头像图片（参见下文），而请求中的EncryChatRoomId的值却填写的是群的UserName。

#### webwxgeticon和webwxgetheadimg

用户头像获取，每个User有个对应的HeadImgUrl。都不太一样

    // 带skey用户
    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=620730145&username=@63f002cacb7eebc558206af36c8758e68374063d653e51181eeb41a19a723399&skey=@crypt_3bb2969_890811a1e096f98662389b04dac3dcb8
    // skey为空的群图像，用户有时也有这种请求，不明确为何。ps: 用户信息中的HeadImgUrl也不会带skey。
    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetheadimg?seq=639547833&username=@@8432d9b1c96038e5229185af62caa626add1a6b87554eb91cc5f5b63a207c8b3&skey=
    // 带chatroomid的非好友群中用户头像， 其中chatroomid是群信息中的encrychatroomid。
    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgeticon?seq=0&username=@81c029b96b211aed1f4da9ea8a2acea7&skey=@crypt_3bb2969_890811a1e096f98662389b04dac3dcb8&chatroomid=@1d5974437ca911fe1315d415d98645ed

似乎第一次请求会带上有值的skey，之后就不一定了不确定。

### 信息收发

#### syncheck与webwxsync(长连接和消息更新)

基本信息获取完毕，接下来一个长GET连接，服务器可能会保持连接很久才返回，一旦断开客户断继续立即连接。这样服务器可以随时将更新的消息推送到客户端。

    https://webpush.weixin.qq.com/cgi-bin/mmwebwx-bin/synccheck?r=1452862903206&skey=%40crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c&sid=L9W0ddcaijmzhYhu&uin=2684027137&deviceid=e881718509293654&synckey=1_639545758%7C2_639547230%7C3_639546681%7C1000_1452852659&_=1452862890152

一个典型的返回为

    window.synccheck={retcode:"0",selector:"2"}

分析[webwx源码](https://res.wx.qq.com/zh_CN/htmledition/v2/js/webwxApp2aeaf2.js)可以看到，如果retcode不是0且selector不为0，则发出这么一个POST请求

    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsync?sid=L9W0ddcaijmzhYhu&skey=@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c&lang=en_US&pass_ticket=KlRMZmPcELxJHikrTsq6UEuDiy%252BZn1wFQ1VoeVAHUls82tXXB4L89ePbSghP6ICI

请求载荷为

    {"BaseRequest":{"Uin":2684027137,"Sid":"L9W0ddcaijmzhYhu","Skey":"@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c","DeviceID":"e431325091638023"},"SyncKey":{"Count":4,"List":[{"Key":1,"Val":639545758},{"Key":2,"Val":639547230},{"Key":3,"Val":639546681},{"Key":1000,"Val":1452852659}]},"rr":-1163958067}

其中rr为`~Date.now()`。这里第一次传递的是webwxinit时得到的SyncKey。一般开始有四个键值对，不知道对应什么意义。

返回为一个JSON对象，几个比较重要的属性包含

*   BaseResponse
*   AddMsgCount:新增消息数
*   AddMsgList：新增消息列表
*   ModContactCount: 变更联系人数目
*   ModContactList: 变更联系人列表
*   SyncKey:新的synckey列表

接下来，又一个syncheck请求要向服务器表示上面的webwxsync响应已经收到了，更新SyncKey。

    https://webpush.weixin.qq.com/cgi-bin/mmwebwx-bin/synccheck?r=1452862906986&skey=%40crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c&sid=L9W0ddcaijmzhYhu&uin=2684027137&deviceid=e390320631258365&synckey=1_639545758%7C2_639547231%7C3_639546681%7C11_639547225%7C13_639540102%7C203_1452862598%7C1000_1452852659&_=1452862890153

若synccheck返回为（我没从源码中看出selector的意义）。

    window.synccheck={retcode:"0",selector:"0"}

则继续发出相同请求

若返回不为以上返回值，继续POST请求webwxsync

    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsync?sid=L9W0ddcaijmzhYhu&skey=@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c&lang=en_US&pass_ticket=KlRMZmPcELxJHikrTsq6UEuDiy%252BZn1wFQ1VoeVAHUls82tXXB4L89ePbSghP6ICI

请求参数如下

    {"BaseRequest":{"Uin":2684027137,"Sid":"L9W0ddcaijmzhYhu","Skey":"@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c","DeviceID":"e544554467912584"},"SyncKey":{"Count":7,"List":[{"Key":1,"Val":639545758},{"Key":2,"Val":639547231},{"Key":3,"Val":639546681},{"Key":11,"Val":639547232},{"Key":13,"Val":639540102},{"Key":203,"Val":1452862989},{"Key":1000,"Val":1452852659}]},"rr":-1164083935}

这时候使用的syncKey是上次webwxsync时返回的新synckey

该过程循环往复，每次都伴随着SyncKey的不断更新。通过这个机制web微信实现信息的增量更新同步。

#### 消息发送

一个POST请求

    https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=en_US&pass_ticket=KlRMZmPcELxJHikrTsq6UEuDiy%252BZn1wFQ1VoeVAHUls82tXXB4L89ePbSghP6ICI

请求载荷为

    {"BaseRequest":{"Uin":2684027137,"Sid":"L9W0ddcaijmzhYhu","Skey":"@crypt_3bb2969_5d9682fbe6794c9437337ef278f6615c","DeviceID":"e888644980385645"},"Msg":{"Type":1,"Content":"养鸡厂233\n","FromUserName":"@30a777fdcc5ed46bbbf7bc695515afba9ad194cc720e006e6bb775054102636f","ToUserName":"@@48967eff39f174a33012bde5af8878227dd4ba8f64dd5ecf7a6495d5b979e6ac","LocalID":"14528638294750795","ClientMsgId":"14528638294750795"}}

其中type标识了发送消息的类型，1表示文本消息。另从源码中看到， LocalID和ClientMsgId这样计算

    (Date.now() + Math.random().toFixed(3)).replace('.', '')

该请求返回一个JSON对象

*   BaseResponse
*   MsgID: 服务器返回消息id // 微信公众平台文档中也提到可以用来排序或排重好像。
*   LocalID: 发送时指定的本地id.

#### 消息接收实例

一个典型收到文本信息的例子：

    "AddMsgCount": 2,
    "AddMsgList": [{
        "MsgId": "6276659661087965644",
        "FromUserName": "@@cd020d3254fa869dfdc88a2ef4e4e201384b909eeabcb3724463bf64c5f7a452",
        "ToUserName": "@31908794c3035a00b386bc9ef0526ee8d95b3c426d53fb4f9466b67d7a0b5fef",
        "MsgType": 1,
        "Content": "@f88c48e531bc7de94072a206729750ff:<br/>好了，收工，你们聊",
        "Status": 3,
        "ImgStatus": 1,
        "CreateTime": 1453391337,
        "VoiceLength": 0,
        "PlayLength": 0,
        "FileName": "",
        "FileSize": "",
        "MediaId": "",
        "Url": "",
        "AppMsgType": 0,
        "StatusNotifyCode": 0,
        "StatusNotifyUserName": "",
        "RecommendInfo": {
          "UserName": "",
          "NickName": "",
          "QQNum": 0,
          "Province": "",
          "City": "",
          "Content": "",
          "Signature": "",
          "Alias": "",
          "Scene": 0,
          "VerifyFlag": 0,
          "AttrStatus": 0,
          "Sex": 0,
          "Ticket": "",
          "OpCode": 0
          }
        ,
        "ForwardFlag": 0,
        "AppInfo": {
          "AppID": "",
          "Type": 0
          }
        ,
        "HasProductId": 0,
        "Ticket": "",
        "ImgHeight": 0,
        "ImgWidth": 0,
        "SubMsgType": 0,
        "NewMsgId": 6276659661087965644
      }
      ,{
        "MsgId": "1010502497825347915",
        "FromUserName": "@c1019d5180ee2ef97a302737205b788502476a24cb1e870ac99da1aad788ac5f",
        "ToUserName": "@31908794c3035a00b386bc9ef0526ee8d95b3c426d53fb4f9466b67d7a0b5fef",
        "MsgType": 1,
        "Content": "牛逼哄哄的啊！",
        "Status": 3,
        "ImgStatus": 1,
        "CreateTime": 1453391337,
        "VoiceLength": 0,
        "PlayLength": 0,
        "FileName": "",
        "FileSize": "",
        "MediaId": "",
        "Url": "",
        "AppMsgType": 0,
        "StatusNotifyCode": 0,
        "StatusNotifyUserName": "",
        "RecommendInfo": {
          "UserName": "",
          "NickName": "",
          "QQNum": 0,
          "Province": "",
          "City": "",
          "Content": "",
          "Signature": "",
          "Alias": "",
          "Scene": 0,
          "VerifyFlag": 0,
          "AttrStatus": 0,
          "Sex": 0,
          "Ticket": "",
          "OpCode": 0
          }
        ,
        "ForwardFlag": 0,
        "AppInfo": {
          "AppID": "",
          "Type": 0
          }
        ,
        "HasProductId": 0,
        "Ticket": "",
        "ImgHeight": 0,
        "ImgWidth": 0,
        "SubMsgType": 0,
        "NewMsgId": 1010502497825347915
      }
    ],

这个例子中，可以看到群信息中包含

    "Content": "@f88c48e531bc7de94072a206729750ff:<br/>好了，收工，你们聊",

这样的内容，而这个  
前面的部分，实际上在微信中是标识群中发言人的UserName。因此，展示或者记录的时候需要先解析UserName到NickName或者DisplayName。这个过程Web微信通过getcontact、batchgetcontact两类请求请求数据，并且缓存起来。

ModContactList中则包含变更的联系人信息，一个典型例子

    "ModContactCount": 1,
    "ModContactList": [{
      "UserName": "@@a6dd369b835a7f6a3fc8d4f0ace3b2de80c9c097f0439955043e6b716eb007fb",
      "NickName": "",
      "Sex": 0,
      "HeadImgUpdateFlag": 1,
      "ContactType": 0,
      "Alias": "",
      "ChatRoomOwner": "@31908794c3035a00b386bc9ef0526ee8d95b3c426d53fb4f9466b67d7a0b5fef",
      "HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgetheadimg?seq=0&username=@@a6dd369b835a7f6a3fc8d4f0ace3b2de80c9c097f0439955043e6b716eb007fb&skey=@crypt_3bb2969_2e9301eaab7a4b13a3a893a0bb5e8dfb",
      "ContactFlag": 2,
      "MemberCount": 2,
      "MemberList": [{
        "Uin": 236008826,
        "UserName": "@912d2268c7e87688e5c8f33003b488f3adcfd3b4d25fcb9a271550bfc18a7328",
        "NickName": "膜法师",
        "AttrStatus": 4357,
        "PYInitial": "",
        "PYQuanPin": "",
        "RemarkPYInitial": "",
        "RemarkPYQuanPin": "",
        "MemberStatus": 0,
        "DisplayName": "",
        "KeyWord": ""
        }
        ,{
        "Uin": 2684027137,
        "UserName": "@31908794c3035a00b386bc9ef0526ee8d95b3c426d53fb4f9466b67d7a0b5fef",
        "NickName": "狂风落尽深红色绿树成荫子满枝",
        "AttrStatus": 131169,
        "PYInitial": "",
        "PYQuanPin": "",
        "RemarkPYInitial": "",
        "RemarkPYQuanPin": "",
        "MemberStatus": 0,
        "DisplayName": "",
        "KeyWord": ""
        }
    ],
    "HideInputBarFlag": 0,
    "Signature": "",
    "VerifyFlag": 0,
    "RemarkName": "",
    "Statues": 1,
    "AttrStatus": 0,
    "Province": "",
    "City": "",
    "SnsFlag": 0,
    "KeyWord": ""
    }

一旦ModContactList中有内容，则更新本地联系人缓存。

这里只就文本消息进行了举例。实际上web微信有多种格式消息的支持。参见附录。

### 总结:一图胜千言

![web微信概览](http://img.vim-cn.com/dd/e58f9f5ba7b24544e9b00d4ad9b2005e78c18c.svg)

整个流程如图所示。

我们应该注意到几点：

*   首先，有三个服务器：第一个用来认证，返回一个ticket，并且检查ticket和uuid是否对应。第二个服务器负责登录、保持会话、更新消息、执行功能。第三个服务器仅仅保持长连接，我猜因为服务器端一直保持着每个用户的长连接来轮询，这种耗费资源的事情也确实应该分离出单独的服务器。
*   其次，js代码都是单线程的，客户端通过保持synccheck长连接来接收服务器端的消息，并在更新状态后继续synccheck。
*   最后，注意Synckey所起的作用，通过synckey的更新服务器知道客户端已经收到了哪些消息。

## 实现：又一个机器人——wechat-user-bot

在nodejs中我们可以实现完整的web微信功能。我准备做个机器人，

一方面，作为将来某系统的一部分。  
另一方面，greathoul曾经说过有些人有需求来管理微信群  
最主要的，for fun。

### 流程控制

目标：在NodeJS中模拟上述流程

#### 流程概要

正如上一章节所述。整个流程可以简化为。

```
               /----用户操作
               |
登录认证-->长连接-->更新-\
               |         |
               \---------/
```

只是对机器人来说，用户操作由机器人自动实现。

在功能上，我们的机器人目前只完成了信息记录和聊天的功能。

因为整个应用是对以上web微信模型的反应，是在无数http请求之上架构而成。  
因此，了解javascript中的流程控制方式才能与异步程序谈笑风生，所以，先概览一下js中的流程控制。

#### Javascript中的流程控制

Javascript社区有四种驯服事件驱动异步编程的实践:

*   callback
*   Promise
*   Promise + Generator
*   Async

##### 回调地狱(Callback Hell)

假设你要运行一个任务管理器  
输入id后，需要依次 _执行_ 针对id的task1, task2, task3, task4…  
在js这种异步语言里会是这样…

```javascript
function taskRunner(id) {
  task1(id, function(id){
    task2(id, function(id){
      task3(id, function(id){
        task4(id, function(id){
          ...// callback hell
        })
      })
    })
  })
}
```

what a hell. 更糟糕的是，如果其中某个任务出错了，我怎么知道哪里出错了？

```javascript
function asyncOperation() {
  setTimeout(function() {
    throw new Error("MyError!");
  }, 1000);
}

try { 
  asyncOperation();
} catch (e) {
  console.log("I cannot catch : ", e);
}
```

try和catch 没有用？并不能捕获错误。那么…只能在异步回调里使用try。

```javascript
function asyncOperation() {
  setTimeout(function() {
    try {
      throw new Error("Error");
    } catch(e) {
      console.log("asyncOperation catch it: ", e.message);
    }
  }, 1000);
}

function run() {
  try { 
    asyncOperation();
  } catch (e) {
    console.log("I got no error", e);
  }
}
```

好吧，调用者又不能捕获错误了。run调用者怎么能知道发生了什么可呢。接下来其他函数怎么知道发生了什么？

Nodejs社区采用一种error first的调用惯例。下一个回调可以收到err，判断，作出动作。但想象一下

```javascript
function taskRunner(id) {
  task1(id, function(err, task1Output){
    if (err) handleError(err);
    doSomething(task1Output);
    task2(task1Output, function(err, res){
      if (err) handleError(err);
      task3(id, function(err){
        if (err) handleError(err);
        task4(id, function(err){
          if (err) handleError(err);
          ...// callback hell
        })
      })
    })
  })
}
```

看起来不好看是一回事。

如果doSomething出错了，错误如何捕获？

```javascript
function taskRunner(id) {
  task1(id, function(err, task1Output){
    if (err) handleError(err);
    try {
      doSomething(task1Output);
    } catch(e) {
      handleError(e);
    }
    task2(task1Output, function(err, res){
      if (err) handleError(err);
      task3(id, function(){
        if (err) handleError(err);
        task4(id, function(){
          if (err) handleError(err);
          ...// callback hell
        })
      })
    })
  })
}
```

再如果对handleError想做出错处理，再如果我们在流程中嵌入了更多的同步和异步混用的代码，他们都要处理错误…What the fuck…

再也不想看这样的代码。我们的大脑并不能很好的切合这种模式。而且，如果在task3和task4之间我想加入一个task5…考虑下你的当你想git blame…  
也许把函数分离出来会好很多, 但我感觉好不到哪里。

##### 超简Promise实现

我们想写这样的代码…

```javascript
task1().then(task2).then(task3)...
```

我们想做这样的错误处理

```javascript
task1().then(task2, handleError).then(task3, handleError)...
// or
task1().then(task2).then(task3)....then(taskN).catch(handleError);
```

他们创造了Promise，一个许诺，一个代表未来的值。

一个一秒后才到来的事物。

一个神奇的设计, Promise几个标准规定了挺多，哦，也不多。不过我觉得核心的就三点:

1.  thenable
2.  状态与缓存
3.  能串行(Promise链)

我们可以试着实现一个，实际Promise规范并没有规定实现方法，应该有很多实现方法。我们的方法是：

*   同一个Promise可以用then注册多个回调，推入dfs中最后依次触发。
*   then返回一个Promise实现串行，而这个Promise将接下来要then的回调注册到自己的dfs中，一旦触发则调用自己的resolve函数将返回值喂给下一个then注册的回调函数。
*   resolve的延迟通过process.nextTick或者setTimeout(fn, 0)实现。

```javascript
function Promise(f) {
  var cache;  // 未来的 值
  var dfs = []; // Promise链上Defferds链, deferds保存当前回调callback, 如果值到来了，传给桥Promise的resolve
  // 如果没解析，则添加到defferd链上，如果解析了，则调用df链上所有回调
  var status = "pending";

  this.then = function(callback) {
    return new Promise(function(resolve) {
      handle({
        callback: callback,
        resolve: resolve
      })
    })
  }

  function handle(df) {
    if (status == "pending") {
      dfs.push(df);
    } else if (status == "fulfiled") {
      var ret = df.callback(cache);
      df.resolve(ret);
    }
  }

  function resolve(value) {
    cache = value;
    status = "fulfiled";
    process.nextTick(()=> {
      dfs.forEach(function(df) {
        handle(df);
      })
    })
  }

  f(resolve);
}


var p1 = new Promise(function(resolve, reject){
  setTimeout(function() {
    resolve(15);
  }, 1000);
});

p1.then(function(value){
  console.log("task 1", value); 
  return value + 1;
}).then(function(value){
  console.log("task 2", value);
})
```

当然，还有个处理reject的部分，类似如此实现错误的“冒泡”。

对了，如果对new操作符有疑问, `new` 之后新的对象引用的闭包变量并不是函数中的变量，好奇怪。`new` _并不_ 创建闭包。

```javascript
function f(){
  var a = 1;
  this.then = function(t){a = t};
  this.print=function(){console.log(a)}}
undefined
> x = new f()
f { then: [Function], print: [Function] }
> y = new f()
f { then: [Function], print: [Function] }
> x.then(5)
undefined
> x.print()
5
undefined
> y.print()
1
undefined
```

好了，我们已经能够通过Promise成功实现异步串行。然而，还是有哪里不对劲的样子。Promise只能传递单一的值，Promise的语法非常繁复，Promise无法取消，没法用优雅的方式查看Promise链的状态。  
详细可以看看[YDKJS](https://github.com/getify/You-Dont-Know-JS)。但我们能以更优雅的方式实现异步程序的编写和维护，处理错误，知道异步程序只被执行了一次等等。

##### 超简Promise+Generator

后来，generator出现了，本来这玩意儿只是设计来循环。然而，yield能双向通信暂停程序却在同一个函数作用域的神奇属性被用来结合Promise做起了流程控制。想象一下

iterator可以yield出Promise，Promise resolve后可以将异步操作的结果返回iterator。

假设我们啊，有个社工库，我们根据id能获取其中的用户名和密码。这是什么例子。。。  
考虑以下逻辑…

```javascript
function getInfo(id) {
  return getUser(id).then(function(username) {
    return getPass(username).then(function(password){
      return {username: username, password: password}
    })
  })
}
```

我们倒是想这样, 让user和name获取并行

```javascript
function *getInfo(id) {
  var user = getUser(id);
  var pass = getPass(user);
  console.log("trying: ", yield user, yield pass);  // 同时yield
}

function getUser(id) {
  console.log("get username");
  return new Promise(function(resolve, reject) {
    setTimeout(function(){
      resolve("name-" + id);
    }, 1000);
  })
}

function getPass(username) {
  console.log("get password");
  return new Promise(function(resolve, reject) {
    setTimeout(function(){
      resolve("@us3r-");
    }, 1000);
  })
}
```

我们实现个async函数来帮助我们完成繁复的Promise+generator过程(似乎也是简化的co)。

```javascript
function async(g) {
  return function() {
    var it = g.apply(this, arguments);

    function handle(result) {
      if (result.done)
        return result.value;
      return result.value.then(function(res) {
        return handle(it.next(res))
      })
    }
    return handle(it.next())
  }
}

var find = async(getInfo);
find("reverland");
```

就这么并行了。

还可以串行

```javascript
function *taskRunner(id) {
  var task1Output = yield getUser(id);
  var task2Output = yield getPass(task1Output);
  console.log("trying: ", task2Output);
}
```

##### Async/Await

ES7中吸收了C#中async和await关键字，这样能更加优雅的书写和维护异步程序。

```javascript
async function taskRunner(id) {
  var user = await getUser(id);
  var pass = await getPass(user);
  console.log(user, pass);
}
```

然而你需要一个编译器将ES7的代码编译成当前可执行的代码。

##### 总结

从回调到async await经历了漫长的道路。

其中，EventEmitter（观察者模式）也被用来进行异步程序的流程控制，回调注入(比如async库，如果我没理解错的话)也被用来进行流程控制。都一定程度解决了一定的问题。能力有限，不讨论了，  
《深入浅出NodeJS》里有精彩解说。

#### WechatUserBot

[wechat-user-bot on github](https://github.com/HalfdogStudio/wechat-user-bot)

![wechat-user-bot架构](http://img.vim-cn.com/29/f41ad0c325dec0de4b62c7c0184a9b72619704.svg)

微信机器人，使用Promise技术将web微信模型映射到程序世界。实际上，流程清晰之后，模型明了之后，用什么方式实现都不那么重要。  
我提到Promise，因为希望各位看官能理解wechat user bot是如何在其基础上实现了上述模型，希望来自其它语言的看客们也能够理解Promise冗余的语法下究竟是什么。但既然谈到Promise，就把整个流程控制一并提及。

NodeJS环境中提供的网络请求、文件系统等功能也为机器人的实现提供了基础。最最开始使用Node核心模块https模块来处理网络请求，手工管理cookie，后来使用request替换。

造轮子能加深你对系统的理解，而用现成的库当然好啊。

好了，以上是概述。

我就目前的设计来描述下这个微信机器人具体实现。代码组织可能会变，但本质上没什么大变。  
变化是没有终点的，我觉得现在值得一记和参考。

##### 入口程序

`index.js`: 主执行程序，仅仅引入网络请求的各个函数。

getUUID是一个Promise，注册的所有函数都返回Promise。整个控制通过Promise链实现。  
Promise链传递的obj参数，来实现各个过程的资源传递或共享。

```javascript
getUUID.
  then(checkAndParseUUID).
  then(showQRImage).
  then(checkLogin).
  then(parseRedirectUrl).
  then(login).
  then(getbaseRequest).
  then(webwxinit).
  then(getContact).
  then(robot).
  catch((e)=>{
    console.error(e);
    process.exit(1);
  });
```

##### web微信请求相关函数

`webwx.js`: 保存各个请求的函数，请求函数都封装为一个Promise，  
这些函数大多都修改或使用obj，并将obj在其间传递。比如获取联系人信息的`getContact`

```javascript
function getContact(obj) {
  console.log("初始化成功，获取联系人...")
  return new Promise((resolve, reject)=> {
    var skey = obj.BaseRequest.Skey;
    var pass_ticket = obj.pass_ticket;
    var timestamp = Date.now();
    var options = {
      baseUrl: 'https://wx.qq.com',
      uri: `/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=en_US&pass_ticket=${pass_ticket}&skey=${skey}&seq=0&r=${timestamp}`,
      method: 'GET',
      json: true,
      jar: true,
    }
    request(options, (error, response, body)=>{
      obj.memberList = body.MemberList;
      resolve(obj);
    });
  });
}
```

似乎很长的样子，然而实际上就是从obj中取出需要使用和传递的，把得到的需要保存的信息写入obj对象。  
并将obj传给下一个then函数注册的回调函数。

这个文件中放了一个叫robot的特殊函数。  
用递归的方式来实现synccheck-webwxsync-webwxsendmsg的循环。

```javascript
function robot(obj) {
  synccheck(obj).
    then(webwxsync).
    then(botSpeak).then(robot).
    catch(console.error);
}
```

而webwxsync和botSpeak分别对应消息的收发两个部分。

这两个函数实现批量收发信息。

botSpeak中，将obj.MsgToUserAndSend中打包放入的收信用户名和消息列表全部发送出去。

```javascript
// function botSpeak
    obj.MsgToUserAndSend.map((msgBundle)=>{
      var msgId = (Date.now() + Math.random().toFixed(3)).replace('.', '');
      var postData = {
        BaseRequest: obj.BaseRequest,
        Msg: {
          "Type": 1,
          "Content": msgBundle.Msg,
          "FromUserName": obj.username,
          "ToUserName": msgBundle.User,
          "LocalID": msgId,
          "ClientMsgId": msgId}
      };
      var options = {
        baseUrl: 'https://wx.qq.com',
        uri: `/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=en_US&pass_ticket=${pass_ticket}`,
        method: 'POST',
        jar: true,
        json: true,
        body: postData,
      };

      request(options, (error, response, body)=>{
        console.log("[机器人回复]", msgBundle.Msg);
      })
    });
```

而在webwxsync时，则设计了一种过滤和批量处理机制。这个机制将调用其它函数实现了信息记录和在obj.MsgToUserAndSend列表中推入待发送的  
用户名和信息打包数据。

```javascript
// function webwxsync
      //body.AddMsgList中是新信息列表
      var replys = body.AddMsgList.
        filter(o=>(o.ToUserName === obj.username)). // 过滤不是给我的信息
        filter(o=>(SPECIAL_USERS.indexOf(o.FromUserName) < 0)). // 不是特殊用户
        filter(o=>true).    // 用户定义黑白名单

        map(wechatLogger(obj)).     // 日志
        map(generateReplys(obj));   // 回复

      // 所有回复或处理消息都完成后
      Promise.all(replys).then(()=>{
        resolve(obj);   // 在回调中控制权交给botSpeak
      });

      // 更新联系人如果有的话
      cacheContact(body.ModContactList, obj);
```

以一种函数式的抽象方式实现消息的过滤、和批量处理（记录或者回复）。

其实更进一步，把这部分从该函数中分离出来。能设计出更好的接口，  
比如将这些过滤函数和批量处理函数列表以参数传递，动态加载。准备下一步就这么实现。

像wechatLogger这种函数可以充分利用Javascript的高阶函数特性，实现偏函数。  
包括上面的过滤函数其实也应该这么实现，以通用方式获取和使用obj对象。显然这些过滤函数只需要obj和o（批量处理时的单个项目）

wechatLogger实现如下

##### 消息记录函数

logger函数是一个返回函数的函数。

```javascript
function wechatLogger(obj) {
  return o=>{
    // 对没一条MsgAddList对象o
    switch (o.MsgType) {
        case MSGTYPE_TEXT:
            logTextMessage(o, obj)
            break;
        default:
            logNotImplementMsg(o, obj);
    }
    return o;
  }
}
```

另外，把处理不同信息类型的处理逻辑分散到其它函数中，通过这种抽象留下更易于理解和维护的程序。

记录消息时，可能要解析用户名。这个来自缓存，也许不是你的微信好友而本地缓存没有就需要向服务器请求  
查询昵称信息(webwxbatchgetcontact)。具体方法正如第一部分对微信协议分析所示。

另一方面，群信息和个人信息的差别也需要区别处理。

由于群信息和个人信息的区别，需要分别做处理。

##### 消息回复函数

generateReplys类似wechatLogger是一个返回函数的函数，用来批量生成对应回复信息

```javascript
function generateReplys(obj) {
  return o=>{
    var replys;
    switch (o.MsgType) {
        case MSGTYPE_TEXT:
            replys = generateTextMessage(o, obj);
            break;
        default:
            generateNotImplementMsg(o, obj);
    }
    return replys;
  }
}

function generateTextMessage(o, obj, resolve, reject) {
  var ps = [];

  if (o.FromUserName.startsWith("@@") && (o.Content.includes("@" + obj.nickname))) {
    // FIXME: 用户名解析
    o.Content = o.Content.replace(/@[^:]+:<br\/>/g, '');
    // FIXME: at 我, 在Username NickName和群的displayName里
    // FIXME: 正则escape
    o.Content = o.Content.replace(new RegExp('@' + obj.nickname), '喂, ');
  } else if (o.FromUserName.startsWith("@@")) {
    // 其他群信息则不回复
    return;
  }
  // 过滤换行符号
  o.Content = o.Content.replace(/<\s*br\s*\/?\s*>/g, '\n');
  // FIXME: 表情符号修正

  // 回复
  var username = o.FromUserName;  // 闭包,防止串号，血泪教训
  var replyPromise = reply(o.Content, o.FromUserName);
  replyPromise.then(rep=>{
    obj.MsgToUserAndSend.push({
      User: username,
      Msg: "bot>" + rep,
    });
  });
  ps.push(replyPromise);
}
```

当然，具体回复信息的生成分离到generateTextMessage里，生成的信息和回复用户名将一起打包推入obj.MsgToUserAndSend中(防止异步程序出现消息和人对应出错的问题)。  
webwxsync中要等着这次所有回复信息都生成后再执行botSpeak进行消息发送。

注意：我觉得这里不是什么好的处理方式，但它确实works well now.

##### 对话引擎

如上所见，回复信息是reply生成的，reply接受两个参数(收到消息的内容和消息来源用户名)。这个设计将保存处理对话上下文的任务交给了reply函数。

reply函数就是我们真正的对话引擎。我们给他提问和我们的身份，它回复对话引擎的返回。

dialog.js中实现了好几个对话引擎，你可以使用最简单的echo函数

```javascript
function echo(content) {
  return Promise.resolve(content);
}
```

它仅仅返回对话者的给出的消息，我们返回一个代表这个返回消息的Promise。  
因为，可能你使用第三方的对话机器人，而第三方的服务需要一个异步http请求。比如图灵机器人

```javascript
function turingRobot(content, userid) {
  content = content.replace(/^[^:]+:<br\/>/m, "");
  return new Promise((resolve, reject)=> {
    var url = `http://www.tuling123.com/openapi/api`
    request.get(
      url,
      {
        qs: {
          key: apikeys.turingRobotApiKey,
          info: content,
          userid: userid.slice(0, 32),
        },
        json: true,
      },
      (error, response, body)=>{
        if (error || !body) {
          reject(error?error:"turing robot return no body");
        }
        //debug("in turing machine: " + inspect(body))
        try {
          body.text = body.text.replace(/<\s*br\s*\/?\s*>/g, '\n');
          if (body.code == 100000) {
            resolve(body.text);
          } else if (body.code == 200000) {
            resolve(body.text + ": " + body.url);
          } else if (body.code == 302000) {
            resolve(body.list.map(n=>n.article + ": " + n.detailurl).join('\n'));
          } else if (body.code == 308000) {
            resolve(body.text + '\n' + body.list.map(n=>n.name + ": " + n.info + "<" + n.detailurl + ">").join('\n'));
          } else {
            reject(body.code + body.text);
          } 
        } catch(e) {
          reject(e);
        }
      });
  });
}
```

别忘了填入你自己申请的apikey。

事实上，你可以自己实现成语接龙问答机器人，膜蛤机器人，消息中转机器人……

有人可能奇怪magic目录下是什么东西，瞎逼编概率模型的中文magic对话引擎= =，我会慢慢把它清理出这个项目。

##### 更新本地缓存信息函数

记录消息一个很重要的问题是解析用户名，群聊名。因为web微信给你的只是一堆`@@xxxxxxxxx`这种东西。

我们在getContact时可以获取好友联系人，但不能获得群信息。因此，需要在收到新消息时能对任何不在  
本地联系人信息列表中的人或群聊进行信息请求(batchgetcontact).

当然，最好是缓存起来而不是每次都请求。

哦，我发现目前代码组织的不是很合适。

总之，两个地方需要更新本地缓存。

1.  请求到不在本地缓存中联系人时(batchgetcontact)
2.  在收到联系人更改信息时(webwxsync时检查modContactList)

这两部分分布在logger.js和cache.js中。

前者对个人和群聊又做了不同处理。在处理收到的消息时判断是否请求、更新本地缓存等

后者根据联系人信息更新列表直接更新本地缓存。

注意：好友联系人用户为了和http response一致而不做过多处理，写了很多循环。  
而群聊信息的缓存为了便于查找用户名又设计为Object保存。这种分离也有合适的地方，  
因为群中个人信息也未必是作为联系人的信息(比如群昵称)。  
但考虑使用列表和高阶函数特性来抽象和重构群信息缓存部分。

##### 其它

一些常量定义，比如要过滤的特殊用户列表，信息种类常量等等, 分离到global.js中。

##### 总结

说是总结，只是一些想法。我是傻逼，有信口雌黄的地方，请各位教我做人。

*   函数式的js大法好！
*   sicp大法好
*   异步大法好
*   Promise大法好
*   http大法好

### 实现微信机器人FAQ

*   如果我实现的机器人出现多次回复同一条消息是怎么回事？

请认真理解synckey的作用和synccheck的意义。

*   如果出现回复串号是怎么回事？

可能由于Js的异步造成有些东西不是按你想的顺序进入发送队列的，也可能由于异步你被js的闭包作用域坑了。

### 附录

#### AngularJS web微信客户端

请使用firefox（当然chromium都行）访问web 微信页面，ctrl-alt-i打开开发者工具，  
选择debugger一栏，找到你觉得是webwxapp的那个js文件(可能是webwxApp2aeaf2.js)，点击`{}`按钮美化压缩后的代码。

#### API一览

    API_webwxdownloadmedia: 'https://' + o + '/cgi-bin/mmwebwx-bin/webwxgetmedia',
    API_webwxuploadmedia: 'https://' + o + '/cgi-bin/mmwebwx-bin/webwxuploadmedia',
    API_webwxpreview: '/cgi-bin/mmwebwx-bin/webwxpreview',
    API_webwxinit: '/cgi-bin/mmwebwx-bin/webwxinit?r=' + ~new Date,
    API_webwxgetcontact: '/cgi-bin/mmwebwx-bin/webwxgetcontact',
    API_webwxsync: '/cgi-bin/mmwebwx-bin/webwxsync',
    API_webwxbatchgetcontact: '/cgi-bin/mmwebwx-bin/webwxbatchgetcontact',
    API_webwxgeticon: '/cgi-bin/mmwebwx-bin/webwxgeticon',
    API_webwxsendmsg: '/cgi-bin/mmwebwx-bin/webwxsendmsg',
    API_webwxsendmsgimg: '/cgi-bin/mmwebwx-bin/webwxsendmsgimg',
    API_webwxsendemoticon: '/cgi-bin/mmwebwx-bin/webwxsendemoticon',
    API_webwxsendappmsg: '/cgi-bin/mmwebwx-bin/webwxsendappmsg',
    API_webwxgetheadimg: '/cgi-bin/mmwebwx-bin/webwxgetheadimg',
    API_webwxgetmsgimg: '/cgi-bin/mmwebwx-bin/webwxgetmsgimg',
    API_webwxgetmedia: '/cgi-bin/mmwebwx-bin/webwxgetmedia',
    API_webwxgetvideo: '/cgi-bin/mmwebwx-bin/webwxgetvideo',
    API_webwxlogout: '/cgi-bin/mmwebwx-bin/webwxlogout',
    API_webwxgetvoice: '/cgi-bin/mmwebwx-bin/webwxgetvoice',
    API_webwxupdatechatroom: '/cgi-bin/mmwebwx-bin/webwxupdatechatroom',
    API_webwxcreatechatroom: '/cgi-bin/mmwebwx-bin/webwxcreatechatroom',
    API_webwxstatusnotify: '/cgi-bin/mmwebwx-bin/webwxstatusnotify',
    API_webwxcheckurl: '/cgi-bin/mmwebwx-bin/webwxcheckurl',
    API_webwxverifyuser: '/cgi-bin/mmwebwx-bin/webwxverifyuser',
    API_webwxfeedback: '/cgi-bin/mmwebwx-bin/webwxsendfeedback',
    API_webwxreport: '/cgi-bin/mmwebwx-bin/webwxstatreport',
    API_webwxsearch: '/cgi-bin/mmwebwx-bin/webwxsearchcontact',
    API_webwxoplog: '/cgi-bin/mmwebwx-bin/webwxoplog'

#### 消息类型

上述webwxsync获得的AddMsgList中可能收到的各种信息。详细的信息种类列表可以参见webwx的angularjs源码。

    MSGTYPE_TEXT: 1,
    MSGTYPE_IMAGE: 3,
    MSGTYPE_VOICE: 34,
    MSGTYPE_VIDEO: 43,
    MSGTYPE_MICROVIDEO: 62,
    MSGTYPE_EMOTICON: 47,
    MSGTYPE_APP: 49,
    MSGTYPE_VOIPMSG: 50,
    MSGTYPE_VOIPNOTIFY: 52,
    MSGTYPE_VOIPINVITE: 53,
    MSGTYPE_LOCATION: 48,
    MSGTYPE_STATUSNOTIFY: 51,
    MSGTYPE_SYSNOTICE: 9999,
    MSGTYPE_POSSIBLEFRIEND_MSG: 40,
    MSGTYPE_VERIFYMSG: 37,
    MSGTYPE_SHARECARD: 42,
    MSGTYPE_SYS: 10000,
    MSGTYPE_RECALLED: 10002,  // 撤销消息

不同的消息类型有不同的作用和处理方式。web微信的功能包含表情、图像消息

#### 不同的web微信域名

微信一路发展，结果有些现在看上去难以理解的东西。早期的微信用户可以直接通过qq注册，而现在已经不行。

对此，web微信竟然采取了不同的域名来兼容各种用户。

```javascript
...
// 3105行左右
function () {
  var e = location.host,
  t = 'weixin.qq.com',
  o = 'file.wx.qq.com',
  n = 'webpush.weixin.qq.com';
  e.indexOf('wx2.qq.com') > - 1 ? (t = 'weixin.qq.com', o = 'file2.wx.qq.com', n = 'webpush2.weixin.qq.com')  : e.indexOf('qq.com') > - 1 ? (t = 'weixin.qq.com', o = 'file.wx.qq.com', n = 'webpush.weixin.qq.com')  : e.indexOf('web1.wechat.com') > - 1 ? (t = 'wechat.com', o = 'file1.wechat.com', n = 'webpush1.wechat.com')  : e.indexOf('web2.wechat.com') > - 1 ? (t = 'wechat.com', o = 'file2.wechat.com', n = 'webpush2.wechat.com')  : e.indexOf('wechat.com') > - 1 ? (t = 'wechat.com', o = 'file.wechat.com', n = 'webpush.wechat.com')  : e.indexOf('web1.wechatapp.com') > - 1 ? (t = 'wechatapp.com', o = 'file1.wechatapp.com', n = 'webpush1.wechatapp.com')  : (t = 'wechatapp.com', o = 'file.wechatapp.com', n = 'webpush.wechatapp.com');
...
```

一大堆域名。。不过似乎没有太大区别。非通过qq注册的微信用户使用wechat-user-bot暂时也没问题。

## 参考资料

*   [Who Add “_” Single Underscore Query Parameter?](http://stackoverflow.com/questions/3687729/who-add-single-underscore-query-parameter)
*   [微信协议简单调研笔记](http://www.blogjava.net/yongboy/archive/2014/03/05/410636.html)
*   [qwx by xiangzhai](https://github.com/xiangzhai/qwx)
*   [uproxy-wechat](https://github.com/LeMasque/uProxy_wechat/blob/master/wechat.js)

如果你喜欢python3 的asyncio

*   [wechat_robot with python 3.5 asyncio by lyyyuna](https://github.com/lyyyuna/wechat_robot)

如果你对微信机器人的作用感兴趣

*   [lu4kd0y开发的似乎是开发给微商用的微信云机器人(请自行判断安全性)](http://wxrobot.53ws.cn/logout)

## 2016.3.7更新

首先，lu4kd0y的微信云机器人开源了！！–> [微信云端机器人框架](https://github.com/lu4kyd0y/WeChat-Cloud-Robot)

其次，看到了更多优秀的关于web微信的hack

*   MaskRay的[wechatircd](https://github.com/MaskRay/wechatircd)
*   stonexer的[wechat4u](https://github.com/nodeWechat/wechat4u)和[wechatBot](https://github.com/stonexer/wechatBot)
*   feit的[WeixinBot](https://github.com/feit/Weixinbot)
*   还有geeeeeeek的[electronic-wechat](https://github.com/geeeeeeeeek/electronic-wechat)
*   Urinx的[WeixinBot](https://github.com/Urinx/WeixinBot)
*   某同学的userscript和chrome扩展

最后，昨天发现web微信更新了。
