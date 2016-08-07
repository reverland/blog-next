webpackJsonp([111,170],{235:function(n,i){n.exports="\n\n# Scipy:高端科学计算\n\n作者：Adrien Chauve, Andre Espaze, Emmanuelle Gouillart, Gaël Varoquaux, Ralf Gommers\n\n翻译自：[scipy lecture notes](scipy-lectures.github.com/intro/scipy.html)\n\n\n<font color=\"red\">译者表示最后部分没怎么看懂，此文档维护中……</font>\n\n---\n\n**Scipy**\n\nscipy包包含致力于科学计算中常见问题的各个工具箱。它的不同子模块相应于不同的应用。像插值，积分，优化，图像处理，，特殊函数等等。\n\nscipy可以与其它标准科学计算程序库进行比较，比如GSL(GNU C或C++科学计算库)，或者Matlab工具箱。scipy是Python中科学计算程序的核心包;它用于有效地计算numpy矩阵，来让numpy和scipy协同工作。\n\n在实现一个程序之前，值得检查下所需的数据处理方式是否已经在scipy中存在了。作为非专业程序员，科学家总是喜欢_重新发明造轮子_，导致了充满漏洞的，未经优化的，很难分享和维护的代码。相反，Scipy程序经过优化和测试，因此应该尽可能使用。\n\n---\n\n**目录**\n\n* toc\n{: toc}\n\n---\n\n<font color=\"red\">警告：这个教程离真正的数值计算介绍很远。因为枚举scipy中不同的子模块和函数非常无聊，我们集中精力代之以几个例子来给出如何使用`scipy`进行计算的大致思想。</font>\n\nscipy 由一些特定功能的子模块组成：\n\n模块 | 功能\n---|---\nscipy.cluster |\t矢量量化 / K-均值\nscipy.constants | 物理和数学常数\nscipy.fftpack |\t傅里叶变换\nscipy.integrate |\t积分程序\nscipy.interpolate \t|插值\nscipy.io \t|数据输入输出\nscipy.linalg \t|线性代数程序\nscipy.ndimage \t|n维图像包\nscipy.odr \t|正交距离回归\nscipy.optimize \t|优化\nscipy.signal \t|信号处理\nscipy.sparse \t|稀疏矩阵\nscipy.spatial \t|空间数据结构和算法\nscipy.special \t|任何特殊数学函数\nscipy.stats \t|统计\n\n它们全依赖[numpy](http://docs.scipy.org/doc/numpy/reference/index.html#numpy),但是每个之间基本独立。导入Numpy和这些scipy模块的标准方式是：\n\n    import numpy as np\n    from scipy import stats  # 其它子模块相同\n\n主`scipy`命名空间大多包含真正的numpy函数(尝试 scipy.cos 就是 np.cos)。这些仅仅是由于历史原因，通常没有理由在你的代码中使用`import scipy`\n\n## 文件输入/输出：scipy.io\n\n- 导入和保存matlab文件:\n\n        In [1]: from scipy import io as spio\n        \n        In [3]: import numpy as np\n        \n        In [4]: a = np.ones((3, 3))\n        \n        In [5]: spio.savemat('file.mat', {'a': a}) # savemat expects a dictionary\n        /usr/lib/python2.7/site-packages/scipy/io/matlab/mio.py:266: FutureWarning: Using oned_as default value ('column') This will change to 'row' in future versions\n          oned_as=oned_as)\n        \n        In [6]: data = spio.loadmat('file.mat', struct_as_record=True)\n        \n        In [7]: data['a']\n        Out[7]: \n        array([[ 1.,  1.,  1.],\n               [ 1.,  1.,  1.],\n               [ 1.,  1.,  1.]])\n\n- 读取图片：\n\n        In [16]: from scipy import misc\n        \n        In [17]: misc.imread('scikit.png')\n        Out[17]: \n        array([[[255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                ..., \n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255]],\n        \n               [[255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                ..., \n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255]],\n        \n               [[255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                ..., \n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255]],\n        \n               ..., \n               [[255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                ..., \n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255]],\n        \n               [[255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                ..., \n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255]],\n        \n               [[255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                ..., \n                [255, 255, 255, 255],\n                [255, 255, 255, 255],\n                [255, 255, 255, 255]]], dtype=uint8)\n        \n        In [18]: import matplotlib.pyplot as plt\n        \n        In [19]: plt.imread('scikit.png')\n        Out[19]: \n        array([[[ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                ..., \n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.]],\n        \n               [[ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                ..., \n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.]],\n        \n               [[ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                ..., \n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.]],\n        \n               ..., \n               [[ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                ..., \n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.]],\n        \n               [[ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                ..., \n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.]],\n        \n               [[ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                ..., \n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.],\n                [ 1.,  1.,  1.,  1.]]], dtype=float32)\n\n参见：\n\n- 载入txt文件：numpy.loadtxt()/numpy.savetxt()\n- 智能导入文本/csv文件：numpy.genfromtxt()/numpy.recfromcsv()\n- 高速，有效率但numpy特有的二进制格式：numpy.save()/numpy.load()\n\n## 特殊函数：scipy.special\n\n特殊函数是先验函数。[scipy.special](http://docs.scipy.org/doc/scipy/reference/special.html#scipy.special)的文档字符串写得非常好，所以我们不在这里列出所有函数。常用的有：\n\n- 贝塞尔函数，如`scipy.special.jn()`(整数n阶贝塞尔函数)\n- 椭圆函数(`scipy.special.ellipj()`雅可比椭圆函数，……)\n- 伽马函数：`scipy.special.gamma()`，还要注意`scipy.special.gammaln`,这个函数给出对数坐标的伽马函数，因此有更高的数值精度。\n\n## 线性代数运算：scipy.linalg\n\n[scipy.linalg](http://docs.scipy.org/doc/scipy/reference/linalg.html#scipy.linalg)模块提供标准线性代数运算，依赖于底层有效率的实现(BLAS，LAPACK)。\n\n- [scipy.linalg.det()](http://docs.scipy.org/doc/scipy/reference/generated/scipy.linalg.det.html#scipy.linalg.det)函数计算方阵的行列式：\n\n        In [22]: from scipy import linalg\n        \n        In [23]: arr = np.array([[1, 2],\n           ....:                [3, 4]])\n        \n        In [24]: linalg.det(arr)\n        Out[24]: -2.0\n        \n        In [25]: linalg.det(np.ones((3,4)))\n        ---------------------------------------------------------------------------\n        ValueError                                Traceback (most recent call last)\n        <ipython-input-25-375ad1d49940> in <module>()\n        ----> 1 linalg.det(np.ones((3,4)))\n        \n        /usr/lib/python2.7/site-packages/scipy/linalg/basic.pyc in det(a, overwrite_a)\n            398     a1 = np.asarray_chkfinite(a)\n            399     if len(a1.shape) != 2 or a1.shape[0] != a1.shape[1]:\n        --> 400         raise ValueError('expected square matrix')\n            401     overwrite_a = overwrite_a or _datacopied(a1, a)\n            402     fdet, = get_flinalg_funcs(('det',), (a1,))\n        \n        ValueError: expected square matrix\n\npy.linalg.inv()`函数计算方阵的逆：\n\n        In [26]: arr = np.array([[1, 2],\n                        [3, 4]])\n        \n        In [27]: iarr = linalg.inv(arr)\n        \n        In [28]: iarr\n        Out[28]: \n        array([[-2. ,  1. ],\n               [ 1.5, -0.5]])\n        \n        In [29]: np.allclose(np.dot(arr, iarr), np.eye(2))\n        Out[29]: True\n\n最后计算奇异阵的逆(它的行列式为0)将会引发(raise)`LinAlgError`：\n\n        In [32]: arr = np.array([[3, 2],\n                        [6, 4]])\n        \n        In [33]: linalg.inv(arr)\n        ---------------------------------------------------------------------------\n        LinAlgError                               Traceback (most recent call last)\n        <ipython-input-33-52c04c854a80> in <module>()\n        ----> 1 linalg.inv(arr)\n        \n        /usr/lib/python2.7/site-packages/scipy/linalg/basic.pyc in inv(a, overwrite_a)\n            346             inv_a, info = getri(lu, piv, overwrite_lu=1)\n            347     if info > 0:\n        --> 348         raise LinAlgError(\"singular matrix\")\n            349     if info < 0:\n            350         raise ValueError('illegal value in %d-th argument of internal '\n        \n        LinAlgError: singular matrix\n\n-   还有更多高级运算，如奇异值分解(SVD):\n\n        In [34]: arr = np.arange(9).reshape((3, 3)) + np.diag([1, 0, 1])\n        \n        In [35]: uarr, spec, vharr = linalg.svd(arr)\n\n    它的结果数组谱是：\n\n        In [36]: spec\n        Out[36]: array([ 14.88982544,   0.45294236,   0.29654967])\n\n    原始矩阵可以由svd的输出用`np.dot`点乘重新组合得到：\n\n        In [37]: sarr = np.diag(spec)\n        \n        In [38]: svd_mat = uarr.dot(sarr).dot(vharr)\n        \n        In [39]: np.allclose(svd_mat, arr)\n        Out[39]: True\n\nSVD在信号处理和统计中运用很广。许多其它标准分解(QR,LU,Cholesky,Schur)，还有线性系统的解也可以从[scipy.linalg](http://docs.scipy.org/doc/scipy/reference/linalg.html#scipy.linalg)中获得。\n\n## 快速傅里叶变换：scipy.fftpack\n\n[scipy.fftpack](http://docs.scipy.org/doc/scipy/reference/fftpack.html#scipy.fftpack)模块用来计算快速傅里叶变换。作为示例，一个(噪声)输入信号可能像这样：\n\n      In [40]: time_step = 0.02\n      \n      In [41]: period = 5\n      \n      In [42]: time_vec = np.arange(0, 20, time_step)\n      \n      In [43]: sig = np.sin(2 * np.pi / period * time_vec) + \\\n         ....: 0.5 * np.random.randn(time_vec.size)\n\n观测者并不指导信号频率，仅仅等间隔取样信号sig。信号应该来自一个真实的函数所以傅里叶变换将是对称的。[scipy.fftpack.fftfreq()](http://docs.scipy.org/doc/scipy/reference/generated/scipy.fftpack.fftfreq.html#scipy.fftpack.fftfreq)函数将生成取样频率，[scipy.fftpack.fft()](http://docs.scipy.org/doc/scipy/reference/generated/scipy.fftpack.fft.html#scipy.fftpack.fft)将计算快速傅里叶变换：\n\n因为功率结果是对称的，仅仅需要使用谱的正值部分来找出频率：\n\n      In [48]: pidxs = np.where(sample_freq > 0)\n      \n      In [49]: freqs = sample_freq[pidxs]\n      \n      In [50]: power = np.abs(sig_fft)[pidxs]\n\n信号频率可以这样被找到：\n\n      In [51]: freq = freqs[power.argmax()]\n      \n      In [52]: np.allclose(freq, 1./period)\n      Out[52]: True\n\n现在高频噪声将被从傅里叶变换信号中移除：\n\n      In [53]: sig_fft[np.abs(sample_freq) > freq] = 0\n\n得到滤波信号，可以用`scipy.fftpack.ifft`函数计算：\n\n      In [54]: main_sig = fftpack.ifft(sig_fft)\n\n结果可以这样可视化：\n\n      In [55]: plt.figure()\n      Out[55]: <matplotlib.figure.Figure at 0x4a9fb50>\n      \n      In [56]: plt.plot(time_vec, sig)\n      Out[56]: [<matplotlib.lines.Line2D at 0x4ad3790>]\n      \n      In [57]: plt.plot(time_vec, main_sig, linewidth=3)\n      /usr/lib/python2.7/site-packages/numpy/core/numeric.py:320: ComplexWarning: Casting complex values to real discards the imaginary part\n        return array(a, dtype, copy=False, order=order)\n      Out[57]: [<matplotlib.lines.Line2D at 0x4ad3dd0>]\n      \n      In [58]: plt.xlabel('Time [s]')\n      Out[58]: <matplotlib.text.Text at 0x4aad050>\n      \n      In [59]: plt.ylabel('Amplitude')\n      Out[59]: <matplotlib.text.Text at 0x4aadbd0>\n      \n      In [60]: plt.show()\n\n**[numpy.fft](http://docs.scipy.org/doc/numpy/reference/routines.fft.html#numpy.fft)**\n\nNumpy也有一个FFT实现(numpy.fft)。然而，通常scipy的应该优先使用，因为它使用了更有效率的底层实现。\n\n### 工作示例：找到原始周期\n\n[source code](http://scipy-lectures.github.com/plot_directive/intro/solutions/periodicity_finder.py)\n\n[source code](http://scipy-lectures.github.com/plot_directive/intro/solutions/periodicity_finder.py)\n\n### 工作示例：高斯图像模糊\n\n卷积：\n\n$$\nf_1(t) = \\int dt'K(t-t')f_0(t')\n$$\n\n$$\n\\tilde{f_1}(\\omega)=\\tilde{K}(\\omega)\\tilde{f_0}(\\omega)\n$$\n\n**练习：登月图片消噪**\n\n![moonlanding.png](http://scipy-lectures.github.com/_images/moonlanding.png)\n\n\n1. 检查提供的图像moonlanding.png，该图像被周期噪声严重污染了。在这个练习中，我们旨在使用快速傅里叶变换清除噪声。\n2. 用`plt.imread`加载图像。\n3. 使用`scipy.fftpack`中的2-D傅里叶函数找到并绘制图像的谱线(傅里叶变换)。可视化这个谱线对你有问题吗？如果有，为什么？\n4. 这个谱包含高频和低频成分。噪声是在谱线的高频部分中，所以设置一些成分为0(使用数组切片)。\n5. 应用逆傅里叶变换来看最后的图像。\n\n![我的消除噪声实例……](http://fmn.rrimg.com/fmn056/20121022/2330/p_large_PyL8_4bee00000f241263.jpg)\n\n## 优化和拟合：scipy.optimize\n\n优化是找到最小值或等式的数值解的问题。\n\n`scipy.optimization`子模块提供了函数最小值(标量或多维)、曲线拟合和寻找等式的根的有用算法。\n\n    from scipy import optimize\n\n**找到标量函数的最小值**\n\n让我们定义以下函数\n\n    In [2]: def f(x):\n       ...:     return x**2 + 10 * np.sin(x)\n\n然后绘制它：\n\n    In [3]: x = np.arange(-10, 10, 0.1)\n    \n    In [4]: plt.plot(x, f(x))\n    Out[4]: [<matplotlib.lines.Line2D at 0x3e2a4d0>]\n    \n    In [5]: plt.show()\n\n![optimization](http://scipy-lectures.github.com/_images/scipy_optimize_example1.png)\n\n该函数在大约-1.3有个全局最小值,在3.8有个局部最小值。\n\n找到这个函数最小值一般而有效的方法是从初始点使用梯度下降法。BFGS算法[^1]是做这个的好方法：\n\n    In [6]: optimize.fmin_bfgs(f, 0)\n    Optimization terminated successfully.\n             Current function value: -7.945823\n             Iterations: 5\n             Function evaluations: 24\n             Gradient evaluations: 8\n    Out[6]: array([-1.30644003])\n\n这个方法一个可能的问题在于，如果函数有局部最小值，算法会因初始点不同找到这些局部最小而不是全局最小:\n\n    In [7]: optimize.fmin_bfgs(f, 3, disp=0)\n    Out[7]: array([ 3.83746663])\n\n如果我们不知道全局最小值的邻近值来选定初始点，我们需要借助于耗费资源些的全局优化。为了找到全局最小点，最简单的算法是蛮力算法[^2]，该算法求出给定格点的每个函数值。\n\n    In [10]: grid = (-10, 10, 0.1)\n    \n    In [11]: xmin_global = optimize.brute(f, (grid,))\n    \n    In [12]: xmin_global\n    Out[12]: array([-1.30641113])\n\n对于大点的格点，`scipy.optimize.brute()`变得非常慢。`scipy.optimize.anneal()`提供了使用模拟退火的替代函数。对已知的不同类别全局优化问题存在更有效率的算法，但这已经超出scipy的范围。一些有用全局优化软件包是[OpenOpt](http://openopt.org/Welcome)、[IPOPT](https://github.com/xuy/pyipopt)、[PyGMO](http://pagmo.sourceforge.net/pygmo/index.html)和[PyEvolve](http://pyevolve.sourceforge.net/)。\n\n为了找到局部最小，我们把变量限制在`(0, 10)`之间，使用`scipy.optimize.fminbound()`:\n\n    In [13]: xmin_local = optimize.fminbound(f, 0, 10)\n    \n    In [14]: xmin_local\n    Out[14]: 3.8374671194983834\n\n**注意：**在高级章节部分[数学优化：找到函数最小值](http://scipy-lectures.github.com/advanced/mathematical_optimization/index.html#mathematical-optimization)中有关于寻找函数最小值更详细的讨论。\n\n**找到标量函数的根**\n\n为了寻找根，例如令`f(x)=0`的点，对以上的用来示例的函数`f`我们可以使用`scipy.optimize.fsolve()`:\n\n    In [17]: root = optimize.fsolve(f, 1)  # 我们的初始猜测是1\n    \n    In [18]: root\n    Out[18]: array([ 0.])\n\n注意仅仅一个根被找到。检查f的图像在-2.5附近有第二个根。我们可以通过调整我们的初始猜测找到这一确切值：\n\n    In [19]: root = optimize.fsolve(f, -2.5)\n    \n    In [20]: root\n    Out[20]: array([-2.47948183])\n\n**曲线拟合**\n\n假设我们有从被噪声污染的f中抽样到的数据：\n\n    In [21]: xdata = np.linspace(-10, 10, num=20)\n    \n    In [22]: ydata = f(xdata) + np.random.randn(xdata.size)\n\n如果我们知道函数形式(当前情况是`x^2 + sin(x)`)，但是不知道幅度。我们可以通过最小二乘拟合拟合来找到幅度。首先我们定义一个用来拟合的函数：\n\n    In [23]: def f2(x, a, b):\n       ....:     return a*x**2 + b*np.sin(x)\n\n然后我们可以使用`scipy.optimize.curve_fit()`来找到a和b：\n\n    In [24]: guess = [2, 2]\n    \n    In [25]: params, params_covariance = optimize.curve_fit(f2, xdata, ydata, guess)\n    \n    In [26]: params\n    Out[26]: array([  1.00439471,  10.04911441])\n\n现在我们找到了f的最小值和根并且对它使用了曲线拟合。我们将一切放在一个单独的图像中:\n\n![function](http://scipy-lectures.github.com/_images/scipy_optimize_example2.png)\n\n**注意：**Scipy\\>=0.11中提供所有最小化和根寻找算法的统一接口`scipy.optimize.minimize()`,`scipy.optimize.minimize_scalar()`和`scipy.optimize.root()`。它们允许通过method关键字方便地比较不同算法。\n\n你可以在`scipy.optimize`中找到用来解决多维问题的相同功能的算法。\n\n**练习：曲线拟合温度数据**\n\n在阿拉斯加每个月的温度上下限，从一月开始，以摄氏单位给出。\n\nmax: | 17,  19,  21,  28,  33,  38, 37,  37,  31,  23,  19,  18\n--|--\nmin: | -62, -59, -56, -46, -32, -18, -9, -13, -25, -46, -52, -58\n\n1. 绘制这些温度限\n2. 定义函数来描述最小和最大温度。提示：这个函数以一年为周期。提示：包括时间偏移。\n3. 对数据使用这个函数`scipy.optimize.curve_fit()`\n4. 绘制结果。是否拟合合理？如果不合理，为什么？\n5. 拟合精度的最大最小温度的时间偏移是否一样？\n\n**练习：2维最小化**\n\n[source code](http://scipy-lectures.github.com/plot_directive/pyplots/scipy_optimize_sixhump.py)\n\n六峰值驼背函数：\n\n$$\nf(x,y) = (4 - 2.1x^2 + \\frac{x^4}{3})x^2 + xy + (4y^2 - 4)y^2\n$$\n\n有全局和多个局部最小。找到这个函数的全局最小。\n\n提示：\n\n- 变量应该限制在`-2 < x < 2 , -1 < y < 1`.\n- 使用`numpy.meshgrid()`和`plt.imshow`来可视地搜寻区域。\n- 使用`scipy.optimize.fmin_bfgs()`或其它多维极小化器。\n\n这里有多少极小值？这些点上的函数值是多少？如果初始猜测是`(x, y) = (0, 0)`会发生什么？\n\n参见总结练习[非线性最小二乘拟合：在点抽取地形激光雷达数据上的应用](http://scipy-lectures.github.com/intro/summary-exercises/optimize-fit.html#summary-exercise-optimize)，来看另一个，更高级的例子。\n\n## 统计和随机数： scipy.stats\n\n`scipy.stats`包括统计工具和随机过程的概率过程。各个随机过程的随机数生成器可以从`numpy.random`中找到。\n\n### 直方图和概率密度函数\n\n给定一个随机过程的观察值，它们的直方图是随机过程的pdf(概率密度函数)的估计器：\n\n    In [1]: import numpy as np\n    \n    In [2]: a = np.random.normal(size=1000)\n    \n    In [3]: bins = np.arange(-4, 5)\n    \n    In [4]: bins\n    Out[4]: array([-4, -3, -2, -1,  0,  1,  2,  3,  4])\n    \n    In [5]: histogram = np.histogram(a, bins=bins, normed=True)[0]\n    \n    In [6]: bins = 0.5*(bins[1:] + bins[:-1])\n    \n    In [7]: bins\n    Out[7]: array([-3.5, -2.5, -1.5, -0.5,  0.5,  1.5,  2.5,  3.5])\n    \n    In [8]: from scipy import stats\n    \n    In [9]: b = stats.norm.pdf(bins)  # norm是正态分布\n    \n    In [10]: import matplotlib.pyplot as plt\n    \n    In [11]: plt.plot(bins, histogram)\n    Out[11]: [<matplotlib.lines.Line2D at 0x3378b10>]\n    \n    In [12]: plt.plot(bins, b)\n    Out[12]: [<matplotlib.lines.Line2D at 0x3378fd0>]\n\n    In [13]: plt.show()\n\n如果我们知道随机过程属于给定的随机过程族，比如正态过程。我们可以对观测值进行最大似然拟合来估计基本分布参数。这里我们对观测值拟合一个正态过程：\n\n    In [14]: loc, std = stats.norm.fit(a)\n    \n    In [15]: loc\n    Out[15]: 0.0052651057415999758\n    \n    In [16]: std\n    Out[16]: 0.97945439802779732\n\n**练习：概率分布**\n\n从参数为1的伽马分布生成1000个随机数,然后绘制这些样点的直方图。你能够在其上绘制pdf吗(应该匹配)？\n\n另外：这些分布有些有用的方法。通过阅读它们的文档字符串或使用IPython的tab补全来探索它们。你能够通过对你的随机变量使用拟合找到形状参数1吗？\n\n### 百分位\n\n中位数是来观测值之下一半之上一半的值。\n\n    In [3]: np.median(a)\n    Out[3]: -0.047679175711778043\n\n它也被叫作50百分位点，因为有50%的观测值在它之下：\n\n    In [6]: stats.scoreatpercentile(a, 50)\n    Out[6]: -0.047679175711778043\n\n同样我们可以计算百分之九十百分点：\n\n    In [7]: stats.scoreatpercentile(a, 90)\n    Out[7]: 1.2541592439997036\n\n百分位是CDF的一个估计器(累积分布函数)。\n\n### 统计检测\n\n统计检测是决策指示。例如，我们有两个样本集，我们假设它们由高斯过程生成。我们可以使用[T检验](http://en.wikipedia.org/wiki/Student%27s_t-test)来决定是否两个样本值显著不同：\n\n    In [8]: a = np.random.normal(0, 1, size=100)\n    \n    In [9]: b = np.random.normal(1, 1, size=10)\n    \n    In [10]: stats.ttest_ind(a, b)\n    Out[10]: (array(-2.4119199601156796), 0.01755485116571583)\n\n输出结果由以下部分组成：\n\n- T统计量：它是这么一种标志，与不同两个随机过程之间成比例并且幅度和差异的显著程度有关[^3]。\n- p值：两个过程相同的概率。如果接近1,这两个过程是几乎完全相同的。越靠近零，两个过程越可能有不同的均值。\n\n## 插值：scipy.interpolate\n\n`scipy.interpolate`对从实验数据拟合函数来求值没有测量值存在的点非常有用。这个模块基于来自[netlib](http://www.netlib.org/)项目的[FITPACK Fortran 子程序](http://www.netlib.org/dierckx/index.html)。\n\n通过想象接近正弦函数的实验数据：\n\n    In [1]: measured_time = np.linspace(0, 1, 10)\n    \n    In [2]: noise = (np.random.random(10)*2 - 1) * 1e-1\n    \n    In [3]: measures = np.sin(2 * np.pi * measured_time) + noise\n\n`scipy.interpolate.interp1d`类会构建线性插值函数：\n\n    In [4]: from scipy.interpolate import interp1d\n    \n    In [5]: linear_interp = interp1d(measured_time, measures)\n\n然后`scipy.interpolate.linear_interp`实例需要被用来求得感兴趣时间点的值：\n\n    In [6]: computed_time = np.linspace(0, 1, 50)\n    \n    In [7]: linear_results = linear_interp(computed_time)\n\n三次插值也能通过提供可选关键字参数`kind`来选择：[^4]\n\n    In [8]: cubic_interp = interp1d(measured_time, measures, kind='cubic')\n    \n    In [9]: cubic_results = cubic_interp(computed_time)\n\n结果现在被集合在以下Matplotlib图像中：\n\n![interpolate](http://scipy-lectures.github.com/_images/scipy_interpolation.png)\n\n[source code](http://scipy-lectures.github.com/plot_directive/pyplots/scipy_interpolation.py)\n\n`scipy.interpolate.interp2d`与`scipy.interpolate.interp1d`相似，但是面向二维数组。注意，对_interp_族，计算时间必须在测量时间范围内。参见[Maximum wind speed prediction at the Sprogø station](http://scipy-lectures.github.com/intro/summary-exercises/stats-interpolate.html#summary-exercise-stat-interp)的总结练习获得更高级的插值示例。\n\n## 数值积分：scipy.integrate **Fusy,**\n\n最通用的积分程序是`scipy.integrate.quad()`:\n\n    In [10]: from scipy.integrate import quad\n    \n    In [11]: res, err = quad(np.sin, 0, np.pi/2)\n    \n    In [12]: np.allclose(res, 1)\n    Out[12]: True\n    \n    In [13]: np.allclose(err, 1 - res)\n    Out[13]: True\n\n其它可用的积分方案有`fixed_quad`,`quadrature`,`romberg`。\n\n`scipy.integrate`也是用来积分常微分方程(ODE)的功能程序。特别是，`scipy.integrate.odeint()`是个使用LSODA(Livermore Solver for Ordinary Differential equations with Automatic method switching for stiff and non-stiff problems)通用积分器。参见[ODEPACK Fortran library](http://people.sc.fsu.edu/~jburkardt/f77_src/odepack/odepack.html)获得更多细节。\n\n`odeint`解决这种形式的一阶ODE系统：\n\n    ``dy/dt = rhs(y1, y2, .., t0,...)``\n\n作为简介，让我们解决ODE`dy/dt = -2y`,区间`t = 0..4`,初始条件`y(t=0) = 1`。首先函数计算导数的位置需要被定义：\n\n    In [17]: def calc_derivative(ypos, time, counter_arr):\n       ....:     counter_arr += 1\n       ....:     return -2 * ypos                                               \n       ....:     \n\n一个额外的参数`counter_arr`被添加，用来说明函数可能在单个时间步中被多次调用，直到解收敛。计数数组被定义成：\n\n    In [18]: counter = np.zeros((1,), dtype=np.uint16)            \n\n弹道将被计算：\n\n    In [19]: from scipy.integrate import odeint                                 \n    In [20]: time_vec = np.linspace(0, 4, 40)                                   \n    In [21]: yvec, info = odeint(calc_derivative, 1, time_vec,\n       ....: args=(counter,), full_output=Tru)\n\n因此导函数可以被调用40次(即时间步长数)，\n\n    In [22]: counter\n    Out[22]: array([129], dtype=uint16)\n\n十个最初的时间点(time step)每个的累积迭代次数，可以这样获得：\n\n    In [23]: info['nfe'][:10]\n    Out[23]: array([31, 35, 43, 49, 53, 57, 59, 63, 65, 69], dtype=int32)\n\n注意到在第一个时间步的解需要更多的迭代。解`yvec`的轨道现在可以被画出：\n\n![ODE](http://scipy-lectures.github.com/_images/odeint_introduction.png)\n\n[source code](http://scipy-lectures.github.com/plot_directive/pyplots/odeint_introduction.py)\n\n另一个使用`scipy.integrate.odeint()`的例子是一个阻尼弹簧-质点振荡器(二阶振荡)。附加在弹簧上质点的位置服从二阶常微分方程`y'' + eps wo y' + wo^2 y= 0`。其中`wo^2 = k/m`,k是弹簧常数，m是质量，`eps=c/(2 m wo)`，c是阻尼系数。(译者：为什么不用latex……)对于这个例子，我们选择如下参数：\n\n    In [24]: mass = 0.5  # kg\n    \n    In [25]: kspring = 4  # N/m\n    \n    In [26]: cviscous = 0.4  # N s/m\n\n所以系统将是阻尼振荡，因为：\n\n    In [27]: eps = cviscous / (2 * mass * np.sqrt(kspring/mass))\n    \n    In [28]: eps < 1\n    Out[28]: True\n\n对于`scipy,integrate.odeint()`求解器，二阶方程需要被转化成一个包含向量`Y =y,y'`的两个一阶方程的系统。定义`nu = 2 eps * wo = c / m`和`om = wo^2 = k/m`很方便：\n\n    In [29]: nu_coef = cviscous /mass\n    \n    In [30]: om_coef = kspring / mass\n\n因此函数将计算速度和加速度通过：\n\n    In [31]: def calc_deri(yvec, time, nuc, omc):\n       ....:     return (yvec[1], -nuc * yvec[1] - omc * yvec[0])\n       ....: \n    \n    In [32]: time_vec = np.linspace(0, 10, 100)\n    \n    In [33]: yarr = odeint(calc_deri, (1, 0), time_vec, args=(nu_coef, om_coef))\n\n最终的位置和速度在如下Matplotlib图像中显示：\n\n![ode2](http://scipy-lectures.github.com/_images/odeint_damped_spring_mass.png)\n\n[source code](http://scipy-lectures.github.com/plot_directive/pyplots/odeint_damped_spring_mass.py)\n\nScipy中不存在偏微分方程(PDE)求解器,一些解决PDE问题的Python软件包可以得到，像[fipy](http://www.ctcms.nist.gov/fipy/)和[SfePy](http://code.google.com/p/sfepy/)\n\n(译者注:[Python科学计算中洛伦兹吸引子微分方程的求解](http://hyry.dip.jp:8000/pydoc/scipy_intro.html#id5)\n\n## 信号处理：scipy.signal\n\n    In [34]: from scipy import signal\n\n- `scipy.signal.detrend()`：移除信号的线性趋势：\n\n        In [35]: t = np.linspace(0, 5, 100)\n        \n        In [36]: x = t + np.random.normal(size=100)\n        \n        In [39]: import pylab as pl\n        \n        In [40]: pl.plot(t, x, linewidth=3)\n        Out[40]: [<matplotlib.lines.Line2D at 0x3903c90>]\n        \n        In [41]: pl.plot(t, signal.detrend(x), linewidth=3)\n        Out[41]: [<matplotlib.lines.Line2D at 0x3b38810>]\n\n![detrend](http://scipy-lectures.github.com/_images/demo_detrend.png)\n\n[source code](http://scipy-lectures.github.com/plot_directive/pyplots/demo_detrend.py)\n\n- `scipy.signal.resample()`:使用FFT重采样n个点。\n\n        In [42]: t = np.linspace(0, 5, 100)\n        \n        In [43]: x = np.sin(t)\n        \n        In [44]: pl.plot(t, x, linewidth=3)\n        Out[44]: [<matplotlib.lines.Line2D at 0x3f08a90>]\n        \n        In [45]: pl.plot(t[::2], signal.resample(x, 50), 'ko')\n        Out[45]: [<matplotlib.lines.Line2D at 0x3f12950>]\n\n![resample](http://scipy-lectures.github.com/_images/demo_resample.png)\n\n[source code](http://scipy-lectures.github.com/plot_directive/pyplots/demo_resample.py)\n\n- Signal中有许多窗函数：scipy.signal.hamming(), scipy.signal.bartlett(), scipy.signal.blackman()...\n\n- Signal中有滤波器(中值滤波scipy.signal.medfilt(), 维纳滤波scipy.signal.wiener())，但是我们将在图像部分讨论。\n\n## 图像处理：scipy.ndimage\n\nscipy中致力于图像处理的子模块是`scipy,ndimage`。\n\n    In [49]: from scipy import ndimage\n\n图像处理程序可以根据它们执行的操作类别来分类。\n\n### 图像的几何变换\n\n改变方向，分辨率……\n\n    In [50]: from scipy import misc\n    \n    In [51]: lena = misc.lena()\n    \n    In [52]: shifted_lena = ndimage.shift(lena, (50, 50))\n    \n    In [53]: shifted_lena2 = ndimage.shift(lena, (50, 50), mode='nearest')\n    \n    In [54]: rotated_lena = ndimage.rotate(lena, 30)\n    \n    In [55]: cropped_lena = lena[50:-50, 50:-50]\n    \n    In [56]: zoomed_lena = ndimage.zoom(lena, 2)\n    \n    In [57]: zoomed_lena.shape\n    Out[57]: (1024, 1024)\n    \n    In [63]: pl.subplot(321)\n    Out[63]: <matplotlib.axes.AxesSubplot at 0x4c00d90>\n    \n    In [64]: pl.imshow(lena, cmap=cm.gray)\n    Out[64]: <matplotlib.image.AxesImage at 0x493aad0>\n    \n    In [65]: pl.subplot(322)\n    Out[65]: <matplotlib.axes.AxesSubplot at 0x4941a10>\n\n    In [66]: #等等\n\n### 图像滤镜\n\n    In [76]: from scipy import misc\n    \n    In [77]: lena = misc.lena()\n    \n    In [78]: import numpy as np\n    \n    In [79]: noisy_lena = np.copy(lena).astype(np.float)\n    \n    In [80]: noisy_lena += lena.std()*0.5*np.random.standard_normal(lena.shape)\n    \n    In [81]: blurred_lena = ndimage.gaussian_filter(noisy_lena, sigma=3)\n    \n    In [82]: median_lena = ndimage.median_filter(blurred_lena, size=5)\n    \n    In [83]: from scipy import signal\n    \n    In [84]: wiener_lena = signal.wiener(blurred_lena, (5,5))\n\n许多其它`scipy.ndimage.filters`和`scipy.signal`中的滤镜可以被应用到图像中。\n\n**练习**\n\n比较不同滤镜图像的直方图\n\n### 数学形态学\n\n数学形态学是源于几何论的数学形态学。它具有结合结构的特点并变换几何结构。二值图(黑白图)，特别能被用该理论转换：要转换的集合是邻近的非零值像素。这个理论也被拓展到灰度图中。\n\n基本的数学形态操作使用一个_结构元素(structuring element)_来改变其它几何结构。\n\n让我们首先生成一个结构元素：\n\n    In [129]: el = ndimage.generate_binary_structure(2, 1)\n    \n    In [130]: el\n    Out[130]: \n    array([[False,  True, False],\n           [ True,  True,  True],\n           [False,  True, False]], dtype=bool)\n    \n    In [131]: el.astype(np.int)\n    Out[131]: \n    array([[0, 1, 0],\n           [1, 1, 1],\n           [0, 1, 0]])\n\n- 腐蚀\n\n      In [132]: a = np.zeros((7,7), dtype=int)\n      \n      In [133]: a[1:6, 2:5] = 1\n      \n      In [134]: a\n      Out[134]: \n      array([[0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 1, 1, 1, 0, 0],\n             [0, 0, 1, 1, 1, 0, 0],\n             [0, 0, 1, 1, 1, 0, 0],\n             [0, 0, 1, 1, 1, 0, 0],\n             [0, 0, 1, 1, 1, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0]])\n      \n      In [135]: ndimage.binary_erosion(a).astype(a.dtype)\n      Out[135]: \n      array([[0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 1, 0, 0, 0],\n             [0, 0, 0, 1, 0, 0, 0],\n             [0, 0, 0, 1, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0]])\n      \n      In [xxx]:# 腐蚀移除对象使结构更小\n \n      In [136]: ndimage.binary_erosion(a, structure=np.ones((5,5))).astype(a.dtype)\n      Out[136]: \n      array([[0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0],\n             [0, 0, 0, 0, 0, 0, 0]])\n\n- 膨胀\n\n      In [137]: a = np.zeros((5,5))\n      \n      In [138]: a[2, 2] = 1\n      \n      In [139]: a\n      Out[139]: \n      array([[ 0.,  0.,  0.,  0.,  0.],\n             [ 0.,  0.,  0.,  0.,  0.],\n             [ 0.,  0.,  1.,  0.,  0.],\n             [ 0.,  0.,  0.,  0.,  0.],\n             [ 0.,  0.,  0.,  0.,  0.]])\n      \n      In [140]: ndimage.binary_dilation(a).astype(a.dtype)\n      Out[140]: \n      array([[ 0.,  0.,  0.,  0.,  0.],\n             [ 0.,  0.,  1.,  0.,  0.],\n             [ 0.,  1.,  1.,  1.,  0.],\n             [ 0.,  0.,  1.,  0.,  0.],\n             [ 0.,  0.,  0.,  0.,  0.]])\n\n- 开操作(opening)\n\n      In [141]: a = np.zeros((5,5), dtype=np.int)\n      \n      In [142]: a[1:4, 1:4] = 1; a[4, 4] = 1\n      \n      In [143]: a\n      Out[143]: \n      array([[0, 0, 0, 0, 0],\n             [0, 1, 1, 1, 0],\n             [0, 1, 1, 1, 0],\n             [0, 1, 1, 1, 0],\n             [0, 0, 0, 0, 1]])\n      \n      In [144]: # 开操作可以移除小的对象\n      \n      In [145]: ndimage.binary_opening(a, structure=np.ones((3,3))).astype(np.int)Out[145]: \n      array([[0, 0, 0, 0, 0],\n             [0, 1, 1, 1, 0],\n             [0, 1, 1, 1, 0],\n             [0, 1, 1, 1, 0],\n             [0, 0, 0, 0, 0]])\n      \n      In [146]: # 开操作也能平滑边角\n      \n      In [147]: ndimage.binary_opening(a).astype(np.int)\n      Out[147]: \n      array([[0, 0, 0, 0, 0],\n             [0, 0, 1, 0, 0],\n             [0, 1, 1, 1, 0],\n             [0, 0, 1, 0, 0],\n             [0, 0, 0, 0, 0]])\n\n- 闭操作(closing): `ndimage.binary_closing`\n\n**练习**\n\n查看开操作腐蚀，然后膨胀的量\n\n一个开操作移除小的结构，而一个闭操作填补小的空洞。这种操作因此可被用来“清理”图像。\n\n    In [149]: a = np.zeros((50, 50))\n    \n    In [150]: a[10:-10, 10:-10] = 1\n    \n    In [151]: a += 0.25*np.random.standard_normal(a.shape)\n    \n    In [152]: mask = a>=0.5\n    \n    In [153]: opened_mask = ndimage.binary_opening(mask)\n    \n    In [154]: closed_mask = ndimage.binary_closing(opened_mask)\n\n**练习**\n\n验证重构区域比初始区域更小。(如果闭操作在开操作之前则相反)\n\n对灰度值图像，腐蚀(或者是膨胀)相当于用被集中在所关心像素点的结构元素所覆盖像素的最小(或最大)值替代当前像素点。\n\n    In [173]: a = np.zeros((7,7), dtype=np.int)\n    \n    In [174]: a[1:6, 1:6] = 3\n    \n    In [175]: a[4,4] = 2; a[2,3] = 1\n    \n    In [176]: a\n    Out[176]: \n    array([[0, 0, 0, 0, 0, 0, 0],\n           [0, 3, 3, 3, 3, 3, 0],\n           [0, 3, 3, 1, 3, 3, 0],\n           [0, 3, 3, 3, 3, 3, 0],\n           [0, 3, 3, 3, 2, 3, 0],\n           [0, 3, 3, 3, 3, 3, 0],\n           [0, 0, 0, 0, 0, 0, 0]])\n    \n    In [177]: ndimage.grey_erosion(a, size=(3,3))\n    Out[177]: \n    array([[0, 0, 0, 0, 0, 0, 0],\n           [0, 0, 0, 0, 0, 0, 0],\n           [0, 0, 1, 1, 1, 0, 0],\n           [0, 0, 1, 1, 1, 0, 0],\n           [0, 0, 3, 2, 2, 0, 0],\n           [0, 0, 0, 0, 0, 0, 0],\n           [0, 0, 0, 0, 0, 0, 0]])\n    \n### 图像测量\n\n让我们首先生成一个漂亮的合成图像：\n\n    In [178]: x, y = np.indices((100, 100))\n    \n    In [179]: sig = np.sin(2*np.pi*x/50.)*np.sin(2*np.pi*y/50.)*(1+x*y/50.**2)**2\n    \n    In [180]: mask = sig > 1\n\n现在我们查找图像中对象的各种信息：\n\n    In [181]: labels, nb = ndimage.label(mask)\n    \n    In [182]: nb\n    Out[182]: 8\n    \n    In [183]: areas = ndimage.sum(mask, labels, xrange(1, labels.max()+1))\n    \n    In [184]: areas\n    Out[184]: array([ 190.,   45.,  424.,  278.,  459.,  190.,  549.,  424.])\n    \n    In [185]: maxima = ndimage.maximum(sig, labels, xrange(1, labels.max()+1))\n    In [186]: maxima\n    Out[186]: \n    array([  1.80238238,   1.13527605,   5.51954079,   2.49611818,\n             6.71673619,   1.80238238,  16.76547217,   5.51954079])\n    \n    In [187]: ndimage.find_objects(labels==4)\n    Out[187]: [(slice(30L, 48L, None), slice(30L, 48L, None))]\n    \n    In [188]: sl = ndimage.find_objects(labels==4)\n    \n    In [189]: import pylab as pl\n    \n    In [190]: pl.imshow(sig[sl[0]])  \n    Out[190]: <matplotlib.image.AxesImage at 0xb2fdcd0>\n\n参见总结练习[Image processing application: counting bubbles and unmolten grains](http://scipy-lectures.github.com/intro/summary-exercises/image-processing.html#summary-exercise-image-processing)获取更多高级示例。\n\n## 总结练习\n\n(译者：我不是很懂……)\n\n总结练习主要使用Numpy，Scipy和Matplotlib。它们提供一些现实生活中用Python计算的示例。既然基本的Numpy和scipy使用已经被介绍了，欢迎有兴趣的用户尝试这些练习。\n\n练习：\n\n[斯普罗站最大风速预测](http://scipy-lectures.github.com/intro/summary-exercises/stats-interpolate.html)\n\n[非线性最小二乘拟合：地形雷达数据的点提取](http://scipy-lectures.github.com/intro/summary-exercises/optimize-fit.html)\n\n[图像处理应用：计数气泡和未融颗粒](http://scipy-lectures.github.com/intro/summary-exercises/image-processing.html)\n\n建议的解：\n\n[图像处理练习解的示例:玻璃中的未融颗粒](http://scipy-lectures.github.com/intro/summary-exercises/answers_image_processing.html)\n\n## Footnotes\n\n[^1]:[BFGS算法](http://en.wikipedia.org/wiki/BFGS_method)\n[^2]:[Brute-Force方法](http://en.wikipedia.org/wiki/Brute-force_search)\n[^3]:……这解释，我真不懂。但t统计量是什么我知道……\n[^4]:numpy 0.17可能会有bug\n";
}});
//# sourceMappingURL=111.efb0e2f380ada2f66f11.js.map