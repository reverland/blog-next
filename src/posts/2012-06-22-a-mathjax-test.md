---
layout: post
title: "A Mathjax Test"
excerpt: "换textile了，当然要好好体验下mathjax了"
category: web
tags: [mathjax]
disqus: true
mathjax: true
---


# TeX Samples

以下公式以HTML源代码呈现LaTeX表达式。

## 洛伦兹公式

$$
\begin{aligned}
\dot{x} & = \sigma(y-x) \\
\dot{y} & = \rho x - y - xz \\
\dot{z} & = -\beta z + xy
\end{aligned}
$$

## 柯西-施瓦茨不等式

$$
\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
$$

## 叉积公式

$$
\mathbf{V}_1 \times \mathbf{V}_2 =  \begin{vmatrix}
\mathbf{i} & \mathbf{j} & \mathbf{k} \\
\frac{\partial X}{\partial u} &  \frac{\partial Y}{\partial u} & 0 \\
\frac{\partial X}{\partial v} &  \frac{\partial Y}{\partial v} & 0
\end{vmatrix}
$$

## n次实验k次成功的概率

$$
P(E) = {n \choose k} p^k (1-p)^{ n-k}
$$

## 拉马努金恒等式

$$
\frac{1}{\Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{\frac25 \pi}} =
1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {1+\frac{e^{-6\pi}}
{1+\frac{e^{-8\pi}} {1+\ldots} } } }
$$

## Rogers–Ramanujan恒等式

$$
1 +  \frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots =
\prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})},
\quad\quad \text{for $|q|<1$}.
$$

## 麦克斯韦方程组

$$
\begin{aligned}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} & = \frac{4\pi}{c}\vec{\mathbf{j}} \\   \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} & = 0 \end{aligned}
$$

最后，当呈现整页看上去很棒的例子后，把数学公式与文本混合[1]同样重要。这个表达式$\sqrt{3x-1}+(1+x)^2$是一个行内等式例子。正如你所见，MathJax中这种等式也可以试用的很好，而不必变更行间距。

<hr />

## Footnotes

[^1]: 应该指行内公式
