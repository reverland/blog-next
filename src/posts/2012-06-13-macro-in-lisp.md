---
layout: post
title: "Macro in lisp"
excerpt: "简要介绍lisp中宏的使用"
category: lisp
tags: [land-of-lisp]
disqus: true
---


# lisp宏的魔力

## lisp的宏

注意：此宏远与cpp中的宏有着天壤之别，而且远复杂很多倍。
宏编程允许你创造自己的语言。当面对一个复杂编程挑战时，有经验的程序猿会问自己：那种语言适合解决这个问题？然后他用宏把lisp变成了那种语言。太扯了……

先举例说明什么是宏

看这个例子

```cl
(defun add (a b)
  (let ((x (+ a b)))
    (format t "The sum is ~a" x)
    x)) 
(add 3 4)
```

有没有感觉括号太多了？我们定义个let1宏

```cl
(defmacro let1 (var val &body body)
  `(let ((,var ,val))
     ,@body))
```

&body表示剩下的部分是表达式，而且隐含着一个progn的并行表达式，回忆"`"与","的作用",@"相对于"，"用来表征并行表达式。

试试你的宏

```cl
(let ((foo (+ 2 3)))
  (* foo foo))
(let1 foo (+ 2 3)
  (* foo foo))
(defun add (a b)
  (let1 x (+ a b)
    (format t "The sum is ~a" x)
    x))
```

## 宏展开

宏的展开发生在运行期前，它把你非标准的程序转换成标准的lisp语言,然后传递给标准lisp解释器

你可以用macroexpand来展开宏

```cl
(macroexpand '(let1 foo (+ 2 3)
                (* foo foo)))
```

这将是很有效的调试方法。

## 更复杂一些的宏

回忆下之前我们定义的尾递归优化length函数

```cl
(defun my-length (lst)
  (labels ((f (lst acc)
             (if lst
               (f (cdr lst) (1+ acc))
               acc)))
    (f lst 0)))
```

正如所见，我们反复使用cdr，反复检查列表是否为空。我们用冗长的工作去创造局部函数f，我们可以用宏让它更简洁一些。

### 一个分割列表的宏

一个能把列表分开，并能把列表头和尾提供给我们用split宏非常有用。我们可以得到这么一个有bug的宏：

```cl
;Warning!Containing Bugs!
(defmacro split (val yes no)
  `(if ,val
     (let ((head (car ,val))
           (tail (cdr ,val)))
       ,yes)
     ,no))
```

列表的car和cdr分别保存在head和tail中。如果列表不能split，将不会创建head和tail变量。

于是my-length函数整洁些了

```cl
(defun my-length (lst)
  (labels ((f (lst acc)
             (split lst
                    (f tail (1+ acc))
                    acc)))
    (f lst 0)))
```

### 避免重复的执行

试试这样：

```cl
(split (progn (princ "Lisp rocks!")
              '(2 3))
       (format t "This can be split into ~a and ~a." head tail)
       (format t "This cannot be split."))
```

哦～为什么会执行三次打印Lisp rocks！展开宏看看

```cl
(macroexpand '(split (progn (princ "Lisp rocks!")
                            '(2 3))
                     (format t "THis can be split into ~a and ~a." head tail)
                     (format t "This cannot be split")))
```

你看到了什么……某动作被执行了三次。

我很惊异的是这种情况common lisp也接受，还可以这样把命令写在函数中。

```cl
(car (progn (princ "Lisp rocks!") '(2 3)))
Lisp rocks!
2
```

为了避免这种情况我们重新改写split宏，注意，还是有bug的版本

```cl
;Warning! Still contains a bug!
(defmacro split (val yes no) 
  `(let1 x ,val 
     (if x 
       (let ((head (car x))
             (tail (cdr x)))
         ,yes) 
         ,no))) 
```

可以在宏内使用其它宏，像这里我们用了之前的let1宏。我们用一个变量绑定表达式，这时就不会重复执行了。但有了个新问题。

### 避免变量捕获

问题在哪里呢？试试下面的式子

```cl
(let1 x 100
  (split '(2 3)
         (+ x head)
         nil))
```

什么情况，竟然报错了！！我们展开它看看

```cl
(macroexpand '(split '(2 3)
                     (+ x head)
                     nil))
```

split意外地捕获了外部变量x并且覆盖了前者。怎么避免这个问题？？
这个函数专门用来解决这类问题

```cl
(gensym)
```

它返回随机的名字，并且一定不会和已有的变量重复。使用它我们可以获得最终能安全使用的split版本

```cl
(defmacro split (val yes no)
  (let1 g (gensym)
    `(let1 ,g ,val
       (if ,g
         (let ((head (car ,g))
               (tail (cdr ,g)))
           ,yes)
         ,no))))
```

两次绑定，先随机生成一个变量名，在把具体的值绑在这个随机生成的变量名上。可以展开看看

```cl
;Each time is different
(macroexpand '(split '(2 3)
                     (+ x head)
                     nil))
```

每次结果都不同。

## 递归宏

再次考虑我们的my-length函数

```cl
(defun my-length (lst)
  (labels ((f (lst acc)
             (split lst
                    (f tail (1+ acc))
                    acc)))
    (f lst 0)))
```

局部函数f重复的建立。我们可以通过宏来简化它。想象这么一个recurse宏：

```cl
(recurse (n 9)
(fresh-line)
(if (zerop n)
(princ "lift-off!")
(progn (princ n)
(self (1- n)))))
9
8
7
6
5
4
3
2
1
lift-off!
```

为了将列表奇数项作为变量偶数项作为值，可以写一个函数来生成cons对。像这样

```cl
(pairs '(a b c d e f))
((A . B) (C . D) (E . F))
```

函数可以这样定义,看着真绕……
 
```cl
;tail-call-optimized list-eater
(defun pairs (lst)
  (labels ((f (lst acc)
             (split lst
                    (if tail
                      (f (cdr tail) (cons (cons head (car tail)) acc))
                      (reverse acc))
                    (reverse acc))))
    (f lst nil)))
```

然后可以写出recurse宏

```cl
(defmacro recurse (vars &body body)
  (let1 p (pairs vars)
    `(labels ((self ,(mapcar #'car p)
                ,@body))
       (self ,@(mapcar #'cdr p)))))
```

重新定义我们的my-length函数

```cl
(defun my-length (lst)
  (recurse (lst lst
                acc 0)
           (split lst
                  (f tail (1+ acc))
                  acc)))
```

作者费了一大圈后认为现在看着很简洁，你觉得呢？

## 宏的危险与其它选择

把语言定义成任意你想要的模式，这当然很危险。若干岁月后回头都看不懂你自己写的什么，何况别人！所以，能用函数式解决的问题就别用宏来解决吧，骚年。看看我们的my-length函数，可以用高阶函数reduce轻松简化。

```cl
(defun my-length (lst)
  (reduce (lambda (x i)
            (1+ x))
          lst
          :initial-value 0))
```

reduce可以连续调用上次结果并与当前列表项一同运算。i代表当前为第几项，对我们没什么用，最后x初值为0一定要加上。

然而仍然有些问题用函数式并不能很好解决而用宏可以轻易处理。下一章？拭目以待吧。

## 小结

- 宏允许你用代码生成代码，通过宏，你可以创造自己的语言，并在lisp解释器解释之前转化成标准lisp。

- 宏允许你摆脱一种既视感。摆脱各种括号和重复

- 当你写宏的时候你必须小心，这样才不会导致意外的重复执行的代码

- 你需要避免变量捕获，这可以通过gensym来解决

- 如果一个宏创造的变量故意暴露，作为宏的一个特性，这种宏叫做anaphoric macros

- 宏编程是非常有力的技术。然而，尽量使用函数式编程代替宏来解决问题。宏是最后的法宝。

## 最后的废话

今天难得去图书馆了，三楼看到本real world haskell，只能感慨自己没空看了，二楼空无一人，看着散乱而泛黄的旧书顿生悲凉。一楼人倒挺多，都是来为四六级托福雅思考研等等等等自习的，很少有看书的。三楼人也有些，不过都集中在文学小说和艺术的区域。

不知为什么，总有种世风日下的感觉。回忆起当初在图书馆看书的日子……
