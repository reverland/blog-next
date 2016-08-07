---
layout: post
title: "A Glance at D3.js"
excerpt: "d3学习笔记"
category: javascript
tags: [d3, visualization]
disqus: true
---


这几天，嗯，跟着[Dashing D3.js](https://www.dashingd3js.com/)把传说中的D3.js入了个门。

D3在创建基于浏览器的动态数据可视化并带交互真是方便。

## 从一无所知到数据绑定

### 为何数据可视化

- 一图胜千言，图形是直观的。
- 图形是简洁明了的表达方式
- 世界的数据量是巨大的，图形是好的分析和展示方式
- 数据是新的石油

### 为何选择D3.js

- D3.js 是基于数据操作文档的JavaScript库。D3帮助你使用HTML，SVG和CSS生动地展现数据。D3不需要你使用某个特定的框架，它的重点在于对主流浏览器的兼容，同时结合了强大的虚拟化组件，以数据驱动的方式去操作DOM。
- D3.js由Mike Bostock基于他在斯坦福可视化小组的工作开发，现由其所在的纽约时报赞助。很多贡献者参与到项目的开发，你可以在github上找到这个项目。
- D3.js是指Data Driven Documents。当你的网页想要和数据进行交互时，D3是个好的选择。
- D3.js被应用到web应用的前端，即用户交互部分。

### 数据可视化流程

Ben Fry数据可视化流程：

- 获取
- 解析
- 过滤
- 挖掘
- 呈现
- 提炼
- 交互

### 基本构建模块

- 现代浏览器
- HTML
- CSS
- Javascript
- DOM
- SVG
- Web Inspector

### D3第一步

- 在HTML文件中引用云端或本地js库
- 在Web Inspector控制台中测试

### 添加DOM元素

- `select`
- `append`

### 添加SVG元素

- js的分行特性
- `style`操作符
- 链式语法
- `select`可以被保存赋值

### 将数据绑定到DOM元素上

- `selectAll`
- `data`操作符
- 虚选择--[Thinking with Joins](http://bost.ocks.org/mike/join/)
- `enter`/`exit`/update
- 对虚选择的`append`
- `text`操作符
- 数据在`__data__`属性中

### 使用在DOM元素中的数据

- 向D3.js操作符参数传递函数，
- 函数第一个参数是`__data__`内容。

## 使用数据来可视化

### 基于数据创建SVG元素

- 创建SVG容器
- 创建形状元素，比如`circle`
- 将数据绑定到形状元素(基本靠虚选择完成)
- 使用`style`利用数据修饰SVG元素

### 使用SVG坐标空间

- 一图胜千言：

    ----------------------> x
    | o
    |
    |
    |
    |
    |
    |
    |
    |
    v y

- `append('svg')`作为坐标空间
- 在SVG坐标空间内放置SVG元素。`attr`
- 创建SVG元素放置SVG元素
- 将数据绑定到SVG元素上
- 利用绑定的数据改变SVG元素的位置
- 使用绑定的数据修饰SVG元素

### D3.js接受的数据结构

- `select`到的是数组
- D3可以加载外部资源，好多种类
- JSON(key一定是字符串)
- JSON数组

### 使用D3.js简化代码

- 将JSON对象绑定到`__data__`属性上
- 使用绑定的JSON对象变更SVG元素

### SVG基本形和D3.js

流程固定，设置svg容器，绑定数据，append形状元素，设置必要属性和样式。

- circle
- rect
- ellipse
- line
- polyline/polygon

### SVG Path和D3.js

- 一个用来画画的SVG内置语言
- 使用D3.js生成形状元素绘制程序(D3.js Path 数据生成器)

### 动态SVG坐标空间

论如何通过遍历所有数据找到图像边界。

### D3.js缩放

将某个Domain映射到一个Range上的对象/类/函数。

- `d3.scale.linear.domain([1,100]).range([0,1])`
- `d3.max`
- `d3.min`
- 还有些其它量化的和非量化的缩放。

### SVG Group元素和D3.js

- 可嵌套的`<g>`用来分组
- `transform`属性和从右到左执行各种tranforming(matrix/translate/scale/skewX/skewY)
- transform的转换是相对空间坐标的转换
- 使用D3.js来分组SVG元素(`append`)
- 使用D3.js来转换SVG元素(`attr`)

### SVG Text 元素

- `text`标签及属性, 比如`text-anchor`属性
- 使用D3.js创建Text元素，绑定数据，使用数据。

### SVG坐标轴元素

- D3的坐标轴组件，包括水平与竖直坐标轴线、刻度、合适的分隔空间等等。
- 坐标轴可以更清晰展现变量大小和关系
- 坐标轴的范围，是否反转、类型、单位等
- 生成D3.js坐标轴函数(`d3.svg.axis().scale($SCALE)`)
- 调用坐标轴函数(`var xAxisGroup = svgContainer.append("g").call($FUNCTION);`)生成坐标轴元素组。
- 最后创建坐标轴(最上层)

然后忽然没了？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？

准备继续看[Scott Murray的D3.js教程](http://alignedleft.com/tutorials/d3/)


