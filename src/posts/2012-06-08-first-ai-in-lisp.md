---
layout: post
title: "First AI in lisp"
excerpt: "用lisp实现一个简单的AI。"
category: lisp
tags: [land-of-lisp]
disqus: true
---


## 创造一个智能的对手

我们的[Dice of Doom][1]游戏树代码有个分开的游戏树生成使向游戏引擎添加AI很容易。事实上，让我们跟着作者添加23行代码来实现AI！！

让我们先看看AI如何决定移动：

- 查看每个可允许的移动
- 对每一步的后的board评分
- 选择分值最高的移动

看起来很容易，那么怎么实现评分？如果一步后就赢了，很容易评分。如果不是的话怎么办？我们的移动将取决于对手的移动，为了不陷入不断考虑对手的境地中，提出一种算法。

## 最小最大算法

当赛场上只有两个玩家时，有这么个规则：对他人好的对我不好。这意味着我们可以采取如下模式决定对手的移动：

- 查看每个可行移动
- 对每一步后的board评分
- 选择最小的评分的移动

综上，这就是最大最小算法。这很关键，结果是我们可以避免分别为自己和对手计算评分，然后向下搜索游戏树中好的移动变得更简单和更快。为了让算法成为代码，还需要做少许调整。

## 将最大最小算法转化为代码

```cl
(defun rate-position (tree player)
  (let ((moves (caddr tree)))
    (if moves
      (apply (if (eq (car tree) player)
               #'max
               #'min)
             (get-ratings tree player))
      (let ((w (winners (cadr tree))))
        (if (member player w)
          (/ 1 (length w))
          0)))))
(defun get-ratings (tree player)
  (mapcar (lambda (move)
            (rate-position (cadr move) player))
          (caddr tree)))
```

## 创造一个有AI的游戏循环

先写个电脑处理函数，像我们的handle-human函数,首先找出每个移动的评分，然后选择评分最高的移动。

```cl
(defun handle-computer (tree)
  (let ((ratings (get-ratings tree (car tree))))
    (cadr (nth (position (apply #'max ratings) ratings) (caddr tree)))))
```
最后，创造一个游戏环境即游戏循环

```cl
(defun play-vs-computer (tree)
  (print-info tree)
  (cond ((null (caddr tree)) (announce-winner (cadr tree)))
        ((zerop (car tree)) (play-vs-computer (handle-human tree)));因为游戏中player1即代码0为人类玩家
        (t (play-vs-computer (handle-computer tree)))))
```

finished!!

## 试试人类vs电脑游戏

在repl中输入

```cl
(play-vs-computer (game-tree (gen-board) 0 0 t))
```


## 写在最后

终于考完试了，好久没看这本书。发现很多东西都生疏了，还好作者每次解释都很详细。这一章一看了好久，回头看看common lisp，东西真是相当之多……正好从图书馆找到HTDP的中文版，看完这本书全面转向scheme。

最后引用首爱默生《人生苦旅》中的诗：

> 我们把美归于简单
> 
> 不含多余部分
> 
> 边界清晰
> 
> 与一切相关联
> 
> 是中庸之道

[1]: /lisp/2012/05/23/dice-of-doom/
