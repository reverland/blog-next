---
layout: post
title: "Evolving Game Once More"
excerpt: "生物模拟游戏，终端动画、div动画、canvas动画、webgl动画全系列实现"
category: javascript
tags: [javascript, webgl, canvas]
disqus: true
---

这里的第一篇文章标示的日期是2012年2月7日，到今天，眨眼间4年多过去了。没想到竟然断断续续写了四年。

感谢vimwiki，感谢jekyll，感谢hexo，感谢开源社区和贡献者们。

感谢bitbucket，感谢github，感谢gitcafe，感谢凤凰君曾经的嗯静态博客托管。

感谢每一个鼓励的朋友。

竟然四年了。去年想就这么算了吧，域名也没续费。结果服务商凤凰君给设置自动续费了，现在域名才继续能用。。

开始正题吧。

希望在这里写下的每篇文章，简单而快乐。

## A GAME

我编程的入门从一本叫Land of Lisp的书开始，这里给我揭开了web server的迷雾，揭开了socket的迷雾，揭开了svg的迷雾，甚至揭开了AI的迷雾。

这本书中有一个模拟自然界的小游戏[使用loop来进化](http://reverland.org/lisp/2012/05/06/using-loop-to-evolve/)。

一个非常简单但非常有意思的游戏，我还记得为了想要更大的世界，让cpu和io卡顿异常的记忆。

多年以后，看到有本叫eloquent javascript的书中有另外一个类似的例子[电子生命](http://eloquentjavascript.net/07_elife.html)。

我就想说这个游戏。

## 图形界面

感谢Marijn Haverbeke，面向对象带来了非常好的组件化效果，随便加个函数就实现了图形界面的变更。

我这里将实现4种界面：

*   terminal
*   dom
*   canvas
*   webGL

首先，world类的constructor需要根据准备画布，如果试canvas或者webgl还要做好调整和准备工作。

```javascript
/**
 * class World
 */
class World {
  constructor(map, legend, canvas, canvasLegend, size, flag) {
    this.grid = new Grid(map[0].length, map.length);
    this.legend = legend;
    if (canvas) {
      //canvas
      this._canvasLegend = canvasLegend;
      this._canvas = canvas;

      this._canvas.width = map[0].length * size;
      this._canvas.height = map.length * size;

      this._size = size;

      if (flag == 'dom') {
        this._canvas.style.width = this._canvas.width + 'px';
        this._canvas.style.height = this._canvas.height + 'px';
        this.draw = this.drawDom;
      } else if (flag == 'canvas') {
        this._ctx = canvas.getContext('2d');
        this.draw = this.drawCanvas;
      } else if (flag == 'webgl'){
        let gl = canvas.getContext('webgl');
        this._gl = gl;
        gl.clearColor(1, 1, 1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, this._canvas.width, this._canvas.height);

        let v = `
        //这部分是顶点着色器  
        attribute vec2 aVertexPosition;
        void main() {
            gl_Position = vec4(aVertexPosition, 0.0, 1.0);
        }
        `;

        let f = `
        //这部分是片段着色器  
        precision highp float;

        uniform vec4 uColor;

        void main() {
           gl_FragColor = uColor;
        }
        `;


        let vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, v);
        gl.compileShader(vs);

        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, f);
        gl.compileShader(fs);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        // debugging
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
          console.log(gl.getShaderInfoLog(vs));

        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
          console.log(gl.getShaderInfoLog(fs));

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
          console.log(gl.getProgramInfoLog(this.program));

        this.draw = this.drawWebGL;

        gl.useProgram(this.program);

      }
    } else if (canvasLegend) {
      this._canvasLegend = canvasLegend;
      this.draw = this.drawTerminal;
    }

    let self = this;
    map.forEach(((line, y) => {
      for (let x = 0; x < line.length; x++) {
        this.grid.set(new Vector(x, y),
                      elementFromChar(legend, line[x]));
      }
    }).bind(self));

    this._stastics = {};
    this.clearstastics();
  }
```

### Terminal Animation

最最早的时候，我当时在nodejs中实现了这个游戏，试图在终端中不断打印刷新来生成动画。

你知道的，终端的IO效率非常低，世界一大，非常之卡，那是第一个UI实现。一个古老的终端动画思路。

```javascript
drawTerminal() {
    process.stdout.clearScreenDown();
    let element
        let line = '';
    for (let y = 0; y < this.grid.height; y++) {
        for (let x = 0; x < this.grid.width; x++) {
            element = this.grid.get(new Vector(x, y));
            line += (charFromElement(element) || " ");
            if (x == this.grid.width-1) {
                line += '\n';
            }
        }
    }
    process.stdout.write(line);
    process.stdout.cursorTo(0, 0);
}
```

![Terminal Animation UI](http://img.vim-cn.com/b1/109b70f577066d82883688bef88cdb59d337b1.gif)

这不好看，我们希望是色彩鲜艳用户界面

```javascript
drawTerminal() {
  process.stdout.clearScreenDown();
  let line = '';
  for (let y = 0; y < this.grid.height; y++) {
    for (let x = 0; x < this.grid.width; x++) {
      let element = this.grid.get(new Vector(x, y));
      let color = this._canvasLegend[charFromElement(element)];
      if (!color) {
        line += "\x1b[107m \x1b[0m";
      } else {
        let colorC = terminalColors[color];
        line += (colorC + " " + "\x1b[0m");
      }
    }
    line += '\n';
  }
  process.stdout.write(line);
  process.stdout.cursorTo(0, 0);
}
```

![Terminal Animation UI colored](http://img.vim-cn.com/22/7fc0abccc74290dce1eb72a1bfba4f066f20c4.gif)

我们能实现的更漂亮，通过字体和颜色的搭配，但，我马上得去滑雪了，不试了。

聪明的我于是就把这个任务交给感兴趣的读者，如果有人实现了请联系我让我膜拜下。

### DOM Animation

然后嘛，就是DOM版本的了，Marijn Haverbeke给出了默认的draw实现。不过既然到了浏览器上，就可以画出些色彩花样。  
我们可以动态插入一些div并根据legend来附上色彩甚至图像。

实现起来也多样，可以不停操作DOM(下面的代码我没试过哈)

```javascript
drawDom() {
  this._canvas.innerHTML = '';
  for (let y = 0; y < this.grid.height; y++) {
    for (let x = 0; x < this.grid.width; x++) {
      element = this.grid.get(new Vector(x, y));
      let color = this._canvasLegend[charFromElement(element)];
      let e = document.createElement('div');
      e.style.width = size + 'px';
      e.style.height = size + 'px';
      e.style.backgroundColor = color;
      this._canvas.appendChild(e);
    }
  }
}
```

当然，也可以生成一堆html然后每次刷新只插入一次。妄图效率能高一些。

```javascript
drawDom() {
  let html = '';
  let size = this._size;
  this._canvas.innerHTML = '';
  for (let y = 0; y < this.grid.height; y++) {
    for (let x = 0; x < this.grid.width; x++) {
      let element = this.grid.get(new Vector(x, y));
      let color = this._canvasLegend[charFromElement(element)];
      html += `<div style='background-color:${color};width:${size}px;height:${size}px;float:left'></div>`
    }
  }
  this._canvas.innerHTML = html;
}
```

![DOM Animation UI](http://img.vim-cn.com/d1/05a775e6f58573966fa4693d21056d6ce133e6.gif)

聪明的我留给读者又一个练习，给每种单位一个图片，让最后渲染效果不是色块而是图片。

### Canvas Animation

接下来欢迎来到canvas的世界。

使用canvas很简单，准备画布，然后给出js指令告诉canvas如何绘图。

```javascript
drawCanvas() {
  let element;
  this._ctx.save();
  for (let y = 0; y < this.grid.height; y++) {
    for (let x = 0; x < this.grid.width; x++) {
      element = this.grid.get(new Vector(x, y));
      this._ctx.fillStyle = this._canvasLegend[charFromElement(element)];
      this._ctx.fillRect(x * this._size, y * this._size, this._size, this._size);
      // deadly slow if so.
      //this._ctx.beginPath();
      //this._ctx.arc(x * this._size, y * this._size, this.size / 2, 0, Math.PI * 2);
      //this._ctx.fill();
      this._ctx.fillStyle = 'white';
    }
  }
  this._ctx.restore();
}
```

It’s fucking cool!

![canvas Animation UI](http://img.vim-cn.com/08/d056d8ad19af2755c9bada138cced2046d69ab.gif)

当然，如果你尝试试着在每个单位绘制复杂图像，将有意外惊喜。请尝试前保存好当前工作。

聪明的我于是将留给读者又一个练习，给每个单位贴图，给背景贴图。

### WebGL Animation

最后，webGL，我们把绘制交给gpu来完成。使用webGL相对较复杂一些(当然，特定需求three.js这种封装的很方便，但原生接口对陌生的同学需要学习和理解以下)

webgl暴露了这么一种接口。啊，我不准备讲opengl流水线，一点直观理解就够了。

*   准备画布，调整观察者在空间中的位置。默认情况下，远处和近处物体一样大，画布中心是(0, 0, 0)，空间坐标是右手座标系。
*   我们使用一种叫GLSL的语言来准备两个shader文件来指导显卡如何渲染数据。其中vertex决定顶点数据，fragment决定如何渲染。
*   webGL暴露了这么一种接口，你可以创建、编译、链接GLSL语言的程序，而webGL将提供一些接口让你能制定这些程序使用的数据。
*   webGL也提供了制作让GLSL编译后的程序能理解的数据的接口，这样就能把javascript中的数据传递给显卡。

以下只是一种实现，为了实现类似canvas中`fillRect`效果封装了个`_webGLRect`函数。  
聪明的读者将会自己实现更好的。。。

聪明的我将留给读者又一个练习，给每个单位贴图，给背景贴图。

```javascript
drawWebGL() {
  let element;
  let colorName;
  var wRatio = 2 / this.grid.width ;
  var hRatio = 2 / this.grid.height;
  this._gl.clearColor(1, 1, 1, 1.0);
  this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
  for (let y = 0; y < this.grid.height; y++) {
    for (let x = 0; x < this.grid.width; x++) {
      element = this.grid.get(new Vector(x, y));
      if (element) {
        colorName = this._canvasLegend[charFromElement(element)];
        this._webGLRect(x * wRatio, y * hRatio, wRatio, hRatio, colorName);
      }
    }
  }
}

_webGLRect(x, y, wRatio, hRatio, colorName) {
  let gl = this._gl;
  var vertices = new Float32Array([
    -1 + x, -1 + y,
    -1 + x + wRatio, -1 + y + 0,
    -1 + x + wRatio, -1 + y + hRatio,
    -1 + x + 0, -1 + y + 0,
    -1 + x + wRatio, -1 + y + hRatio,
    -1 + x + 0, -1 + y + hRatio
  ]);

  let vbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let itemSize = 2;
  let numItems = vertices.length / itemSize;

  let uColor = gl.getUniformLocation(this.program, "uColor");
  switch (colorName) {
      case "red":
          gl.uniform4fv(uColor, [1.0,0.0,0.0,1.0]);
          break;
      case "green":
          gl.uniform4fv(uColor, [0.0,1.0,0.0,1.0]);
          break;
      case "blue":
          gl.uniform4fv(uColor, [0.0,0.0,1.0,1.0]);
          break;
      case "yellow":
          gl.uniform4fv(uColor, [1.0,0.0,1.0,1.0]);
          break;
      case "black":
          gl.uniform4fv(uColor, [0.0,0.0,0.0,1.0]);
          break;
  }

  let aVertexPosition = gl.getAttribLocation(this.program, "aVertexPosition");

  gl.enableVertexAttribArray(aVertexPosition);
  gl.vertexAttribPointer(aVertexPosition, itemSize, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, numItems);
}
```

![webGL Animation UI](http://img.vim-cn.com/8d/d346f93ee3ad8163e4390bf64c02ada9c768db.gif)

### 性能与瞎想

我本来想给出些科学的探索，然而，我并不能给出谁发热多谁发热少的结论

terminal表现非常好，可惜terminal能画的单位数目有限。

DOM的效率比想象中高很多，能超过canvas很多接近webGL，想想如果用SVG是不是更高2333

canvas，如果需要绘制成千上万次，请使用贴图。。

webGL，可以编辑更复杂的shader文件，一次将要绘制的世界准备好，而不是在循环里不断调用绘图接口。

### More?

等待您的指教

## Have Fun With it

实际上、通过web技术我们能和这个世界交互。于是，改造成一个伪God Name。

用鼠标在任何位置随时添加的各种单位，随时拆墙建墙。。。如果有谁有兴趣，

聪明的读者会自己玩~

Have fun~,准备滑雪！