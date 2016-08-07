---
layout: post
title: "Dice of Doom v4"
excerpt: "最终版的Dice of Doom" 
category: lisp
tags: [land-of-lisp]
disqus: true
---


# 最终版的Dice of Doom

这个游戏终于结束了，基本上这本书的主要内容也算看完了。实际上，我根本就写不出这些东西，源码也读的云里雾里。但这是一本很有趣的书，我想看完htdp之后用htdp推荐风格重新处理下这本书的代码，顺便也复习一下。

## 让Dice of Doom 更加的有趣

我们上回完成的版本虽然很棒，但总缺乏些什么。因为之前程序的设计，我们可以很轻易的扩展它，让它变得更有趣

先加载我们之前的游戏[^1]

```cl
(load "dice-v3");
```

### 增加玩家数

因为我们之前的架构，增加玩家数很简单。为了增加玩家数后计算机能反应敏捷，让它变“傻”一点。

```cl
(defparameter *num-players* 4)
(defparameter *die-colors* '((255 63 63) (63 63 255) (63 255 63) (255 63 255)))
(defparameter *max-dice* 5)
(defparameter *ai-level* 2)
```

### 建立概率节点

我们本质上是向游戏树中加入几率节点，先升级attacking-moves函数，增加个board-attack-fail分支。

```cl
(defun attacking-moves (board cur-player spare-dice)
  (labels ((player (pos)
             (car (aref board pos)))
           (dice (pos)
             (cadr (aref board pos))))
    (lazy-mapcan (lambda (src)
                   (if (eq (player src) cur-player)
                     (lazy-mapcan
                       (lambda (dst)
                         (if (and (not (eq (player dst) cur-player))
                                  (> (dice src) 1))
                           (make-lazy (list (list (list src dst)
                                                  (game-tree (board-attack board cur-player src dst (dice src))
                                                             cur-player
                                                             (+ spare-dice (dice dst))
                                                             nil)
                                                  (game-tree (board-attack-fail board cur-player src dst (dice src))
                                                             cur-player
                                                             (+ spare-dice (dice dst))
                                                             nil))))
                           (lazy-nil)))
                       (make-lazy (neighbors src)))
                     (lazy-nil)))
                 (make-lazy (loop for n below *board-hexnum*
                                  collect n)))))
```

board-attack-fail函数遍历所有位置。如果这个位置是攻击方就只能留下一个骰子

```cl
(defun board-attack-fail (board player src dst dice)
  (board-array (loop for pos from 0
                     for hex across board
                     collect (if (eq pos src)
                               (list player 1)
                               hex))))
```

### 让骰子滚动起来

一下程序让一堆骰子滚动起来，并判断谁赢了

```cl
;rolling the dice
(defun roll-dice (dice-num)
  (let ((total (loop repeat dice-num
                     sum (1+ (random 6)))))
    (fresh-line)
    (format t "On ~a dice rolled ~a. " dice-num total)
    total))
(defun roll-against (src-dice dst-dice)
  (> (roll-dice src-dice) (roll-dice dst-dice)))
```

我们还需要在游戏引擎中调用让骰子滚动的代码,选出正确的子树

```cl
(defun pick-chance-branch (board move)
  (labels ((dice (pos)
             (cadr (aref board pos))))
    (let ((path (car move)))
      (if (or (null path) (roll-against (dice (car path))
                                        (dice (cadr path))))
        (cadr move)
        (caddr move)))))
```

更新handle-computer函数让它调用选择几率分支的函数

```cl
(defun handle-human (tree)
  (fresh-line)
  (princ "choose your move:")
  (let ((moves (caddr tree)))
    (labels ((print-moves (moves n)
               (unless (lazy-null moves)
                 (let* ((move (lazy-car moves))
                        (action (car move)))
                   (fresh-line)
                   (format t "~a. " n)
                   (if action
                     (format t "~a -> ~a" (car action) (cadr action))
                     (princ "end turn")))
                 (print-moves (lazy-cdr moves) (1+ n)))))
      (print-moves moves 1))
    (fresh-line)
    (pick-chance-branch (cadr tree) (lazy-nth (1- (read)) moves))))
```

同样我们可以处理handle-computer函数

```cl
(defun handle-computer (tree)
  (let ((ratings (get-ratings (limit-tree-depth tree *ai-level*) (car tree))))
    (pick-chance-branch
      (cadr tree)
      (lazy-nth (position (apply #'max ratings) ratings) (caddr tree)))))
```

### 升级AI

但现在还有个问题，AI还没有考虑骰子的滚动，依然认为骰子多的一定获胜。因此需要更新AI。

根据概率论原理，我们可以得到这样一个矩阵来表征攻击成功的概率

|防守方\攻击方|2|3|4|5|
|:-:|:----:|:----:|:---:|:--:|
|1|0.84|0.97|1.0|1.0|
|2|0.44|0.78|0.94|0.99|
|3|0.15|0.45|0.74|0.91|
|4|0.04|0.19|0.46|0.72|
|5|0.01|0.06|0.22|0.46|

现在把这个概率交给计算机，更新get-ratings函数,给评分加权

```cl
(defun get-ratings (tree player)
  (let ((board (cadr tree)))
    (labels ((dice (pos)
               (cadr (aref board pos))))
      (take-all (lazy-mapcar
                  (lambda (move)
                    (let ((path (car move)))
                      (if path
                        (let* ((src (car path))
                               (dst (cadr path))
                               (odds (aref (aref *dice-odds*
                                                 (1- (dice dst)))
                                           (- (dice src) 2))))
                          (+ (* odds (rate-position (cadr move) player))
                             (* (- 1 odds) (rate-position (caddr move)
                                                          player))))
                        (rate-position (cadr move) player))))
                  (caddr tree))))))
```

为了让修剪游戏树的函数能工作，还需要做些修改让它能处理新的游戏树。同时为了简化不再使用alpha-beta算法。

```cl
(defun limit-tree-depth (tree depth)
  (list (car tree)
        (cadr tree)
        (if (zerop depth)
          (lazy-nil)
          (lazy-mapcar (lambda (move)
                         (cons (car move)
                               (mapcar (lambda (x)
                                         (limit-tree-depth x (1- depth)))
                                       (cdr move))))
                       (caddr tree)))))
;We mapcar across the tail of each move, so trimming is performed on
;both branches of any chance nodes.
```

### 改进增援方案

之前是依据消灭敌人多少来决定增援骰子数。现在我们换一种方法：依据占据的最大领地来决定增援多少。这使游戏的地缘性更加复杂。

回想我们之前在[wumpus游戏][1]里写过的相似函数

```cl
(defun get-connected (board player pos)
  (labels ((check-pos (pos visited)
             (if (and (eq (car (aref board pos)) player)
                      (not (member pos visited)))
               (check-neighbors (neighbors pos) (cons pos visited))
               visited))
           (check-neighbors (lst visited)
             (if lst
               (check-neighbors (cdr lst) (check-pos (car lst) visited))
               visited)))
    (check-pos pos '())))
```

获得最大的集群,最后添加援军，注意，spare-dice仍然作为参数传递但已经不再被add-new-dice使用了。

```cl
(defun largest-cluster-size (board player)
  (labels ((f (pos visited best)
             (if (< pos *board-hexnum*)
               (if (and (eq (car (aref board pos)) player)
                        (not (member pos visited)))
                 (let* ((cluster (get-connected board player pos))
                        (size (length cluster)))
                   (if (> size best)
                     (f (1+ pos) (append cluster visited) size)
                     (f (1+ pos) (append cluster visited) best)))
                 (f (1+ pos) visited best))
               best)))
    (f 0 '() 0)))
(defun add-new-dice (board player spare-dice)
  (labels ((f (lst n)
             (cond ((zerop n) lst)
                   ((null lst) nil)
                   (t (let ((cur-player (caar lst))
                            (cur-dice (cadar lst)))
                        (if (and (eq cur-player player) (< cur-dice *max-dice*))
                          (cons (list cur-player (1+ cur-dice))
                                (f (cdr lst) (1- n)))
                          (cons (car lst) (f (cdr lst) n))))))))
    (board-array (f (coerce board 'list)
                   (largest-cluster-size board player)))))
```

享受你的劳动成果吧

```cl
(serve #'dod-request-handleer)
```

## 疑问

我发现我可以选中任何自己的领地，只要上面的骰子数大于2。我可以攻击任何强大的敌人，而且一定能成功。不知道哪里的更改或错误！！

***

## Footnotes

[^1]: 对从官网下载的源码和书中的源码可能需要修改，具体参见前几篇读书笔记。

[1]: http://reverland.org/Tech/2012/05/01/grand-theft-wumpus/
