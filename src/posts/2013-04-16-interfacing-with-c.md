---
layout: post
title: "C接口(译)"
excerpt: "scipy lecture notes"
category: python
tags: [scipy-lecture-notes, python, c]
disqus: true
---


翻译自[scipy lecture notes: Interfacing with C](http://scipy-lectures.github.io/advanced/interfacing_with_c/interfacing_with_c.html)

作者：Valentin Haenel

这个章节包含许多在python代码中支持c/c++本机代码的许多不同方法， 通常这个过程叫作包裹(wrapping)。本章的目的是让您大致知道有那些技术和它们分别的优缺点是什么，于是您能够为您自己的特定需要选择何时的技术。在任何情况下，一旦您开始包裹，您几乎一定将想要查阅您所选技术各自的文档。

---

**目录**

* toc
{: toc}

---

## 简介

本章节包含以下技术：

- [Python-C-Api](http://docs.python.org/2/c-api/)
- [Ctypes](http://docs.python.org/2/library/ctypes.html)
- [SWIG(简单包裹和接口生成)](http://www.swig.org/)
- [Cython](http://cython.org/)

这四种方法大概是最著名的，其中Cython可能是最高级且应该优先使用的。如果您想从其它角度理解包裹问题，其它方法也很重要。已经说过，虽然还有其它方法，但是理解以上基本方法，您将能评估您自己的选择看是否符合自己的需要。

以下标准在评估一项技术时也许有用：

- 是否需要额外的库？
- 代码是否是自动生成的？
- 需要编译吗？
- 和Numpy数组进行交互方便吗？
- 支持C++吗？

首先，您应该考虑你的用例。当用本机代码接口时，通常有两个用例：

- 存在需要充分利用的C/C++代码，或者那些代码已经存在，或者那些代码更快。
- Python代码慢爆了，将内循环交给本机代码处理

每个技术通过包裹`math.h`中的`cos`函数实现。尽管这是微不足道的例子，它将很好的展示基本的包裹问题。因为每个技术也包括某种形式的Numpy支持，这也通过使用一个余弦函数被在某种数组上计算的例子来展示。

最后但重要的是两个小警告：

- 所有这些技术都可能造成Python解释器崩溃(段错误)，这(通常)是C代码的Bug。
- 所有例子在linux上完成，也应该能在其它操作系统上实现
- 大多数例子中你需要一个C编译器

## Python-C-Api

[Python-C-API](http://docs.python.org/2/c-api/)是标准Python解释器(就是所谓的CPython)的支柱。使用这个API可以用C或C++语言编写Python扩展。显然这些扩展模块可以凭借语言兼容性，调用任何C或C++写成的函数。

当使用Python-C-API时，人们通常写许多样板代码，先解析传递给函数的参数，然后构建并返回类型。

**优点**

- 无需额外的库
- 许多低级的控制
- 完全可以用C++

**劣势**

- 可能需要大量工作
- 代码中的大量开销
- 必须编译
- 高额的维护代价
- 当跨Python版本时若C-Api变化没有后向兼容性

**注意：以下Python-C-Api示例主要为了展示需要。因为大多其它技术实际上依赖这个，所以最好对它如何工作有个高层次的了解。在99%的用例中你最好使用其它技术。**

### 示例

以下C扩展模块，让标准数学库中的`cos`函数在Python中可用：

```python
/*  Example of wrapping cos function from math.h with the Python-C-API. */

#include <Python.h>
#include <math.h>

/*  wrapped cosine function */
static PyObject* cos_func(PyObject* self, PyObject* args)
{
    double value;
    double answer;

    /*  parse the input, from python float to c double */
    if (!PyArg_ParseTuple(args, "d", &value))
        return NULL;
    /* if the above function returns -1, an appropriate Python exception will
     * have been set, and the function simply returns NULL
     */

    /* call cos from libm */
    answer = cos(value);

    /*  construct the output from cos, from c double to python float */
    return Py_BuildValue("f", answer);
}

/*  define functions in module */
static PyMethodDef CosMethods[] =
{
     {"cos_func", cos_func, METH_VARARGS, "evaluate the cosine"},
     {NULL, NULL, 0, NULL}
};

/* module initialization */
PyMODINIT_FUNC

initcos_module(void)
{
     (void) Py_InitModule("cos_module", CosMethods);
}
```

如您所见，所有对参数处理、返回类型和模块初始化都相当样板化。然而有些被摊销了，当扩展增长时，样板需要每个函数保留。

标准python构建系统`distutils`支持从`setup.py`编译C扩展，这相当方便。

```python
from distutils.core import setup, Extension

# define the extension module
cos_module = Extension('cos_module', sources=['cos_module.c'])

# run the setup
setup(ext_modules=[cos_module])
```

这能被编译：

```bash
 ~/Work/scipy-lecture-notes/interfacing-with-c ⮀ ls
cos_module.c  setup.py
 ~/Work/scipy-lecture-notes/interfacing-with-c ⮀ python setup.py build_ext --inplace
running build_ext
building 'cos_module' extension
x86_64-pc-linux-gnu-gcc -pthread -fPIC -I/usr/include/python2.7 -c cos_module.c -o build/temp.linux-x86_64-2.7/cos_module.o
x86_64-pc-linux-gnu-gcc -pthread -shared build/temp.linux-x86_64-2.7/cos_module.o -L/usr/lib64 -lpython2.7 -o /home/lyy/Work/scipy-lecture-notes/interfacing-with-c/cos_module.so
 ~/Work/scipy-lecture-notes/interfacing-with-c ⮀ ls
build  cos_module.c  cos_module.so  setup.py
```

- `build_ext`是用来构建扩展模块的
- `--inplace`将编译好的扩展模块输出到当前文件夹

文件`cos_module.so`包含编译的扩展，我们能将它加载到IPython解释器中：

```python
In [1]: import cos_module

In [2]: cos_module?
Type:       module
String Form:<module 'cos_module' from 'cos_module.so'>
File:       /home/lyy/Work/scipy-lecture-notes/interfacing-with-c/cos_module.so
Docstring:  <no docstring>

In [3]: dir(cos_module)
Out[3]: ['__doc__', '__file__', '__name__', '__package__', 'cos_func']

In [4]: cos_module.cos_func(1.0)
Out[4]: 0.5403023058681398

In [5]: cos_module.cos_func(0.0)
Out[5]: 1.0

In [6]: cos_module.cos_func(3.14159265359)
Out[6]: -1.0

```

现在让我们看看它有多健壮：

```python
In [7]: cos_module.cos_func('foo')
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-7-11bee483665d> in <module>()
----> 1 cos_module.cos_func('foo')

TypeError: a float is required
```

### Numpy支持

类似于Python-C-API,Numpu自身作为C扩展实现也有[Numpy-C-API](http://docs.scipy.org/doc/numpy/reference/c-api.html)。这个API可以在写自定的C扩展时，被用来从C创建和操作Numpy数组。参见[高级Numpy](http://scipy-lectures.github.io/advanced/interfacing_with_c/interfacing_with_c.html#id3)

以下例子展示了如何将Numpy数组作为参数传递给函数，如何使用(老的)Numpy-C-API遍历整个Numpy数组。它仅仅将数组作为参数，运用来自`math.h`中的余弦函数，并且返回一个新的结果数组。

```python
/*  Example of wrapping the cos function from math.h using the Numpy-C-API. */

#include <Python.h>
#include <numpy/arrayobject.h>
#include <math.h>

/*  wrapped cosine function */
static PyObject* cos_func_np(PyObject* self, PyObject* args)
{

    PyArrayObject *in_array;
    PyObject      *out_array;
    PyArrayIterObject *in_iter;
    PyArrayIterObject *out_iter;

    /*  parse single numpy array argument */
    if (!PyArg_ParseTuple(args, "O!", &PyArray_Type, &in_array))
        return NULL;

    /*  construct the output array, like the input array */
    out_array = PyArray_NewLikeArray(in_array, NPY_ANYORDER, NULL, 0);
    if (out_array == NULL)
        return NULL;

    /*  create the iterators */
    /* TODO: this iterator API is deprecated since 1.6
     *       replace in favour of the new NpyIter API */
    in_iter  = (PyArrayIterObject *)PyArray_IterNew((PyObject*)in_array);
    out_iter = (PyArrayIterObject *)PyArray_IterNew(out_array);
    if (in_iter == NULL || out_iter == NULL)
        goto fail;

    /*  iterate over the arrays */
    while (in_iter->index < in_iter->size
            && out_iter->index < out_iter->size) {
        /* get the datapointers */
        double * in_dataptr = (double *)in_iter->dataptr;
        double * out_dataptr = (double *)out_iter->dataptr;
        /* cosine of input into output */
        *out_dataptr = cos(*in_dataptr);
        /* update the iterator */
        PyArray_ITER_NEXT(in_iter);
        PyArray_ITER_NEXT(out_iter);
    }

    /*  clean up and return the result */
    Py_DECREF(in_iter);
    Py_DECREF(out_iter);
    Py_INCREF(out_array);
    return out_array;

    /*  in case bad things happen */
    fail:
        Py_XDECREF(out_array);
        Py_XDECREF(in_iter);
        Py_XDECREF(out_iter);
        return NULL;
}

/*  define functions in module */
static PyMethodDef CosMethods[] =
{
     {"cos_func_np", cos_func_np, METH_VARARGS,
         "evaluate the cosine on a numpy array"},
     {NULL, NULL, 0, NULL}
};

/* module initialization */
PyMODINIT_FUNC

initcos_module_np(void)
{
     (void) Py_InitModule("cos_module_np", CosMethods);
     /* IMPORTANT: this must be called */
     import_array();
}
```

我们仍可使用distutils编译这个。然而，我们必须通过使用`numpy.get_include()`保证包含了Numpy头文件。

```python
from distutils.core import setup, Extension
import numpy

# define the extension module
cos_module_np = Extension('cos_module_np', sources=['cos_module_np.c'],
                          include_dirs=[numpy.get_include()])

# run the setup
setup(ext_modules=[cos_module_np])
```

为确信它确实能用我们做以下测试脚本：

```python
import cos_module_np
import numpy as np
import pylab

x = np.arange(0, 2 * np.pi, 0.1)
y = cos_module_np.cos_func_np(x)
pylab.plot(x, y)
pylab.show()
```

结果将如下图

![figure1](http://scipy-lectures.github.io/_images/test_cos_module_np.png)

## Ctypes

[Ctypes](http://docs.python.org/2/library/ctypes.html)是一个Python的外部函数库。它提供了兼容C的数据类型。并且允许调用DLL或共享库中的函数。它能够被用来将这些库用纯Python包裹。

**优势**

- Python标准库的一部分
- 不必编译
- 完全用Python包裹代码

**劣势**

- 需要将代码包裹作为共享库获得(粗略地说就是Windows中的`*.dll`、Linux下的`*.so`和Mac OSX的`*.dylib`)
- 对C++支持不好

### 示例

如上所述，包裹的代码是纯Python的。

```python
""" Example of wrapping cos function from math.h using ctypes. """

import ctypes
from ctypes.util import find_library

# find and load the library
libm = ctypes.cdll.LoadLibrary(find_library('m'))
# set the argument type
libm.cos.argtypes = [ctypes.c_double]
# set the return type
libm.cos.restype = ctypes.c_double


def cos_func(arg):
    ''' Wrapper for cos from math.h '''
    return libm.cos(arg)
```

- 寻找和加载库可能依赖于不同的操作系统，检查[文档](http://docs.python.org/2/library/ctypes.html#loading-dynamic-link-libraries)获取细节。
- 这稍微有点虚幻，因为在系统上已经存在编译好的数学库。如果你将包裹一个在自己的库，你将不得不先编译它。这也许需要也许不需要额外的工作。

我们现在如前述那样使用它：

```python
In [1]: import cos_module

In [2]: cos_module?
Type:       module
String Form:<module 'cos_module' from 'cos_module.py'>
File:       /home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/ctypes/cos_module.py
Docstring:  <no docstring>

In [3]: dir(cos_module)
Out[3]:
['__builtins__',
 '__doc__',
 '__file__',
 '__name__',
 '__package__',
 'cos_func',
 'ctypes',
 'find_library',
 'libm']

In [4]: cos_module.cos_func(1.0)
Out[4]: 0.5403023058681398

In [5]: cos_module.cos_func(0.0)
Out[5]: 1.0

In [6]: cos_module.cos_func(3.14159265359)
Out[6]: -1.0
```

正如之前的例子，这个代码稍微健壮一些。尽管错误信息不怎么有用，因它并没告诉我们应该是什么类型。

```python
In [7]: cos_module.cos_func('foo')
---------------------------------------------------------------------------
ArgumentError                             Traceback (most recent call last)
<ipython-input-7-11bee483665d> in <module>()
----> 1 cos_module.cos_func('foo')

/home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/ctypes/cos_module.py in cos_func(arg)
     12 def cos_func(arg):
     13     ''' Wrapper for cos from math.h '''
---> 14     return libm.cos(arg)

ArgumentError: argument 1: <type 'exceptions.TypeError'>: wrong type
```

### Numpy支持

Numpy包含一些对ctypes接口的支持。特别是有导出Numpy数组作为ctypes数据类型的某一属性的支持，并且有将C数组和Numpy数组互相转化的函数。

更多信息参考[Numpy Cookbook](http://www.scipy.org/Cookbook/Ctypes)中相应章节和[numpy.ndarray.ctypes](http://docs.scipy.org/doc/numpy/reference/generated/numpy.ndarray.ctypes.html)和[numpy.ctypeslib](http://docs.scipy.org/doc/numpy/reference/routines.ctypeslib.html)的API文档。

在以下例子中，让我们考虑一个库中的C函数，这个函数接受一个数组作为输入并输出一个数组，计算输入数组的正弦值并将结果存储在输出数组中。

这个库包含以下头文件(尽管就这个例子不严格需要，为完整性需要我们列出它)：

```c
void cos_doubles(double * in_array, double * out_array, int size);
```

这个实现在C源码中如下：

```c
#include <math.h>

/*  Compute the cosine of each element in in_array, storing the result in
 *  out_array. */
void cos_doubles(double * in_array, double * out_array, int size){
    int i;
    for(i=0;i<size;i++){
        out_array[i] = cos(in_array[i]);
    }
}
```

因为这个库是纯C的，我们不能使用`distutils`来编译它。必须同时使用`make`和`gcc`:


```c
m.PHONY : clean

libcos_doubles.so : cos_doubles.o
	gcc -shared -Wl,-soname,libcos_doubles.so -o libcos_doubles.so cos_doubles.o

cos_doubles.o : cos_doubles.c
	gcc -c -fPIC cos_doubles.c -o cos_doubles.o

clean :
	-rm -vf libcos_doubles.so cos_doubles.o cos_doubles.pyc
```

我们接着可以将之编译到共享库`libcos_double.so`中(linux下):

```bash
$ ls
cos_doubles.c  cos_doubles.h  cos_doubles.py  makefile  test_cos_doubles.py
$ make
gcc -c -fPIC cos_doubles.c -o cos_doubles.o
gcc -shared -Wl,-soname,libcos_doubles.so -o libcos_doubles.so cos_doubles.o
$ ls
cos_doubles.c  cos_doubles.o   libcos_doubles.so*  test_cos_doubles.py
cos_doubles.h  cos_doubles.py  makefile
```

接着我们能继续通过ctypes库对(某些类型)Numpy数组的直接支持包裹这个库了：

```python
""" Example of wrapping a C library function that accepts a C double array as
    input using the numpy.ctypeslib. """

import numpy as np
import numpy.ctypeslib as npct
from ctypes import c_int

# input type for the cos_doubles function
# must be a double array, with single dimension that is contiguous
array_1d_double = npct.ndpointer(dtype=np.double, ndim=1, flags='CONTIGUOUS')

# load the library, using numpy mechanisms
libcd = npct.load_library("libcos_doubles", ".")

# setup the return typs and argument types
libcd.cos_doubles.restype = None
libcd.cos_doubles.argtypes = [array_1d_double, array_1d_double, c_int]


def cos_doubles_func(in_array, out_array):
    return libcd.cos_doubles(in_array, out_array, len(in_array))
```

- 注意连续单维Numpy数组的固有限制，因为C函数要求这种缓冲区。[^1]
- 注意输出数组必须预先分配，例如通过`numpy.zeros()`，这个函数将写进它的缓冲区。
- 尽管`cos_doubles`函数的原始参数是`ARRAY, ARRAY, int`，最终的`cos_doubles_func`仅仅接受两个Numpy数组作为参数。

像之前一样，我们相信它能够工作：

```python
import numpy as np
import pylab
import cos_doubles

x = np.arange(0, 2 * np.pi, 0.1)
y = np.empty_like(x)

cos_doubles.cos_doubles_func(x, y)
pylab.plot(x, y)
pylab.show()
```

![test cos doubles](http://scipy-lectures.github.io/_images/test_cos_doubles.png)

## SWIG

[SWIG](http://www.swig.org/), 简化包裹接口生成器，是一个将不同高级编程语言包括Python链接到用C和C++写的程序上的软件开发工具。SWIG重要的功能是，它能自动为你生成包裹代码。这就开发时间来说是个优势，也可能是个负担。生成文件趋于巨大，读起来不友好，包裹过程的结果就是多个间接层，可能有点难以理解。

**注意：自动生成的C代码使用Python-C-Api。**

**优势**

- 可以自动包裹给定头文件的整个库
- 对C++工作很好

**劣势**

- 自动生成巨大的文件
- 若出错难以调试
- 陡峭的学习曲线

### 示例

让我们假设我们的`cos`函数位于用C写成的`cos_module`中，源代码文件为`cos_module.c`。

```c
#include <math.h>

double cos_func(double arg){
    return cos(arg);
}
```

头文件为`cos_module.h`：

```python
double cos_func(double arg);
```

我们的任务是将`cos_func`暴露给Python。为了用SWIG实现这个，我们必须写一个包含SWIG指令的接口文件。

```c
/*  Example of wrapping cos function from math.h using SWIG. */

%module cos_module
%{
    /* the resulting C file should be built as a python extension */
    #define SWIG_FILE_WITH_INIT
    /*  Includes the header in the wrapper code */
    #include "cos_module.h"
%}
/*  Parse the header file to generate wrappers */
%include "cos_module.h"
```

如您所见，需要太多代码了。在这个简单的例子中在接口文件中仅仅包含头文件就足够将函数暴露给Python。然而，SWIG允许更细粒度地包含/排除头文件中的函数，查看文档获取更多细节。

产生编译的包裹代码是一个两个阶段的过程：

1. 对接口文件运行swig生成文件`cos_module_wrap.c`，这是用来自动生成Python的C扩展的源代码文件。`cos_module.py`是自动生成的纯Python模块。
2. 编译`cos_module_wrap.c`为`_cos_module.so`。幸运的是，`distutils`知道如何处理SWIG接口文件，所以我们的`setup.py`很简单：

```python
from distutils.core import setup, Extension

setup(ext_modules=[Extension("_cos_module",
      sources=["cos_module.c", "cos_module.i"])])
```

```bash
$ cd advanced/interfacing_with_c/swig

$ ls
cos_module.c  cos_module.h  cos_module.i  setup.py

$ python setup.py build_ext --inplace
running build_ext
building '_cos_module' extension
swigging cos_module.i to cos_module_wrap.c
swig -python -o cos_module_wrap.c cos_module.i
creating build
creating build/temp.linux-x86_64-2.7
gcc -pthread -fno-strict-aliasing -g -O2 -DNDEBUG -g -fwrapv -O3 -Wall -Wstrict-prototypes -fPIC -I/home/esc/anaconda/include/python2.7 -c cos_module.c -o build/temp.linux-x86_64-2.7/cos_module.o
gcc -pthread -fno-strict-aliasing -g -O2 -DNDEBUG -g -fwrapv -O3 -Wall -Wstrict-prototypes -fPIC -I/home/esc/anaconda/include/python2.7 -c cos_module_wrap.c -o build/temp.linux-x86_64-2.7/cos_module_wrap.o
gcc -pthread -shared build/temp.linux-x86_64-2.7/cos_module.o build/temp.linux-x86_64-2.7/cos_module_wrap.o -L/home/esc/anaconda/lib -lpython2.7 -o /home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/swig/_cos_module.so

$ ls
build/  cos_module.c  cos_module.h  cos_module.i  cos_module.py  _cos_module.so*  cos_module_wrap.c  setup.py
```

现在我们能加载和执行`cos_module`，就好像我们之前做的：

```python
In [1]: import cos_module

In [2]: cos_module?
Type:       module
String Form:<module 'cos_module' from 'cos_module.py'>
File:       /home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/swig/cos_module.py
Docstring:  <no docstring>

In [3]: dir(cos_module)
Out[3]:
['__builtins__',
 '__doc__',
 '__file__',
 '__name__',
 '__package__',
 '_cos_module',
 '_newclass',
 '_object',
 '_swig_getattr',
 '_swig_property',
 '_swig_repr',
 '_swig_setattr',
 '_swig_setattr_nondynamic',
 'cos_func']

In [4]: cos_module.cos_func(1.0)
Out[4]: 0.5403023058681398

In [5]: cos_module.cos_func(0.0)
Out[5]: 1.0

In [6]: cos_module.cos_func(3.14159265359)
Out[6]: -1.0
```

我们再次检验健壮性，看到得到了更好的错误信息(然而，严格地说Python中没有`double`类型)：

```python
In [7]: cos_module.cos_func('foo')
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-7-11bee483665d> in <module>()
----> 1 cos_module.cos_func('foo')

TypeError: in method 'cos_func', argument 1 of type 'double'
```

### Numpy支持

numpy通过`numpy.i`文件提供了[对SWIG的支持](http://docs.scipy.org/doc/numpy/reference/swig.html)。这个接口文件定义了各种所谓的类型映射(typemaps)来转换Numpy数组和C数组。在下面的例子中我们将简略地看看这种类型映射在实际中如何起作用。

我们使用在ctypes例子中相同的`cos_doubles`函数：

```c
void cos_doubles(double * in_array, double * out_array, int size);
```

```python
#include <math.h>

/*  Compute the cosine of each element in in_array, storing the result in
 *  out_array. */
void cos_doubles(double * in_array, double * out_array, int size){
    int i;
    for(i=0;i<size;i++){
        out_array[i] = cos(in_array[i]);
    }
}
```

使用SWIG接口文件将它包裹为`cos_doubles_func`：

```c
/*  Example of wrapping a C function that takes a C double array as input using
 *  numpy typemaps for SWIG. */

%module cos_doubles
%{
    /* the resulting C file should be built as a python extension */
    #define SWIG_FILE_WITH_INIT
    /*  Includes the header in the wrapper code */
    #include "cos_doubles.h"
%}

/*  include the numpy typemaps */
%include "numpy.i"
/*  need this for correct module initialization */
%init %{
    import_array();
%}

/*  typemaps for the two arrays, the second will be modified in-place */
%apply (double* IN_ARRAY1, int DIM1) {(double * in_array, int size_in)}
%apply (double* INPLACE_ARRAY1, int DIM1) {(double * out_array, int size_out)}

/*  Wrapper for cos_doubles that massages the types */
%inline %{
    /*  takes as input two numpy arrays */
    void cos_doubles_func(double * in_array, int size_in, double * out_array, int size_out) {
        /*  calls the original funcion, providing only the size of the first */
        cos_doubles(in_array, out_array, size_in);
    }
%}
```

- 为了使用Numpy类型映射，需要`numpy.i`文件。
- 观察`import_array()`的调用，我们已经在Numpy-C-Api的例子中见到过。
- 因为类型映射仅仅支持参数`ARRAY, SIZE`我们需要包裹`cos_doubles`为`cos_doubles_func`，该函数接受两个数组包含各自大小作为输入。
- 相对于简单SWIG的例子，我们不需要包含`cos_doubles.h`头文件，因为我们通过`cos_doubles_func`暴露这个功能，我们没有其它东西想暴露给Python。

然后，如前述用distutils包裹它：

```python
from distutils.core import setup, Extension
import numpy

setup(ext_modules=[Extension("_cos_doubles",
      sources=["cos_doubles.c", "cos_doubles.i"],
      include_dirs=[numpy.get_include()])])
```

显然，我们需要`include_dirs`指定位置。

```bash
$ ls
cos_doubles.c  cos_doubles.h  cos_doubles.i  numpy.i  setup.py  test_cos_doubles.py
$ python setup.py build_ext -i
running build_ext
building '_cos_doubles' extension
swigging cos_doubles.i to cos_doubles_wrap.c
swig -python -o cos_doubles_wrap.c cos_doubles.i
cos_doubles.i:24: Warning(490): Fragment 'NumPy_Backward_Compatibility' not found.
cos_doubles.i:24: Warning(490): Fragment 'NumPy_Backward_Compatibility' not found.
cos_doubles.i:24: Warning(490): Fragment 'NumPy_Backward_Compatibility' not found.
creating build
creating build/temp.linux-x86_64-2.7
gcc -pthread -fno-strict-aliasing -g -O2 -DNDEBUG -g -fwrapv -O3 -Wall -Wstrict-prototypes -fPIC -I/home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include -I/home/esc/anaconda/include/python2.7 -c cos_doubles.c -o build/temp.linux-x86_64-2.7/cos_doubles.o
gcc -pthread -fno-strict-aliasing -g -O2 -DNDEBUG -g -fwrapv -O3 -Wall -Wstrict-prototypes -fPIC -I/home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include -I/home/esc/anaconda/include/python2.7 -c cos_doubles_wrap.c -o build/temp.linux-x86_64-2.7/cos_doubles_wrap.o
In file included from /home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/ndarraytypes.h:1722,
                 from /home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/ndarrayobject.h:17,
                 from /home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/arrayobject.h:15,
                 from cos_doubles_wrap.c:2706:
/home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/npy_deprecated_api.h:11:2: warning: #warning "Using deprecated NumPy API, disable it by #defining NPY_NO_DEPRECATED_API NPY_1_7_API_VERSION"
gcc -pthread -shared build/temp.linux-x86_64-2.7/cos_doubles.o build/temp.linux-x86_64-2.7/cos_doubles_wrap.o -L/home/esc/anaconda/lib -lpython2.7 -o /home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/swig_numpy/_cos_doubles.so
$ ls
build/         cos_doubles.h  cos_doubles.py    cos_doubles_wrap.c  setup.py
cos_doubles.c  cos_doubles.i  _cos_doubles.so*  numpy.i             test_cos_doubles.py
```

接着，确信它起作用：

```python
import numpy as np
import pylab
import cos_doubles

x = np.arange(0, 2 * np.pi, 0.1)
y = np.empty_like(x)

cos_doubles.cos_doubles_func(x, y)
pylab.plot(x, y)
pylab.show()
```

![test_cos_doubles1](http://scipy-lectures.github.io/_images/test_cos_doubles1.png)

## Cython

Cython不仅使用来写C扩展的Python样子的语言，而且是这个语言的一个高级编译器。Cython语言是Python的超集，包含额外的结构允许你调用C函数，将变量和类属性解释为C类型。在这个意义上可以叫它Python的一个类型。

除了这些几本的包裹原生代码的用例，Cython支持一个额外的用例，即交互优化。基本上是，从纯Python代码脚本出发逐步向代码瓶颈增加Cython类型来优化那些真正值得优化的代码。

在这个意义上它和SWIG非常相似，因为C代码可以自动生成，但某种意义上它也相当类似与ctypes，因为它包裹代码可以(几乎可以)用Python写成。

尽管其它自动生成代码方案会很难调试(例如SWIG)，Cython带有一个GNU调试器的扩展，能帮助调试Python，Cython和C代码。

**注意：自动生成的C代码使用了Python-C-Api。**

**优势**

- 类Python的语言来写C扩展
- 自动生成代码
- 支持增量优化
- 包含一个GNU调试器扩展
- 支持C++(自从0.13版本)

**劣势**

- 必须编译
- 需要额外的库(但仅仅在编译时，这个问题可以通过传递一个生成的C文件克服)

### 示例

我们`cos_module`的主要的Cython代码包含在文件`cos_module.pyx`中：

```python
""" Example of wrapping cos function from math.h using Cython. """

cdef extern from "math.h":
    double cos(double arg)

def cos_func(arg):
    return cos(arg)
```

注意额外的关键字像`cdef`和`extern`。`cos_func`紧接着是纯Python。

我们再次使用标准`distutils`模块，但是这次我们需要一些来自`Cython.Distutils`额外的片段：

```python
from distutils.core import setup, Extension
from Cython.Distutils import build_ext

setup(
    cmdclass={'build_ext': build_ext},
    ext_modules=[Extension("cos_module", ["cos_module.pyx"])]
)
```

编译它：

```bash
$ cd advanced/interfacing_with_c/cython
$ ls
cos_module.pyx  setup.py
$ python setup.py build_ext --inplace
running build_ext
cythoning cos_module.pyx to cos_module.c
building 'cos_module' extension
creating build
creating build/temp.linux-x86_64-2.7
gcc -pthread -fno-strict-aliasing -g -O2 -DNDEBUG -g -fwrapv -O3 -Wall -Wstrict-prototypes -fPIC -I/home/esc/anaconda/include/python2.7 -c cos_module.c -o build/temp.linux-x86_64-2.7/cos_module.o
gcc -pthread -shared build/temp.linux-x86_64-2.7/cos_module.o -L/home/esc/anaconda/lib -lpython2.7 -o /home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/cython/cos_module.so
$ ls
build/  cos_module.c  cos_module.pyx  cos_module.so*  setup.py
```

然后运行它：

```python
In [1]: import cos_module

In [2]: cos_module?
Type:       module
String Form:<module 'cos_module' from 'cos_module.so'>
File:       /home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/cython/cos_module.so
Docstring:  <no docstring>

In [3]: dir(cos_module)
Out[3]:
['__builtins__',
 '__doc__',
 '__file__',
 '__name__',
 '__package__',
 '__test__',
 'cos_func']

In [4]: cos_module.cos_func(1.0)
Out[4]: 0.5403023058681398

In [5]: cos_module.cos_func(0.0)
Out[5]: 1.0

In [6]: cos_module.cos_func(3.14159265359)
Out[6]: -1.0
```

接着，测试健壮性，可以看到我们获得了很棒的错误信息：

```python
In [7]: cos_module.cos_func('foo')
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-7-11bee483665d> in <module>()
----> 1 cos_module.cos_func('foo')

/home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/cython/cos_module.so in cos_module.cos_func (cos_module.c:506)()

TypeError: a float is required
```

另外，值得注意的是Cython带有完整的C数学库声明，将之上代码简化为：

```python
""" Simpler example of wrapping cos function from math.h using Cython. """

from libc.math cimport cos

def cos_func(arg):
    return cos(arg)
```

在这个例子中`cimport`声明被用来import`cos`函数。

### Numpy支持

Cython通过`numpy.pyx`文件支持Numpy，这允许你将Numpy数组类型添加到Cython代码。例如将`i`指定为`int`类型，将变量`a`指定为`numpy.ndarray`并给定`dtype`。某些优化像边界检查也支持。参看[Cython文档](http://docs.cython.org/src/tutorial/numpy.html)的相关章节。万一你想将Numpy数组作为C数组传递给你的Cython包裹的C代码，[Cython维基](http://wiki.cython.org/tutorials/NumpyPointerToC)中有一个章节。

在以下例子中，我们将展示如何如何使用Cython包裹熟悉的`cos_doubles`函数。

```c
void cos_doubles(double * in_array, double * out_array, int size);
```

```c
#include <math.h>

/*  Compute the cosine of each element in in_array, storing the result in
 *  out_array. */
void cos_doubles(double * in_array, double * out_array, int size){
    int i;
    for(i=0;i<size;i++){
        out_array[i] = cos(in_array[i]);
    }
}
```

该函数使用以下Cython代码被包裹为`cos_doubles_func`：

```python
""" Example of wrapping a C function that takes C double arrays as input using
    the Numpy declarations from Cython """

# import both numpy and the Cython declarations for numpy
import numpy as np
cimport numpy as np

# if you want to use the Numpy-C-API from Cython
# (not strictly necessary for this example)
np.import_array()

# cdefine the signature of our c function
cdef extern from "cos_doubles.h":
    void cos_doubles (double * in_array, double * out_array, int size)

# create the wrapper code, with numpy type annotations
def cos_doubles_func(np.ndarray[double, ndim=1, mode="c"] in_array not None,
                     np.ndarray[double, ndim=1, mode="c"] out_array not None):
    cos_doubles(<double*> np.PyArray_DATA(in_array),
                <double*> np.PyArray_DATA(out_array),
                in_array.shape[0])
```

可以使用`distutils`编译：

```python
from distutils.core import setup, Extension
import numpy
from Cython.Distutils import build_ext

setup(
    cmdclass={'build_ext': build_ext},
    ext_modules=[Extension("cos_doubles",
                 sources=["_cos_doubles.pyx", "cos_doubles.c"],
                 include_dirs=[numpy.get_include()])],
)
```

- 如上编译Numpy的例子，我们需要`include_dirs`选项。

```bash
$ ls
cos_doubles.c  cos_doubles.h  _cos_doubles.pyx  setup.py  test_cos_doubles.py
$ python setup.py build_ext -i
running build_ext
cythoning _cos_doubles.pyx to _cos_doubles.c
building 'cos_doubles' extension
creating build
creating build/temp.linux-x86_64-2.7
gcc -pthread -fno-strict-aliasing -g -O2 -DNDEBUG -g -fwrapv -O3 -Wall -Wstrict-prototypes -fPIC -I/home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include -I/home/esc/anaconda/include/python2.7 -c _cos_doubles.c -o build/temp.linux-x86_64-2.7/_cos_doubles.o
In file included from /home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/ndarraytypes.h:1722,
                 from /home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/ndarrayobject.h:17,
                 from /home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/arrayobject.h:15,
                 from _cos_doubles.c:253:
/home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/npy_deprecated_api.h:11:2: warning: #warning "Using deprecated NumPy API, disable it by #defining NPY_NO_DEPRECATED_API NPY_1_7_API_VERSION"
/home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include/numpy/__ufunc_api.h:236: warning: ‘_import_umath’ defined but not used
gcc -pthread -fno-strict-aliasing -g -O2 -DNDEBUG -g -fwrapv -O3 -Wall -Wstrict-prototypes -fPIC -I/home/esc/anaconda/lib/python2.7/site-packages/numpy/core/include -I/home/esc/anaconda/include/python2.7 -c cos_doubles.c -o build/temp.linux-x86_64-2.7/cos_doubles.o
gcc -pthread -shared build/temp.linux-x86_64-2.7/_cos_doubles.o build/temp.linux-x86_64-2.7/cos_doubles.o -L/home/esc/anaconda/lib -lpython2.7 -o /home/esc/git-working/scipy-lecture-notes/advanced/interfacing_with_c/cython_numpy/cos_doubles.so
$ ls
build/  _cos_doubles.c  cos_doubles.c  cos_doubles.h  _cos_doubles.pyx  cos_doubles.so*  setup.py  test_cos_doubles.py
```

如前述确保它能起作用：

```python
import numpy as np
import pylab
import cos_doubles

x = np.arange(0, 2 * np.pi, 0.1)
y = np.empty_like(x)

cos_doubles.cos_doubles_func(x, y)
pylab.plot(x, y)
pylab.show()
```

![test_cos_doubles2](http://scipy-lectures.github.io/_images/test_cos_doubles2.png)

## 总结

这个章节中四种不同和本地代码接口技术被呈现在您面前。这个表格简要的总结了这些技术的某些方面。

x 	|Part of CPython 	|Compiled 	|Autogenerated 	|Numpy Support
|:------|:----|:-----|:-----|:----|
Python-C-Api 	|True 	|True 	|False 	|True |
Ctypes 		|True 	|False 	|False 	|True |
Swig 		|False 	|True 	|True 	|True |
Cython 		|False 	|True 	|True 	|True | 

相比所有技术中，Cython是最现代最高级的了。特别是，通过向Python代码中添加类型增量优化代码的能力是独一无二的。

## 更多阅读和参考

- [Gaël Varoquaux的关于避免复制数据的博文](http://gael-varoquaux.info/blog/?p=157)对于如何聪明的处理内存管理提供了一些深刻的见解。如果你曾经碰到过大数据集的问题，这是一个可以激发灵感的参考。

## 练习

因这是一个全新的章节，这些练习更可视为是接下来看什么的指针。所以选择您最感兴趣的那个。如果你对此有更多好的想法，请联系我们！

1. 下载每个练习的源码并在你的机器上编译运行。
2. 对每个例子做小的修改确信它能起作用。(像将`cos`改成`sin`)
3. 大多数例子，特别是涉及Numpy的例子可能仍然对错误输入很脆弱、并且返回模糊的消息。寻找使这些例子出问题的方法，指出问题是什么并且设计潜在的解决方案。这有一些提示：
   
   1. 数值溢出
   2. 输入输出数组长度不同
   3. 多维数组
   4. 空数组
   5. 非`double`型数组

4. 使用IPython中的magic`%timeit`来测量不同方案的执行时间。

### Python-C-Api

1. 更改Numpy的例子让函数接受两个输入参数，第二个参数是预分配的输出数组，让它像其它Numpy例子。
2. 更改例子让函数仅仅接受一个输入数组并且原地修改。
3. 尝试使用[Numpy迭代协议](http://docs.scipy.org/doc/numpy/reference/c-api.iterator.html)修正例子，如果你设法获取了一个工作的解决方案，请在github上发布一个拉取请求(pull-request)。
4. 你也许注意到了，Numpy-C-API例子是唯一不包裹`cos_double`但是直接将`cos`应用到Numpy数组的元素的Numpy例子。这相对于其它技术有什么优势？
5. 你能仅仅使用NJumpy-C-API包裹`cos_doubles`吗？你可能需要确保数组是正确的类型，并且在内存中一维连续。

### Ctypes

1. 更改像`cos_double_func`的Numpy例子为你处理预分配，使之更像Numpy-C-Api例子。

### SWIG

1. 查看SWIG自动生成的代码，你能理解多少？
2. 更改Numpy的例子像`cos_double_func`处理预分配，让它更像Numpy-C-API的例子。
3. 更改C函数`cos_doubles`让它返回一个分配的数组。你能用SWIG类型映射包裹它？如果不能，为何不行？有没有特定条件的变通方案。(提示：你知道输出数组的大小，所以可能从返回的`double *`构建一个Numpy数组。)

### Cython

1. 查看Cython自动生成的代码。仔细看看Cython插入的一些注释。你看到了什么？
2. 查看Cython文档的章节[Working with Numpy](http://docs.cython.org/src/tutorial/numpy.html)去学习使用Numpy如何增量优化纯python代码。
3. 更改Numpy例子比如`cos_doubles_func`处理预分配，使之更像Numpy-C-Api例子。

## FootNotes

[^1]:我不懂，还没看Advanced Numpy部分
