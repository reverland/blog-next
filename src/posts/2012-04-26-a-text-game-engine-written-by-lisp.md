---
layout: post
title: "a text game engine written by lisp"
excerpt: "算是我的《land of lisp》笔记了"
category: lisp
tags: [land-of-lisp]
disqus: true
---

## Lisp is amazing,isn't it?

最早的时候，是从emacs听说lisp的，不过emacs这等神器，却并非我的菜，几经折腾最终滚回了简洁的vim。

最早开始学习lisp，是跟着田春译的《实用common lisp编程》，看了几章越看越累，等到看到讲单元测试那章时，我已经不知道在讲什么了。不过很惊叹lisp自动生成程序的能力倒是，还有种让人着迷的数学感。

后来看见网上有人在译[ansi common lisp中文版](http://readthedocs.org/docs/ansi-common-lisp/en/latest/index.html)，沉寂了两个月的lisp情怀陡升，我又开始看了。看了两章也陷入了越看越累的境地，最后到了能读懂却不能写出的境界，相对之前，也算是进步吧。然而才到高级数据结构那部分，我已没看下去的勇气，我觉得自己这种小白应该先修炼本更循序渐进的。

然后找啊找在[common-lisp](http://common-lisp.net/)上有推荐Land of lisp这本书,虽然很贵，但天朝的孩子们总是有办法的：[lisp资料](http://115.com/folder/faujangp#lisp)。

好难得有本图文并茂的书，声称一次一个游戏，我就喜欢这种例子丰富的东西，幽默点不致于无聊更好。找不到中文版，算了，英文版直接上吧。话说还考研，唉，还是想抽空看看这个。

***

## 第一个游戏

猜数的小游戏，不解释。

```cl
(defun guess-my-number ()
  (ash (+ *big* *small*) -1))
(defun bigger ()
  (setf *small* (1+ (guess-my-number)))
  (guess-my-number))
(defun smaller ()
  (setf *big* (1- (guess-my-number)))
  (guess-my-number))
(defun start-over ()
  (defparameter *small* 1)
  (defparameter *big* 100)
  (guess-my-number))
```

## 一个简单的文本游戏引擎

```cl
;;定义节点及描述
(defparameter *nodes* '((living-room (you are in the living-room.
                                          a wizard is snoring loudly on the couch.))
                        (garden (you are in a beautiful garden.
                                     there is a well in front of you.))
                        (attic (you are in the attic.
                                    there is a giant welding torch in the corner.))))
;;定义描述效应位置的函数
(defun describe-location (location nodes)
  (cadr (assoc location nodes)))
;;定义节点-路径
(defparameter *edges* '((living-room (garden west door)
                                     (attic upstairs ladder))
                        (garden (living-room east door))
                        (attic (living-room downstairs ladder))))
;;定义描述路径函数
(defun describe-path (edge)
  `(there is a ,(caddr edge) going ,(cadr edge) from here.))
;;定义描述对应位置路径的函数
(defun describe-paths (location edges)
  (apply #'append (mapcar #'describe-path (cdr (assoc location edges)))))
;;定义物品列表
(defparameter *objects* '(whiskey bucket frog chain))
;;物品-位置对，hash？
(defparameter *object-locations* '((whiskey living-room)
                                   (bucket living-room)
                                   (chain garden)
                                   (frog garden)))
;;得到相应位置物品列表
(defun objects-at (loc objs obj-locs)
  (labels ((at-loc-p (obj)
             (eq (cadr (assoc obj obj-locs)) loc)))
    (remove-if-not #'at-loc-p objs)))
;;描述相应位置物品
(defun describe-objects (loc objs obj-loc)
  (labels ((describe-obj (obj)
             `(you see a ,obj on the floor.)))
    (apply #'append (mapcar #'describe-obj (objects-at loc objs obj-loc)))))
;;给定初始位置
(defparameter *location* 'living-room)
;;定义查看函数
(defun look ()
  (append (describe-location *location* *nodes*)
          (describe-paths *location* *edges*)
          (describe-objects *location* *objects* *object-locations*)))
;;定义行走函数
(defun walk (direction)
  (let ((next (find direction
                    (cdr (assoc *location* *edges*))
                    :key #'cadr)))
    (if next
      (progn (setf *location* (car next))
             (look))
      '(you cannot go that way.))))
;;定义拾起函数
(defun pickup (object)
  (cond ((member object
                 (objects-at *location* *objects* *object-locations*))
         (push (list object 'body) *object-locations*)
         `(you are now carrying the ,object))
        (t '(you cannot get that.))))
;;查看现有物品的函数
(defun inventory ()
  (cons 'items- (objects-at 'body *objects* *object-locations*)))
;;登入界面
(defun say-hello ()
  (princ "Please type your name:")
  (let ((name (read-line)))
    (princ "Nice to meet you, ")
    (princ name)))
;;自定义repl
(defun game-repl ()
  (let ((cmd (game-read)))
    (unless (eq (car cmd) 'quit)
      (game-print (game-eval cmd))
      (game-repl))))
;;自定义的read
(defun game-read ()
  (let ((cmd (read-from-string
               (concatenate 'string "(" (read-line) ")"))))
    (flet ((quote-it (x)
             (list 'quote x)))
      (cons (car cmd) (mapcar #'quote-it (cdr cmd))))))
;;给定可执行命令
(defparameter *allowed-commands* '(look walk pickup inventory))
;;自定义eval
(defun game-eval (sexp)
  (if (member (car sexp) *allowed-commands*)
    (eval sexp)
    '(i do not know that command.)))
;;转换字符列表大小写函数
(defun tweak-text (lst caps lit)
  (when lst
    (let ((item (car lst))
          (rest (cdr lst)))
      (cond ((eq item #\space) (cons item (tweak-text rest caps lit)))
            ((member item '(#\! #\? #\.)) (cons item (tweak-text rest t lit)))
            ((eq item #\") (tweak-text rest caps (not lit)))
            (lit (cons item (tweak-text rest nil lit)))
            ((or caps lit) (cons (char-upcase item) (tweak-text rest nil lit)))
            (t (cons (char-downcase item) (tweak-text rest nil nil)))))))
;;自定义print
(defun game-print (lst)
  (princ (coerce (tweak-text (coerce (string-trim "() "
                                                  (prin1-to-string lst))
                                     'list)
                             t
                             nil)
                 'string))
  (fresh-line))

```

然后测试游戏引擎，在repl中输入

```cl
(game-repl)
```

首先让我惊异的就repl可以自定义,还有那个quasiquote很好用。

然后学到了以下一堆命令：

- defparameter/defvar
- cons
- assoc
- caxdxr
- `/，/quote
- append
- mapcar
- apply
- labels/flet
- eq
- remove-if-not
- find
- progn
- cond
- if/unless
- and/or
- member
- push
- print/princ/prin1/prin1-to-string/princ-to-string
- read/read-from-string/read-line
- concatenate
- coerce
- fresh-line
- char-upcase/char-downcase

