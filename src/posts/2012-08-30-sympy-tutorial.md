---
layout: post
title: "SymPy Tutorial(译)"
excerpt: "翻译sympy tutorial"
category: python
tags: [python]
disqus: true
---


# SymPy Tutorial

翻译自：[SymPy Tutorial](http://docs.sympy.org/dev/tutorial.html),其实有人译过了，但我看着不爽……你看我的不爽可以参考他的[SymPy简明教程](http://blankdesktop.blogbus.com/logs/74200705.html)

**目录**

* toc
{: toc}

## 引言

SymPy是一个符号数学Python库。它的目标是成为一个全功能的计算机代数系统，同时保持代码的精简而易于理解和课扩展。SymPy完全由Python写成，不需要任何外部库。 

这个教程概述和简介SymPy。阅读它能让你知道SymPy可以为你做什么。如果你想了解更多，阅读[SymPy用户指南](http://docs.sympy.org/0.7.1/guide.html#guide)和[SymPy模块参考](http://docs.sympy.org/0.7.1/modules/index.html#module-docs)。或者直接阅读[源码](https://github.com/sympy/sympy/)。

## SymPy第一步

下载它最简单的方法是去[http://code.google.com/p/sympy/](http://code.google.com/p/sympy/)从“推荐下载”下载最新的压缩包。[^1]
![downloads](http://fmn.rrimg.com/fmn061/20120901/1800/p_large_M3yG_5d30000027c61261.jpg)

解压：

    tar xzf sympy-0.7.1.tar.gz

然后用Python解释器尝试它：

    [lyy@arch ~]cd sympy-0.7.1
    [lyy@arch ~]$ python2
    Python 2.7.3 (default, Apr 24 2012, 00:00:54) 
    [GCC 4.7.0 20120414 (prerelease)] on linux2
    Type "help", "copyright", "credits" or "license" for more information.
    >>> from sympy import Symbol, cos
    >>> x = Symbol('x')
    >>> (1/cos(x)).series(x, 0, 10)
    1 + x**2/2 + 5*x**4/24 + 61*x**6/720 + 277*x**8/8064 + O(x**10)

你可以如上展示使用SymPy。如果你在你的程序中使用它的话，这确实是推荐的方法。你也可以用`./setup.py install`像所有其它Python模块一样安装它，或者仅仅在你心爱的发行版中安装相应的包，等等。

**在archlinux中安装SymPy**
    
    [lyy@arch ~]$ sudo pacman -S python2-sympy
    警告：python2-sympy-0.7.1-4 已经为最新 -- 重新安装
    正在解决依赖关系...
    正在查找内部冲突...
    
    目标 (1)： python2-sympy-0.7.1-4
    
    全部安装大小：25.12 MiB
    净更新大小：0.00 MiB
    
    进行安装吗？ [Y/n] 
    (1/1) 正在检查软件包完整性      [###############################] 100%
    (1/1) 正在加载软件包文件        [###############################] 100%
    (1/1) 正在检查文件冲突          [###############################] 100%
    (1/1) 正在检查可用硬盘空间      [###############################] 100%
    (1/1) 正在更新 python2-sympy

其它安装SymPy的方法，查阅SymPy主页上的[下载](http://code.google.com/p/sympy/wiki/DownloadInstallation?tm=2)标签。

### isympy控制台

为了试验新功能，或当搞清楚如何做事时，你可以使用我们对IPython的特殊封装`isympy`(它位于`/bin/isympy`中，如果你正在从源码文件夹运行的话)，它仅仅是一个已经导入相关sympy模块的标准python shell，定义了符号`x,y,z`和一些其它东西：

    [lyy@arch ~]$ cd sympy 
    [lyy@arch ~]$ ./bin/isympy 
    IPython console for SymPy 0.7.1 (Python 2.7.3-64-bit) (ground types: python)
    
    These commands were executed:
    >>> from __future__ import division
    >>> from sympy import *
    >>> x, y, z, t = symbols('x y z t')
    >>> k, m, n = symbols('k m n', integer=True)
    >>> f, g, h = symbols('f g h', cls=Function)
    
    Documentation can be found at http://www.sympy.org
    
    In [1]: (1/cos(x)).series(x, 0, 10)
    Out[1]: 
         2      4       6        8           
        x    5⋅x    61⋅x    277⋅x            
    1 + ── + ──── + ───── + ────── + O(x**10)
        2     24     720     8064  

### 用SymPy做计算器

SymPy有三种内建的数值类型：浮点数、有理数和整数。

有理数类用一对整数表示一个有理数：分子和分母，所以`Rational(1,2)`代表1/2,`Rational(5,2)`代表5/2等等。

    >>> from sympy import *
    >>> a = Rational(1,2)
    
    >>> a
    1/2
    
    >>> a*2
    1
    
    >>> Rational(2)**50/Rational(10)**50
    1/88817841970012523233890533447265625

当计算整型数据时小心处理，因为他们会截取整数部分。这就是为何：

    >>> 1/2
    0
    
    >>> 1.0/2
    0.5

然而你可以这样做

    >>> from __future__ import division
    
    >>> 1/2 
    0.5

真正的除法将要成为python3k的标准，isympy中也是。

我们也有些特殊的常数，像e和pi，它们被视为符号(1+pi将不被数值求解，它将保持为1+pi)，并且我们可以有任意精度：

    >>> pi**2
    pi**2
    
    >>> pi.evalf()
    3.14159265358979
    
    >>> (pi+exp(1)).evalf()
    5.85987448204884

就像你看到的，`evalf`将表达式求解为浮点数。

这还有一个类表示数学上的无限，叫作`oo`：

    >>> oo > 99999
    True
    >>> oo + 1
    oo

### 符号

和其它计算机代数系统相比，在SymPy中你不得不显式地声明符号变量：

    >>> from sympy import *
    >>> x = Symbol('x')
    >>> y = Symbol('y')

然后你可以使用它们：

    >>> x+y+x-y
    2*x
    
    >>> (x+y)**2
    (x + y)**2
    
    >>> ((x+y)**2).expand()
    x**2 + 2*x*y + y**2

使用`subs(old, new)`用其它符号和数代换它们：

    >>> ((x+y)**2).subs(x, 1)
    (y + 1)**2
    
    >>> ((x+y)**2).subs(x, y)
    4*y**2

对于剩余的教程，我们假设我们已经运行了：

    >>> import sys
    >>> oldhook = sys.displayhook
    >>> sys.displayhook = pprint

这样就有漂亮的打印。参见之后的[打印](#section-16)部分。如果你安装了unicode字体，你的输出可能看起来有点不同。(将看起来稍微好些)

## 代数

对部分分式分解，使用`apart(expr, x)`：

    >>> 1/((x+2)*(x+1))
           1       
    ───────────────
    (x + 1)⋅(x + 2)
    >>> apart(1/((x+2)*(x+1)), x)
        1       1  
    - ───── + ─────
      x + 2   x + 1
    >>> (x+1)/(x-1)
    x + 1
    ─────
    x - 1
    >>> apart((x+1)/(x-1), x)
          2  
    1 + ─────
        x - 1

把它们重新结合起来，使用`together(expr, x)`：

    >>> z = Symbol('z')
    >>> together(1/x + 1/y + 1/z)
    x⋅y + x⋅z + y⋅z
    ───────────────
         x⋅y⋅z     
    >>> together(apart((x+1)/(x-1), x), x)
    x + 1
    ─────
    x - 1
    >>> together(apart(1/( (x+2)*(x+1) ), x), x)
           1       
    ───────────────
    (x + 1)⋅(x + 2)

## 演算

### 极限

极限在sympy中使用很简单，它们的语法是`limit(function, variable, point)`，所以计算当x趋近于0时f(x)的极限，你可以给出`limit(f, x, 0)`：

    >>> from sympy import *
    >>> x=Symbol("x")
    >>> limit(sin(x)/x, x, 0)
    1

你也可以计算在无穷的极限：

    >>> limit(sin(x)/x,x,0)
    1
    >>> limit(x,x,oo)
    ∞
对于一些不寻常的极限例子，你可以阅读这个测试文件[test_demidovich.py](https://github.com/sympy/sympy/blob/master/sympy/series/tests/test_demidovich.py)

### 微分

你可以使用`diff(func, var)`微分任何SymPy表达式。例如：

    >>> from sympy import *
    >>> x = Symbol('x')
    >>> diff(sin(x), x)
    cos(x)
    >>> diff(sin(2*x), x)
    2⋅cos(2⋅x)
    >>> diff(tan(x), x)
       2       
    tan (x) + 1

你可以检查正确性：

    >>> limit((tan(x+y)-tan(x))/y, y, 0)
       2       
    tan (x) + 1

高阶微分可以使用`diff(func, var, n)`来计算：

    >>> diff(sin(2*x), x, 1)
    2⋅cos(2⋅x)
    >>> diff(sin(2*x), x, 2)
    -4⋅sin(2⋅x)
    >>> diff(sin(2*x), x, 3)
    -8⋅cos(2⋅x)

### 级数展开

使用`.series(var, point, order)`:

    >>> cos(x).series(x, 0, 10)
         2    4     6      8            
        x    x     x      x             
    1 - ── + ── - ─── + ───── + O(x**10)
        2    24   720   40320 
    >>> (1/cos(x)).series(x, 0, 10)
         2      4       6        8           
        x    5⋅x    61⋅x    277⋅x            
    1 + ── + ──── + ───── + ────── + O(x**10)
        2     24     720     8064            

另一个简单的例子：

    >>> from sympy import Integral, Symbol, pprint
    >>> x = Symbol('x')
    >>> y = Symbol('y')
    >>> e = 1/(x + y)
    >>> s = e.series(x, 0, 5)
    >>> print(s)
    1/y - x/y**2 + x**2/y**3 - x**3/y**4 + x**4/y**5 + O(x**5)
    >>> pprint(s)
              2    3    4          
    1   x    x    x    x           
    ─ - ── + ── - ── + ── + O(x**5)
    y    2    3    4    5          
        y    y    y    y           
    None

### 求和

计算给定求和变量界限的f的总和(Summation)。[^2]

`summation(f, (i, a, b))`变量i从a到b计算f的和，也就是，

                                b
                              ____
                              \   `
    summation(f, (i, a, b)) =  )    f
                              /___,
                              i = a

如果不能计算总和，它将打印相应的求和公式。求值可引入额外的极限计算：

    >>> from sympy import summation, oo, symbols, log
    >>> i, n, m = symbols('i n m', integer=True)
    >>> summation(2*i - 1, (i, 1, n))
     2
    n 
    >>> summation(1/2**i, (i, 0, oo))
    2
    >>> summation(1/log(n)**n, (n, 2, oo))
      ∞           
     ___          
     \  `         
      \      -n   
      /   log  (n)
     /__,         
    n = 2         
    >>> summation(i, (i, 0, n), (n, 0, m))
     3    2    
    m    m    m
    ── + ── + ─
    6    2    3
    >>> from sympy.abc import x
    >>> from sympy import factorial
    >>> summation(x**n/factorial(n), (n, 0, oo))
     x
    ℯ 

### 积分

通过`integrate()`功能(facility)，SymPy对基本和特殊函数定与不定积分有卓越的支持。
该功能使用有力的扩展Risch-Norman算法，启发算法和模式匹配：

    >>> from sympy import integrate, erf, exp, sin, log, oo, pi, sinh, symbols
    >>> x, y = symbols('x,y')

你可以对基本函数积分：

    >>> integrate(6*x**5, x)
     6
    x 
    >>> integrate(sin(x), x)
    -cos(x)
    >>> integrate(log(x), x)
    x⋅log(x) - x
    >>> integrate(2*x + sinh(x), x)
     2          
    x  + cosh(x)

特殊函数也可以简单的处理：

    >>> integrate(exp(-x**2)*erf(x), x)
      ⎽⎽⎽    2   
    ╲╱ π ⋅erf (x)
    ─────────────
          4      

还可以计算定积分：

    >>> integrate(x**3, (x, -1, 1))
    0
    >>> integrate(sin(x), (x, 0, pi/2))
    1
    >>> integrate(cos(x), (x, -pi/2, pi/2))
    2

反常积分也被支持：

    >>> integrate(exp(-x), (x, 0, oo))
    1
    >>> integrate(log(x), (x, 0, 1))
    -1

### 复数

除了复数单元`I`是虚数，符号可以被用属性创建(例如 real,positive,complex,等等)这将影响它们的表现：

    >>> from sympy import Symbol, exp, I
    >>> x = Symbol('x')  # a plain x with no attributes
    >>> exp(I*x).expand()
     ⅈ⋅x
    ℯ   
    >>> exp(I*x).expand(complex=True)
       -im(x)               -im(x)           
    ⅈ⋅ℯ      ⋅sin(re(x)) + ℯ      ⋅cos(re(x))
    >>> x = Symbol('x', real=True)
    >>> exp(I*x).expand(complex=True)
    ⅈ⋅sin(x) + cos(x)

### 函数

**三角函数:**

    >>> from sympy import asin, asinh, cos, sin, sinh, symbols, I
    >>> x, y = symbols('x,y')
    >>> sin(x+y).expand(trig=True)
    sin(x)⋅cos(y) + sin(y)⋅cos(x)
    >>> cos(x+y).expand(trig=True)
    -sin(x)⋅sin(y) + cos(x)⋅cos(y)
    >>> sin(I*x)
    ⅈ⋅sinh(x)
    >>> sinh(I*x)
    ⅈ⋅sin(x)
    >>> asinh(I)
    ⅈ⋅π
    ───
     2 
    >>> asinh(I*x)
    ⅈ⋅asin(x)
    >>> sin(x).series(x, 0, 10)
         3     5     7       9             
        x     x     x       x              
    x - ── + ─── - ──── + ────── + O(x**10)
        6    120   5040   362880           
    >>> sinh(x).series(x, 0, 10)
         3     5     7       9             
        x     x     x       x              
    x + ── + ─── + ──── + ────── + O(x**10)
        6    120   5040   362880           
    >>> asin(x).series(x, 0, 10)
         3      5      7       9           
        x    3⋅x    5⋅x    35⋅x            
    x + ── + ──── + ──── + ───── + O(x**10)
        6     40    112     1152           
    >>> asinh(x).series(x, 0, 10)
         3      5      7       9           
        x    3⋅x    5⋅x    35⋅x            
    x - ── + ──── - ──── + ───── + O(x**10)
        6     40    112     1152    

**球谐函数：**

    >>> from sympy import Ylm
    >>> from sympy.abc import theta, phi
    >>> Ylm(1, 0, theta, phi)
      ⎽⎽⎽       
    ╲╱ 3 ⋅cos(θ)
    ────────────
          ⎽⎽⎽   
      2⋅╲╱ π    
    >>> Ylm(1, 1, theta, phi)
       ⎽⎽⎽  ⅈ⋅φ       
    -╲╱ 6 ⋅ℯ   ⋅sin(θ)
    ──────────────────
             ⎽⎽⎽      
         4⋅╲╱ π       
    >>> Ylm(2, 1, theta, phi)
       ⎽⎽⎽⎽  ⅈ⋅φ              
    -╲╱ 30 ⋅ℯ   ⋅sin(θ)⋅cos(θ)
    ──────────────────────────
                 ⎽⎽⎽          
             4⋅╲╱ π       

**阶乘和伽马函数：**

    >>> from sympy import factorial, gamma, Symbol
    >>> x = Symbol("x")
    >>> n = Symbol("n", integer=True)
    >>> factorial(x)
    x!
    >>> factorial(n)
    n!
    >>> gamma(x + 1).series(x, 0, 3) # i.e. factorial(x)
                        2  2             2  2          
                       π ⋅x    EulerGamma ⋅x           
    1 - EulerGamma⋅x + ───── + ────────────── + O(x**3)
                         12          2     

**zeta函数：**

    >>> from sympy import zeta
    >>> zeta(4, x)
    ζ(4, x)
    >>> zeta(4, 1)
     4
    π 
    ──
    90
    >>> zeta(4, 2)
          4
         π 
    -1 + ──
         90
    >>> zeta(4, 3)
            4
      17   π 
    - ── + ──
      16   90

**多项式：**

    >>> from sympy import assoc_legendre, chebyshevt, legendre, hermite
    >>> chebyshevt(2, x)
       2    
    2⋅x  - 1
    >>> chebyshevt(4, x)
       4      2    
    8⋅x  - 8⋅x  + 1
    >>> legendre(2, x)
       2    
    3⋅x    1
    ──── - ─
     2     2
    >>> legendre(8, x)
          8         6         4        2      
    6435⋅x    3003⋅x    3465⋅x    315⋅x     35
    ─────── - ─────── + ─────── - ────── + ───
      128        32        64       32     128
    >>> assoc_legendre(2, 1, x)
            ⎽⎽⎽⎽⎽⎽⎽⎽⎽⎽
           ╱    2     
    -3⋅x⋅╲╱  - x  + 1 
    >>> assoc_legendre(2, 2, x)
         2    
    - 3⋅x  + 3
    >>> hermite(3, x)
       3       
    8⋅x  - 12⋅x

### 微分方程

在 isympy中：

    >>> from sympy import Function, Symbol, dsolve
    >>> f = Function('f')
    >>> x = Symbol('x')
    >>> f(x).diff(x, x) + f(x)
             2      
            d       
    f(x) + ───(f(x))
             2      
           dx       
    >>> dsolve(f(x).diff(x, x) + f(x), f(x))
    f(x) = C₁⋅cos(x) + C₂⋅sin(x)

### 代数方程

在isympy中：

    >>> from sympy import solve, symbols
    >>> x, y = symbols('x,y')
    >>> solve(x**4 - 1, x)
    [1, -1, -ⅈ, ⅈ]
    >>> solve([x + 5*y - 2, -3*x + 6*y - 15], [x, y])
    {x: -3, y: 1}

## 线性代数

### 矩阵

矩阵从Matrix类创建：

    >>> from sympy import Matrix, Symbol
    >>> Matrix([[1,0], [0,1]])
    ⎡1  0⎤
    ⎢    ⎥
    ⎣0  1⎦

它可以包含符号：

    >>> x = Symbol('x')
    >>> y = Symbol('y')
    >>> A = Matrix([[1,x], [y,1]])
    >>> A
    ⎡1  x⎤
    ⎢    ⎥
    ⎣y  1⎦
    >>> A**2
    ⎡x⋅y + 1    2⋅x  ⎤
    ⎢                ⎥
    ⎣  2⋅y    x⋅y + 1⎦

更多有关矩阵信息，参见线性代数教程。

## 模式匹配

使用`.match()`方法，和Wild类对表达式实行模式匹配。这个方法将返回一个发生替换的字典，如下：

    >>> from sympy import Symbol, Wild
    >>> x = Symbol('x')
    >>> p = Wild('p')
    >>> (5*x**2).match(p*x**2)
    {p: 5}
    >>> q = Wild('q')
    >>> (x**2).match(p*x**q)
    {p: 1, q: 2}

如果匹配失败，将返回`None`：

    >>> print (x+1).match(p**x)
    None

可以指定`Wild`类的排除参数去保证一些东西不出现在结果之中：

    >>> p = Wild('p', exclude=[1,x])
    >>> print (x+1).match(x+p) # 1 is excluded
    None
    >>> print (x+1).match(p+1) # x is excluded
    None
    >>> print (x+1).match(x+2+p) # -1 is not excluded
    {p_: -1}

## 打印

这里有许多打印表达式的方法：

**标准**

这就是`str(expression)`返回的，看起来想这样：

    >>> from sympy import Integral
    >>> from sympy.abc import x
    >>> print x**2
    x**2
    >>> print 1/x
    1/x
    >>> print Integral(x**2, x)
    Integral(x**2, x)

**漂亮的打印**

`pprint`函数产生好看的ascii艺术打印：

    >>> from sympy import Integral, pprint
    >>> from sympy.abc import x
    >>> pprint(x**2)
     2
    x 
    None
    >>> pprint(1/x)
    1
    ─
    x
    None
    >>> pprint(Integral(x**2, x))
    ⌠      
    ⎮  2   
    ⎮ x  dx
    ⌡      
    None

如果你安装了unicode字体，`pprint`函数将默认使用它。你可以使用`use_unicode`函数改变这个选项。：

    >>> pprint(Integral(x**2, x), use_unicode=False)
      /     
     |      
     |  2   
     | x  dx
     |      
    /       
    None

更多好看的unicode打印另见维基[Pretty Printing](https://github.com/sympy/sympy/wiki/Pretty-Printing)。

小技巧：在Python解释器中默认使用漂亮的打印，使用：

    $ python
    Python 2.5.2 (r252:60911, Jun 25 2008, 17:58:32)
    [GCC 4.3.1] on linux2
    Type "help", "copyright", "credits" or "license" for more information.
    >>> from sympy import init_printing, var, Integral
    >>> init_printing(use_unicode=False, wrap_line=False, no_global=True)
    >>> var("x")
    x
    >>> x**3/3
     3
    x
    --
    3
    >>> Integral(x**2, x) #doctest: +NORMALIZE_WHITESPACE
      /
     |
     |  2
     | x  dx
     |
    /

**Python打印**

    >>> from sympy.printing.python import python
    >>> from sympy import Integral
    >>> from sympy.abc import x
    >>> print python(x**2)
    x = Symbol('x')
    e = x**2
    >>> print python(1/x)
    x = Symbol('x')
    e = 1/x
    >>> print python(Integral(x**2, x))
    x = Symbol('x')
    e = Integral(x**2, x)

**LaTeX打印**

    >>> from sympy import Integral, latex
    >>> from sympy.abc import x
    >>> latex(x**2)
    x^{2}
    >>> latex(x**2, mode='inline')
    $x^{2}$
    >>> latex(x**2, mode='equation')
    \begin{equation}x^{2}\end{equation}
    >>> latex(x**2, mode='equation*')
    \begin{equation*}x^{2}\end{equation*}
    >>> latex(1/x)
    \frac{1}{x}
    >>> latex(Integral(x**2, x))
    \int x^{2}\,dx

**MathML**

    >>> from sympy.printing.mathml import mathml
    >>> from sympy import Integral, latex
    >>> from sympy.abc import x
    >>> print mathml(x**2)
    <apply><power/><ci>x</ci><cn>2</cn></apply>
    >>> print mathml(1/x)
    <apply><power/><ci>x</ci><cn>-1</cn></apply>

**Pylet**

    >>> from sympy import Integral, preview
    >>> from sympy.abc import x
    >>> preview(Integral(x**2, x))
    This is pdfTeX, Version 3.1415926-2.4-1.40.13 (TeX Live 2012/Arch Linux)
     restricted \write18 enabled.
    entering extended mode
    (/tmp/tmpGYREx_.tex
    LaTeX2e <2011/06/27>
    Babel <v3.8m> and hyphenation patterns for english, dumylang, nohyphenation, ge
    rman-x-2012-05-30, ngerman-x-2012-05-30, afrikaans, ancientgreek, ibycus, arabi
    c, armenian, basque, bulgarian, catalan, pinyin, coptic, croatian, czech, danis
    h, dutch, ukenglish, usenglishmax, esperanto, estonian, ethiopic, farsi, finnis
    h, french, friulan, galician, german, ngerman, swissgerman, monogreek, greek, h
    ungarian, icelandic, assamese, bengali, gujarati, hindi, kannada, malayalam, ma
    rathi, oriya, panjabi, tamil, telugu, indonesian, interlingua, irish, italian, 
    kurmanji, latin, latvian, lithuanian, mongolian, mongolianlmc, bokmal, nynorsk,
     polish, portuguese, romanian, romansh, russian, sanskrit, serbian, serbianc, s
    lovak, slovenian, spanish, swedish, turkish, turkmen, ukrainian, uppersorbian, 
    welsh, loaded.
    (/usr/share/texmf-dist/tex/latex/base/article.cls
    Document Class: article 2007/10/19 v1.4h Standard LaTeX document class
    (/usr/share/texmf-dist/tex/latex/base/size12.clo))
    (/usr/share/texmf-dist/tex/latex/amsmath/amsmath.sty
    For additional information on amsmath, use the `?' option.
    (/usr/share/texmf-dist/tex/latex/amsmath/amstext.sty
    (/usr/share/texmf-dist/tex/latex/amsmath/amsgen.sty))
    (/usr/share/texmf-dist/tex/latex/amsmath/amsbsy.sty)
    (/usr/share/texmf-dist/tex/latex/amsmath/amsopn.sty))
    (/usr/share/texmf-dist/tex/latex/eulervm/eulervm.sty)
    No file tmpGYREx_.aux.
    (/usr/share/texmf-dist/tex/latex/eulervm/uzeur.fd)
    (/usr/share/texmf-dist/tex/latex/eulervm/uzeus.fd)
    (/usr/share/texmf-dist/tex/latex/eulervm/uzeuex.fd) [1] (./tmpGYREx_.aux) )
    Output written on tmpGYREx_.dvi (1 page, 320 bytes).
    Transcript written on tmpGYREx_.log.
    This is dvipng 1.14 Copyright 2002-2010 Jan-Ake Larsson
    [1] 

如果pyglet被安装了，一个包含LaTeX渲染后表达式的pyglet窗口将被打开：

![pyglet](http://fmn.rrimg.com/fmn059/20120903/1210/p_large_ViwY_2fcc000000bf1262.jpg)

### 注意

isympy自动调用`pprint`,这就是为什么默认情况下你看到的是漂亮的打印。

注意有一个可用的打印模块`sympy.printing`。其它通过这个模块的打印方法是：

- `pretty(expr)`,`pretty_print(expr)`,`pprint(expr)`:分别漂亮的表示`expr`.这是和之前描述的第二层表示是一样的。
- `latex(expr)`, `print_latex(expr)`：分别返回和打印`expr`的[LaTeX](http://www.latex-project.org/)表示。
- `mathml(expr)`,`print_mathml(expr)`：分别返回和打印`expr`的[MathML](http://www.w3.org/Math/)表示。
- `print_gtk(expr)`：在[Gtkmathview](http://helm.cs.unibo.it/mml-widget/)打印`expr`，这是一个呈现MathML代码的GTK部件。[Gtkmathview](http://helm.cs.unibo.it/mml-widget/)要求安装。

## 更多文档

现在该学更多有关SymPy的知识了。浏览[SymPy用户指南](http://docs.sympy.org/dev/guide.html#guide)和[SymPy模块参考](http://docs.sympy.org/dev/modules/index.html#module-docs)。

一定也浏览我们的公共[wiki.sympy.org](http://wiki.sympy.org/)，那里包含了很多我们和我们的用户贡献的示例，教程，cookbook，请自由地编辑它。

## 翻译

这个教程还有其它语言：

[德语](http://docs.sympy.org/dev/tutorial.de.html)

---

## FootNotes

[^1]:不介意非稳定版我觉得git更方便一些，当然linux包管理器更方便,所以先用你的包管理器安装它。
[^2]:Compute the summation of f with respect to the given summation variable over the given limits.
