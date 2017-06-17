webpackJsonp([122,197],{520:function(n,p){n.exports={rawContent:'\n\n# 一维相位去包裹：原理与仿真\n\n\n## Off-Topic\n\n> 未觉池塘春草色，阶前梧叶已秋声。\n> \n> ——朱熹\n\n时光飞逝，转眼就要毕业了。前天导师打电话摧我，这几个月就毕业了，你那毕业设计得赶紧做了。想想真是，四年倏忽过去，浑然不觉，已近毕业。\n\n也许这是最后自在平静的日子了，时间却像沙子，越用力抓紧，从指间溜走地越快。\n\n两年过得太快，I follow my passion，做了太多没用的事，有得有失。只是希望：\n\n> You can\'t connect the dots looking forward you can only connect them looking backwards. So you have to trust that the dots will somehow connect in your future. You have to trust in something: your gut, destiny, life, karma, whatever. Because believing that the dots will connect down the road will give you the confidence to follow your heart, even when it leads you off the well worn path.\n> \n> ——Steve Jobs, Stanford Commencement Adress, 2005\n\n## 为何相位重要\n\n我大学的专业是光学，时至今日，依然清晰记得两年前在阴暗的实验室做全息摄像的实验。我们几个同学花了好久把光路摆好，让激光打在物体上反光到干版上曝光。然后拿到什么试剂中定形。最后在拿出来用激光将物体的影响重新清晰的放出三维的像时，心里相当兴奋。\n\n为什么全息照相能产生立体的像呢？普通的照相技术都是仅仅记录光波的强度，而不记录相位，因此失去了很多相位中的信息。但全息照相通过相干光(激光)之间的干涉在干版上同时记录下了强度和相位，再用相干光照射干版重放，好像光是从真的物体发出的一样。\n\n如果您也做过这种实验，您应该知道为什么相位重要了。\n\n这还有另一个例子，关于爱因斯坦和蒙娜丽莎。\n\n我从《Two Dimensional Phase Unwrapping Theory Algorithms and Software》中看到了这个例子，然后自己动手用python试了试。\n\n以下代码用来交换两个图片的相位\n\n```python\n# -*- coding: utf-8 -*-\n# <nbformat>3.0</nbformat>\n\n# <codecell>\n\nfrom scipy.fftpack import *\n\n# <codecell>\n\n# read file\nim_1 = plt.imread(\'einstein.jpg\')\nim_2 = plt.imread(\'monalisa.jpg\')\n\n# fft and reverse two images\' phase\nm_1, p_1 = np.abs(fft2(im_1)), np.angle(fft2(im_1))\nm_2, p_2 = np.abs(fft2(im_2)), np.angle(fft2(im_2))\n\n# <codecell>\n\nim_swapphase_1 = np.real(ifft2(m_1 * np.cos(p_2) + m_1 * np.sin(p_2) * 1j))\nim_swapphase_2 = np.real(ifft2(m_2 * np.cos(p_1) + m_2 * np.sin(p_1) * 1j))\n\n# <codecell>\n\nplt.figsize(10,10)\nplt.gray()\nplt.subplot(2,2,1)\nplt.imshow(im_1, origin=\'lower\')\nplt.subplot(2,2,2)\nplt.imshow(im_2, origin=\'lower\')\nplt.subplot(2,2,3)\nplt.imshow(im_swapphase_1, origin=\'lower\')\nplt.subplot(2,2,4)\nplt.imshow(im_swapphase_2, origin=\'lower\')\n```\n\n上面两幅图是交换相位前的图，下面两幅是之后的。显然，一团糟，相位中是有信息的。\n\n![Einstein and Monalisa](https://raw.github.com/reverland/phase-unwrapping-notes/master/image/reverse_phase.jpg)\n\n## 为何要相位去包裹\n\n简单地说，就是说，任何仪器，比如说量角器，顶多只能测得($-\\pi, \\pi$]之间的量,但真正的相位角度不该这样，而是分布在实数空间内，应该是测得的($-\\pi, \\pi$]之间的值的2$\\pi$整数倍。\n\n真正的相位值被“包裹”起来了，但为什么要解包裹呢？\n\n不解包裹无法对相位进行计算。\n\n## Itoh的路径积分法\n\n我们先定义一个获取包裹相位的算子$\\mathscr{W}$，该算子将相位包裹，获取位于$(-\\pi,\\pi]$之间的包裹相位。\n\n$$\\mathscr{W}\\varphi = \\arctan[\\cos(Real \\varphi / Img \\varphi)]$$\n\n还可以这样写\n\n$$\\mathscr{W}\\{\\varphi(n)\\} = \\psi(n) = \\varphi(n) + 2\\pi k(n)$$\n\n其中$k(n)$是使包裹相位位于$-\\pi,\\pi$之间的值。\n\n显然包裹相位$\\psi(n)$有：\n\n$$\\pi \\geq \\psi(n) \\gt -\\pi$$\n\n定义差分算子$\\Delta$：\n\n$$\\Delta \\{\\varphi(n)\\} = \\varphi(n+1) - \\varphi(n)$$\n\n$$\\Delta \\{k(n)\\} = k(n+1) - k(n)$$\n\n计算被包裹相位的差分：\n\n$$\\Delta \\{\\psi(n)\\} = \\Delta \\{\\varphi(n)\\} + 2\\pi\\Delta \\{k_1(n)\\}$$\n\n我们再用$\\mathscr{W}$作用于该差分得：\n\n$$\\mathscr{W}\\{\\Delta \\{\\psi(n)\\}\\} = \\Delta \\{\\varphi(n)\\} + 2\\pi[\\Delta \\{k_1(n)\\} + k_2(n)]$$\n\n显然上式结果应该位于$(-\\pi,\\pi]$，假如此时还有$\\Delta \\{\\varphi(n)\\}$也位于$(-\\pi,\\pi]$,则上式右边第二项$2\\pi[\\Delta \\{k\\_1(n) \\} + k_2(n)]$应该为零，则有：\n\n$$\\Delta \\{\\varphi(n)\\} = \\mathscr{W}\\{\\Delta \\{\\psi(n)\\}\\} $$\n\n显然，由该差分式可得：\n\n$$\\varphi(m) = \\varphi(0) + \\sum_{n=0}^{m-1} \\mathscr{W}\\{\\Delta \\{\\mathscr{W}\\{\\varphi(n)\\}\\}\\} $$\n\n上式说明，真实相位可以通过对包裹相位的差分的包裹进行积分求得。\n\n于是itoh的一维相位去包裹算法综述如下：\n\n对信号相位数组$\\psi(i),0 \\leq i \\leq N-1$\n\n- 计算相位差分$D(i) = \\psi(i+1)-\\psi(i), i=0,\\ldots,N-2$\n- 计算包裹的相位差分$\\Delta(i) = \\Delta\\{D(i)\\}, i=0,\\ldots,N-2$\n- 初始化初值$\\varphi(0)= \\psi(0)$\n- 累加解包裹$\\varphi(i) = \\psi(i) + \\Delta(i)$\n\nItoh的方法很简单实用，但受到两个重要因素的影响：相位失真和噪声。下面仿真两种情况的影响。\n\n## 仿真\n\n对正弦波相位函数(间谐波，一切波的基础)\n\n$$\\varphi(t) = 10\\sin(10t), 0 \\leq t \\leq 1$$\n\n通过计算可以得知，使之不产生相位失真，区间内至少有32个采样点:\n\n对相位变化有\n\n$$\\Delta \\varphi = \\dot{\\varphi}\\Delta t$$\n\n其中 $\\dot{\\varphi} = d\\varphi / dt = 100\\cos10t$ ，可看出相位在 $n\\pi/10$ 取得极值，加上条件：\n\n$$\\left\\vert\\Delta \\varphi\\right\\vert \\lt \\pi$$\n\n则\n\n$$\\left\\vert \\frac{100}{N} \\cos 10t \\right\\vert \\lt \\pi$$\n\n得\n\n$$N \\gt 31.83$$\n\n则对这个函数如果采样率低于32就会产生相位失真。\n\n```python\n# -*- coding: utf-8 -*-\n# <nbformat>3.0</nbformat>\n\n# <codecell>\n\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# <codecell>\n\n# phase function\ndef pf(x):\n    return 10 * np.sin(10 * x)\n# wrap function\ndef wrap(x):\n    return np.arctan2(np.sin(x), np.cos(x))\n# unwrap function\ndef wrap_diff(x):\n     return wrap(np.diff(x))\n\ndef unwrap(x):\n    y = x\n    y[0] = x[0]\n    for i in range(len(x) - 1):\n        i += 1\n        y[i] = y[i - 1] + wrap_diff(x)[i - 1]\n    return np.array(y)\n\ndef noise(x, snr):\n    return x + np.random.normal(loc=0.0, scale = np.sqrt(np.max(x) / 2 ** snr), size=len(x))\n\ndef show_unwrap(x,y,y_w,t,p):\n    plt.ylim((-12,12))\n    plt.ylabel("Phase in Radians")\n    p_w, = plt.plot(x, y_w,\'o:\')\n    p_o, = plt.plot(t,p,\':\')\n    p_u, = plt.plot(x,y,\'s\')\n    plt.legend([p_w, p_o, p_u], ["sampled wrapped phase", "original phase function", "unwrapped phase"])\n    \n\n# <headingcell level=1>\n\n# 当取样点为num时\n\n# <codecell>\n\n# Origin\nt = np.arange(0,1,0.01)\np = pf(t)\n\n# plot\n## num 50\nplt.subplot(311)\nplt.title("num = 50")\n# sampled data\nnum = 50\nx = np.linspace(0,1,num)\n# wrapped phase\ny_w = wrap(pf(x))\n# unwrapped wraped phase\ny = unwrap(wrap(pf(x)))\nshow_unwrap(x, y, y_w, t, p)\n## num = 32\nplt.subplot(312)\nplt.title("num = 32")\n# sampled data\nnum = 32\nx = np.linspace(0,1,num)\n# wrapped phase\ny_w = wrap(pf(x))\n# unwrapped wraped phase\ny = unwrap(wrap(pf(x)))\nshow_unwrap(x, y, y_w, t, p)\n## num = 31\nplt.subplot(313)\nplt.title("num = 31")\n# sampled data\nnum = 31\nx = np.linspace(0,1,num)\n# wrapped phase\ny_w = wrap(pf(x))\n# unwrapped wraped phase\ny = unwrap(wrap(pf(x)))\nshow_unwrap(x, y, y_w, t, p)\nplt.xlabel("Relative Time")\n\n\n# <headingcell level=1>\n\n# 噪声\n\n# <codecell>\n\n# noise influence\nx = np.linspace(0,1,200)\ny = pf(x)\ny_10 = unwrap(wrap(noise(y,10))) + 20\ny_5 = unwrap(noise(wrap(y), 5)) + 40\ny_2 = unwrap(noise(wrap(y), 2)) + 60\ny_1 = unwrap(noise(wrap(y), 1)) + 80\n# plot\nplt.xlabel("Relative Time")\nplt.ylabel("Phase in Radians")\np_o, = plt.plot(t,p)\np_1, = plt.plot(x,y_1,\'--\')\np_2, = plt.plot(x,y_2,\'-.\')\np_5, = plt.plot(x,y_5,\':\')\np_10, = plt.plot(x,y_10,\':\')\nplt.legend([p_o, p_1, p_2, p_5, p_10], ["Origin", "SNR=1", "SNR=2", "SNR=5", "SNR=10"])\n\n# <codecell>\n```\n\n我们可以看到：\n\n- 在采样率低于某一关键值32时基本没法解出正确相位。\n\n    ![phase aliasing](https://raw.github.com/reverland/phase-unwrapping-notes/master/image/phase-aliasing.jpg)\n- 信噪比越低，解包裹效果越差。\n    ![noise](https://raw.github.com/reverland/phase-unwrapping-notes/master/image/noise.jpg)\n\n## Summary\n\n如果是二维相位去包裹问题，还有个奇点的问题。噪音、相位失真、奇点，似乎是所有相位解缠算法必须面对的三大问题。\n\n相关Ipython Notebook文件和Einstein和Monalisa的图像[在此下载](https://lhtlyybox.googlecode.com/files/phase.zip)\n\n\n',metaData:{layout:"post",title:"一维相位去包裹：原理与仿真",excerpt:"One-dimension Phase-Unwrapping: Theory and Simulation，part of my graduation project implemented by ipython",category:"phase-unwrapping",tags:["python","phase-unwrapping"],disqus:!0,mathjax:!0}}}});