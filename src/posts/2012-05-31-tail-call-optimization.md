---
layout: post
title: "Tail Call Optimization"
excerpt: "Tail call optimization in lisp interpreter"
category: lisp
tags: [land-of-lisp]
disqus: true
---


## 什么是尾递归

尾递归作为一种函数式编程优化方法。为了理解这个奇怪的名字，看下面这个计算列表长度函数的例子:

```cl
(defun my-length (lst)
  (if lst
      (1+ (my-length (cdr lst)))
      0))
```

首先，它会检查列表是否是空的，如果不是，它递归地调用自身计算剩下列表的长度并加上1,如果是空的则返回0.

结果是这个函数相当没有效率…………我们可以试试一个“大列表”：

```cl
(defparameter *biglist* (loop for i below 100000 collect 'x))
```

在clisp中试试……

```cl
(my-length *biglist*)

*** - Program stack overflow. RESET
```

stack overflow！！问题出现在`+1`函数上，它告诉lisp解释器：“首先计算列表的长度，然后对结果调用`+1`。”
问题是每次我们递归调用`my-length`时，lisp必须记住我们之后要向结果添加1。由于列表有100000项长，lisp在它能`+1`之前要记住99999次！！clisp的做法是在堆栈中放个提示符，这导致最后堆栈溢出。

我们如何避免这个问题呢？我们重新定义我们的`my-length`函数

```cl linenos
(defun my-length (lst)
  (labels ((f (lst acc)
              (if lst
                 (f (cdr lst) (1+ acc))
                 acc)))
     (f lst 0)))
```

我们定义了一个局部函数`f`作为list-eater,但同时多了个acc累加器。这个累加器累加遇到的列表数目，最开始调用f时acc置0.

通过使用累加器，递归调用f不再需要向结果`+1`。当我们到达列表尾部（lst is nil），acc即为列表项数目，所以我们返回它。

`f`最后做的是，当列表没到结尾时不断,调用自己。这种函数调用自身或其它函数的行为叫做*尾递归*,lisp解释器足够哦聪明去认出这种尾递归，它知道可以直接调用自身而不用等着把当前程序推入堆栈。

有点像Basic中的goto和c++中的longjmp，但lisp中尾递归十分安全。

## clisp中的尾递归优化

并非所有的lisp解释器并不会进行尾递归优化，因为尾递归这种减少使用堆栈的方式不适合调试。

为了在clisp中使用尾递归，我们可以这样

```cl
(compile 'my-length)
(my-length *biglist*)
```

有没有感觉速度超快？

## Variable Shadowing

注意`my-length`函数中参数lst和f中的lst，在每次递归调用中后者将取代前者，这种处理方式叫做Variable Shadowing.
