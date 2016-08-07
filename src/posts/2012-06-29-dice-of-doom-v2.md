---
layout: post
title: "Dice of Doom v2"
excerpt: "关于Dice of Doom游戏的第二个版本优化，实用惰性求值方法和搜索树修剪算法"
category: lisp
tags: [land-of-lisp]
disqus: true
---


# Dice of Doom v2

我已经不怎么看得懂在讲什么了，所以胡言乱语请见谅,有几个问题:

# 记不起之前的游戏树什么样了，我又懒得回头去看。是不是某种决策树？
# 不停的函数接着函数扩展看起来很方便，但又要求你时刻记得之前实现的细节，以实现正确的改进
# 作者的编程风格，以后还是按htdp里说的玩去吧，起码不会像现在这样晕。
# 英语还是障碍啊，有时候看完一大段文字后不知道在讲什么，囧了。

## Dice of Doom v2

首先加载之前我们完成的 [Dice of Doom][dice] 源码和为惰性求值所实现的一系列库文件。没有的话就从land of lisp网站上下载吧，话说这本书真贵要40刀左右，豆瓣上竟然380元人民币……

```cl
(load "dice_of_doom_v1.lisp")
(load "lazy.lisp")
```

然后先把游戏board扩大到4x4。

```cl
(defparameter *board-size* 4)
(defparameter *board-hexnum* (* *board-size* *board-size*))
```

下面把Dice of Doom游戏全面lazy化吧

```cl
(defun add-passing-move (board player spare-dice first-move moves)
  (if first-move
    moves
    (lazy-cons (list nil
                     (game-tree (add-new-dice board player
                                              (1- spare-dice))
                                (mod (1+ player) *num-players*)
                                0
                                t))
               moves)))
(defun attacking-moves (board cur-player spare-dice)
  (labels ((player (pos)
             (car (aref board pos)))
           (dice (pos)
             (cadr (aref board pos))))
    (lazy-mapcan
      (lambda (src)
        (if (eq (player src) cur-player)
          (lazy-mapcan
            (lambda (dst)
              (if (and (not (eq (player dst)
                                cur-player))
                       (> (dice src) (dice dst)))
                (make-lazy
                  (list (list (list src dst)
                              (game-tree (board-attack board
                                                       cur-player
                                                       src
                                                       dst
                                                       (dice src))
                                         cur-player
                                         (+ spare-dice (dice dst))
                                         nil))))
                (lazy-nil)))
            (make-lazy (neighbors src)))
          (lazy-nil)))
      (make-lazy (loop for n below *board-hexnum*
                       collect n)))))
```

注意lazy-mapcan要求被创建的列表是惰性的，现在你知道htdp标明每个函数输入输出的习惯多好了吧……

lazy化handle-human函数和play-vs-human函数

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
    (cadr (lazy-nth (1- (read)) moves))))
(defun play-vs-human (tree)
  (print-info tree)
  (if (not (lazy-null (caddr tree)))
    (play-vs-human (handle-human tree))
    (announce-winner (cadr tree))))
```

现在你可以试试人人对战了，速度不错。

## 让AI运行在更大的游戏区域

对AI的惰性化之前，我们先做一些修剪的工作，这是对AI决策树/游戏树算法的优化[1]。

我们现在的AI很尽职尽责的搜索计算所有的可能的结果。但在大的游戏面板中这样很累，为了在效率上取得平衡，限制AI的考虑决策树深度

```cl
(defun limit-tree-depth (tree depth)
  (list (car tree)
        (cadr tree)
        (if (zerop depth)
          (lazy-nil)
          (lazy-mapcar (lambda (move)
                         (list (car move)
                               (limit-tree-depth (cadr move) (1- depth))))
                       (caddr tree)))))
(defparameter *ai-level* 4)
(defun handle-computer (tree)
  (let ((ratings (get-ratings (limit-tree-depth tree *ai-level*)
                              (car tree))))
    (cadr (lazy-nth (position (apply #'max ratings) ratings)
                    (caddr tree)))))
(defun play-vs-computer (tree)
  (print-info tree)
  (cond ((lazy-null (caddr tree)) (announce-winner (cadr tree)))
        ((zerop (car tree)) (play-vs-computer (handle-human tree)))
        (t (play-vs-computer (handle-computer tree)))))
```

我没看懂……已经深深迷失在car cadr caddr的海洋之中，总之它限制了AI的思考深度，让它把评分限制在4步之内。[2]

### 启发算法[3]

让AI只思考较少的深度来实现投入和产出的统一。

让我们用更复杂的启发算法来重新对游戏面板评分:对一个自己的地盘，如果附近有比自己强大的敌人则评分1,否则则评分2。若该地盘属于对手则评分为-1

```cl
(defun score-board (board player)
  (loop for hex across board
        for pos from 0
        sum (if (eq (car hex) player)
              (if (threatened pos board)
                1
                2)
              -1)))
;附近有更多骰子的位置有威胁
(defun threatened (pos board)
  (let* ((hex (aref board pos))
         (player (car hex))
         (dice (cadr hex)))
    (loop for n in (neighbors pos)
          do (let* ((nhex (aref board n))
                    (nplayer (car nhex))
                    (ndice (cadr nhex)))
               (when (and (not (eq player nplayer)) (> ndice dice))
                 (return t))))))
```

有意思的是，关于启发式作者这么说：在开发这个例子时，我模拟了使用不同版本score-board的各种对手，这个版本效果很好，开发启发式算法不是什么科学。囧～

惰性化get-ratings和rate-position函数

```cl
(defun get-ratings (tree player)
  (take-all (lazy-mapcar (lambda (move)
                           (rate-position (cadr move) player))
                         (caddr tree))))
(defun rate-position (tree player)
  (let ((moves (caddr tree)))
    (if (not (lazy-null moves))
      (apply (if (eq (car tree) player)
               #'max
               #'min)
             (get-ratings tree player))
      (score-board (cadr tree) player))))
```

现在可以试试和计算机过招了。

```cl
(play-vs-computer (game-tree (gen-board) 0 0 t))
```

据说先行者有优势，计算机大概有3/4的几率获胜。

### alpha-beta 算法[4]

 @此部分不只所云，请见谅。@

AI实际上执行一种深度优先搜索。

alpha-beta算法是把已知的一定更差的子树从决策树中剪掉的算法，熟称剪枝算法。

本游戏中游戏树的顶端上是最大最小算法，非顶端上是score-board评分……

```cl
(defun ab-get-ratings-max (tree player upper-limit lower-limit)
  (labels ((f (moves lower-limit)
             (unless (lazy-null moves)
               (let ((x (ab-rate-position (cadr (lazy-car moves))
                                          player
                                          upper-limit
                                          lower-limit)))
                 (if (>= x upper-limit)
                   (list x)
                   (cons x (f (lazy-cdr moves) (max x lower-limit))))))))
    (f (caddr tree) lower-limit)))

(defun ab-get-ratings-min (tree player upper-limit lower-limit)
  (labels ((f (moves upper-limit)
             (unless (lazy-null moves)
               (let ((x (ab-rate-position (cadr (lazy-car moves))
                                          player
                                          upper-limit
                                          lower-limit)))
                 (if (<= x lower-limit)
                   (list x)
                   (cons x (f (lazy-cdr moves) (min x upper-limit))))))))
    (f (caddr tree) upper-limit)))

(defun ab-rate-position (tree player upper-limit lower-limit)
  (let ((moves (caddr tree)))
    (if (not (lazy-null moves))
      (if (eq (car tree) player)
        (apply #'max (ab-get-ratings-max tree
                                         player
                                         upper-limit
                                         lower-limit))
        (apply #'min (ab-get-ratings-min tree
                                         player
                                         upper-limit
                                         lower-limit)))
      (score-board (cadr tree) player))))
```

这三个函数怎么实现及实现什么……不知道，深感自己英语不行啊，大段大段看完不知道在讲什么，哪天有兴致了对照对弈程序基本技术再看吧……I am confused now.[6]

改进我们的handle-computer函数

```cl
(defun handle-computer (tree)
  (let ((ratings (ab-get-ratings-max (limit-tree-depth tree *ai-level*)
                                     (car tree)
                                     most-positive-fixnum
                                     most-negative-fixnum)))
    (cadr (lazy-nth (position (apply #'max ratings) ratings) (caddr tree)))))
```

现在把游戏面板扩大到5x5

```cl
(defparameter *board-size* 5)
(defparameter *board-hexnum* (* *board-size* *board-size*))
```

由于我们记忆化的原因，之前的4x4面板会被缓存。为了修正这个问题重新定义neighbors函数即可。

实验新的经过改进的游戏

```cl
(play-vs-computer (game-tree (gen-board) 0 0 t))
```

## 小结

本章我们使用惰性求值方法改进我们的游戏，同时通过一些优化限制AI引擎搜索的决策树数目，我们学到了以下几点：

- 惰性列表使你有可能使用无穷的列表和数据结构，并且很有效率
- 一旦你有了lazy宏和force函数，你就可以基于此创造更复杂的惰性列表库
- 启发性算法是不完美的算法，通过一些创造性的想法可以显著提高代码的性能。在我们的例子中我们使用启发式的算法来为游戏树的顶端评分。
- 一旦我们把游戏转化为惰性树，为了限制AI思考的移动的深度我们可以优雅地[5]修剪游戏树。
- Alpha-beta算法让我们更多地优化了性能，通过修剪不会影响AI最后所思考的移动的评分。

<hr />

## Footnotes

[^1]: 我胡扯的，个人理解。

[^2]: Note在讲什么我也不知道，只知道作者说这个虽然做的不够精细，但已经足够优化了。

[^3]: 参见 "http://en.wikipedia.org/wiki/Heuristic_(computer_science)":http://en.wikipedia.org/wiki/Heuristic_(computer_science)

[^4]: 参见 "http://en.wikipedia.org/wiki/Alpha-beta_pruning":http://en.wikipedia.org/wiki/Alpha-beta_pruning

[^5]: 编写新的函数，看上去很优雅……

[^6]: 可以先看看 "alpha-beta剪枝算法":http://www.xqbase.com/computer/search_alphabeta.htm

[dice]: /lisp/2012/05/23/dice-of-doom/

<hr />

## 废话

说实话，看不懂了，愈发的看不懂。生命中某种虚空感强烈的袭来，明知自己做的是“没有意义”，也没有人在意的的东西，可我就是关心那些。

有时候真是不想理人，与很多人不怎么谈得来，我不喜欢到头来毫无建树的胡扯，也不喜欢扯不喜欢的东西。可有时无话可说无人可诉，人与人的差别就是这么大，不知何时。

有时侯如此疯狂，讨厌别人的干扰，不能容忍自己浪费生命。在他人眼里我不也是在浪费生命？我不知道，安慰我的人永远安慰我，另一个部分人永远看不起我。

我应该追求哪个世界与人生？一边是迷人的，我不知道余生还有多长，不想放手错过它，但它只在我的梦中。一条在横亘在这个世界，我却没有一丝爱意。

也许一切都是宿命。
