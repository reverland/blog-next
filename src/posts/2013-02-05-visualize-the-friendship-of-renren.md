---
layout: post
title: "Python小练习：可视化人人好友关系"
excerpt: "A step-by-step tutorial on how to visualize your social network of Renren"
category: python
tags: [python, networkx, web]
disqus: true
---


# 可视化人人好友关系

---
**目录**

* toc 
{: toc}

---

受[R分析人人网好友推荐系统](http://cos.name/2011/04/exploring-renren-social-network/)和[用python进行人人好友分析](http://blog.csdn.net/lkkang/article/details/7362888)启发，完全用python的模块和方式实现了一遍，结果搞得好像一点也不Pythonic，倒好像有点继承了之前在lisp下养成的函数式风格……

作为菜鸟深知代码写得不怎么样，写在这里，希望没什么基础的人都能体会到其中我所感受到的乐趣*Happy hacking*，也欢迎各路高手大牛不吝赐教。

完整代码见[github/reverland/scripts/renren.py](https://github.com/reverland/scripts/blob/master/python/renren.py)

## 必要条件

**For Reader:**

读者需要有一定python基础，如果没有，不妨花半个小时看看[Python简明教程]()。

**For Computer:**

我在gentoo linux下完成所有的编写测试，也推荐想尝试的朋友选择linux环境。不过只是推荐，python作为著名的跨平台语言，其代码可以没什么差别的运行在各个平台上，但你需要以下一些必备的东西：

- python 2.7 也许2.5也行，cookielib之前好像不在标准库中，而python3中则有改动。
- networkx 一个分析，操作，绘制网络的python模块。
- matplotlib 经常用来绘图的python模块

怎么安装请自行参照官方网站说明。对后两个模块，建议使用pip安装，这货就相当于个包管理器(一条命令完成搜索下载安装所有操作并自动处理所有依赖)。

最后，还有可选的开发环境：ipython，该程序提供一个功能强大的交互环境，很方便做测试调试探索各种 _一次性_ 工作。

## 我们要做些什么

从人人网上抓取好友，绘制好友之间的关系图，还可以供进一步分析(貌似没什么好分析的)。

为了实现这点我们需要做到以下几个工作：

- 模拟登录[^1]
- 提取数据以合适数据结构保存
- 制作图像并绘制

### 模拟登录

人人的模拟登录还是比较简单的。模拟登录最困难的部分就是对要登录网站登录过程的分析。通常办法是通过抓包，用wireshark总有种杀鸡用牛刀的感觉，而且当你像作者一样天天用socks代理时会发现什么也抓不到……所以IE/Chrome/Firefox的开发工具可能更合适。这里用firebug，你可以在火狐扩展中心找到并安装它。

![人人登录分析](http://fmn.rrfmn.com/fmn058/20130207/1135/large_ljoh_1281000032cc125c.jpg)

然后在抓包过程中找到用户名[^2]和登录时请求的服务器。

不过，之前有很多人已经分析过人人的登录过程(一般不会要求验证码，除非登录过于频繁)。你所必须要做的基本上只有两件事：

- 将用户名和密码POST到服务器
- 处理cookie

模拟登录的工具使用python的标准库中的`urllib`,`urllib2`和`cookielib`即可

```python
import urllib
import urllib2
import cookielib
```

如果对这三个标准库不熟悉，建议花时间看看下面两篇教程。不过也许无所谓，代码可以自己解释自己:p。

- [urllib2 the missing manual](http://www.voidspace.org.uk/python/articles/urllib2.shtml)
- [cookielib](http://www.voidspace.org.uk/python/articles/cookielib.shtml)

当浏览器使用POST方法请求服务器时，它将参数经过编码附加到url后传递过去:

    http://www.renren.com/ajaxLogin/login&email=username&password=blablabla

登录成功后，还要获取人人中用来作为用户唯一标识额uid(打开人人主页注意url就看到了)并返回，以供将来使用。将来所有的抓取都通过独一无二的uid而非可能重名的姓名。

使用正则抓去uid
    
    import re

我们先写登录函数：

```python
def login(username, password):
    """log in and return uid"""
    logpage = "http://www.renren.com/ajaxLogin/login"
    data = {'email': username, 'password': password}
    login_data = urllib.urlencode(data)
    cj = cookielib.CookieJar()
    opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
    urllib2.install_opener(opener)
    res = opener.open(logpage, login_data)
    print "Login now ..."
    html = res.read()
    #print html

    # Get uid
    print "Getting user id of you now"
    res = urllib2.urlopen("http://www.renren.com/home")
    html = res.read()
    # print html
    uid = re.search("'ruid':'(\d+)'", html).group(1)
    # print uid
    print "Login and got uid successfully"
    return uid
```

不妨在ipython中先测试下。

### 抓取数据

每个人的好友都可以从页面`http://friend.renren.com/GetFriendList.do?curpage=0&id=uid`获取，虽然人人已经改版，但这个页面还能用。其中curpage参数的值是页码，id参数的值是拟抓取对象的用户ID。通过循环抓取所有好友并以用户id为键姓名为值保存为字典。

```python
def getfriends(uid):
    """Get the uid's friends and return the dict with uid as key,name as value."""
    print "Get %s 's friend list" % str(uid)
    pagenum = 0
    dict1 = {}
    while True:
        targetpage = "http://friend.renren.com/GetFriendList.do?curpage=" + str(pagenum) + "&id=" + str(uid)
        res = urllib2.urlopen(targetpage)
        html = res.read()

        pattern = '<a href="http://www\.renren\.com/profile\.do\?id=(\d+)"><img src="[\S]*" alt="[\S]*[\s]\((.*)\)" />'

        m = re.findall(pattern, html)
        #print len(m)
        if len(m) == 0:
            break
        for i in range(0, len(m)):
            no = m[i][0]
            uname = m[i][1]
            #print uname, no
            dict1[no] = uname
        pagenum += 1
    print "Got %s 's friends list successfully." % str(uid)
    return dict1
```

我们再写个获取好友关系字典的函数，为了避免我们每次为了获取字典都要登录抓取。

```python
def getdict(uid):
    """cache dict of uid in the disk."""
    try:
        with open(str(uid) + '.txt', 'r') as f:
            dict_uid = p.load(f)
    except:
        with open(str(uid) + '.txt', 'w') as f:
            p.dump(getfriends(uid), f)
        dict_uid = getdict(uid)
    return dict_uid
```

我们还需要一个用来判断两个人关系的函数，来判断我们好友之间的关系。

```python
def getrelations(uid1, uid2):
    """receive two user id, If they are friends, return 1, otherwise 0."""
    dict_uid1 = getdict(uid1)
    if uid2 in dict_uid1:
        return 1
    else:
        return 0
```

### 绘制图像

利用以上函数判断好友关系并通过networkx创建一个相应的网络。

```python
def getgraph(username, password):
    """Get the Graph Object and return it.
    You must specify a Chinese font such as `SimHei` in ~/.matplotlib/matplotlibrc"""
    uid = login(username, password)
    dict_root = getdict(uid)  # Get root tree

    G = nx.Graph()  # Create a Graph object
    for uid1, uname1 in dict_root.items():
        # Encode Chinese characters for matplotlib **IMPORTANT**
        # if you want to draw Chinese labels,
        uname1 = unicode(uname1, 'utf8')
        G.add_node(uname1)
        for uid2, uname2 in dict_root.items():
            uname2 = unicode(uname2, 'utf8')
            # Not necessary for networkx
            if uid2 == uid1:
                continue
            if getrelations(uid1, uid2):
                G.add_edge(uname1, uname2)

    return G
```

最后是绘图函数，有很多控制图像输出的参数，可能多次调整才会得到想要的图像。在matplotlib画出的图像在窗口中也可以放大缩小选取适当范围。

```python
def draw_graph(username, password, filename='graph.txt', label_flag=True, remove_isolated=True, different_size=True, iso_level=10, node_size=40):
    """Reading data from file and draw the graph.If not exists, create the file and re-scratch data from net"""
    print "Generating graph..."
    try:
        with open(filename, 'r') as f:
            G = p.load(f)
    except:
        G = getgraph(username, password)
        with open(filename, 'w') as f:
            p.dump(G, f)
    #nx.draw(G)
    # Judge whether remove the isolated point from graph
    if remove_isolated is True:
        H = nx.empty_graph()
        for SG in nx.connected_component_subgraphs(G):
            if SG.number_of_nodes() > iso_level:
                H = nx.union(SG, H)
        G = H
    # Ajust graph for better presentation
    if different_size is True:
        L = nx.degree(G)
        G.dot_size = {}
        for k, v in L.items():
            G.dot_size[k] = v
        node_size = [G.dot_size[v] * 10 for v in G]
    pos = nx.spring_layout(G, iterations=50)
    nx.draw_networkx_edges(G, pos, alpha=0.2)
    nx.draw_networkx_nodes(G, pos, node_size=node_size, node_color='r', alpha=0.3)
    # Judge whether shows label
    if label_flag is True:
        nx.draw_networkx_labels(G, pos, alpha=0.5)
    #nx.draw_graphviz(G)
    plt.show()

    return G

```

把以上函数写进一个文件比如说renren.py，在ipython中导入。

```python
In[1]: from renren import *

In[2]: username = yourusername

In[3]: password = yourpassword

In[4]: draw_graph(username, password)
```

![模糊化生成的好友关系图](http://fmn.xnpic.com/fmn057/20130207/1135/large_C753_44f6000032d8125d.jpg)

## 总结

通过图像你会发现。这些绘图软件的算法相当不错的，你会发现很明显的聚类，这一片是大学同学、这片是小学初中同学，旁边与之联系紧密的是高中同学，这一片孤立的是网友等等。

也许你还会发现你的某些好友竟然相互认识。

抓取下来的数据还可以留待其它研究

![又是横竖坐标都没的渣图](http://fmn.rrfmn.com/fmn059/20130207/1135/large_HiaW_1161000032c9125c.jpg)

你也许会发现有的好友和你的共同好友多得超乎他人，也许发现共同好友分布比较均匀

就这么多这么简单。

希望你也能体会到这个乐趣横生的过程，对我来说，探索和学习的过程是相当意趣盎然的，折腾出来还相当有成就感呢。

## What's more

如果你想让matplotlib显示中文，你需要修改matplotlibrc更改字体。但有一种更通用的办法可以不用修改配置文件。自行google。

ps:这回开高亮了，没感觉和不高亮有啥大区别。感觉还是vim中的高亮漂亮啊，哪天不用pygments直接用vim converto html = =

## FootNotes

[^1]:从来没用过api，搞不懂人人api，试着创建个应用Post过去结果认证失败，也没打算申请应用……总之不会搞= =
[^2]:在CSDN事发之后人人停止明文传送密码，可以在js文件中发现密码经过加密。以后有空再研究。
