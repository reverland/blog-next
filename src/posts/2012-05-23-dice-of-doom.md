---
layout: post
title: "Dice of Doom"
excerpt: "A game engine written in the functional style"
category: lisp
tags: [land-of-lisp]
disqus: true
---


## 照例前面来些废话

前一阵忙着看通信原理，近来各科都陆续结课，又接连有这么几科让写个什么论文，忙忙碌碌之后发现lisp就没怎么看了，以致于这一章都看快一星期了还没看完。不过回头多看几次后，因为对游戏要生成个什么样的game tree有了整体上的把握，理解起来简单多了。所以奉劝其它读者先搞清楚要生成个什么样的game tree和作者的设计方案，再来看后面的代码部分。

昨天还激动终于看到用lisp来实现人工智能了，结果一看几行代码实现个[minmax][1]算法的问题……失望了。

##Dice of Doom

###游戏规则

这是个怎么样的游戏？看看[这里][2]就知道了。我们现在就要用函数式编程风格写一个这样的游戏，当然，从简单的开始。简单到只有两个玩家，只以骰子数目多少来决定能否“占领”对方的领地。

本想举个例子，不过画图挺麻烦的，现在没什么空。有空再补上。

有这么一些规则：

- 两个玩家占据着六边形阵列上的各个六边形。每个六边形都有一些立方体骰子，被两个玩家分别占有。
- 在一个回合内，玩家可以执行任意数目的移动，但至少移动一次。如果他不能移动那么他就输了。
- 移动包括攻击邻近的对方六边形。玩家发动攻击的六边形必须比要攻击的对方的六边形拥有更多骰子。将来可能我们会真的“转动”这些骰子。
- 攻击结束后，输者在被攻击六边形的骰子被移除，发动攻击的六边形留下一个骰子，将其它所有骰子移到占领的新地方。
- 当玩家完成他所有的移动，将获得他消灭的骰子总数减一的增援。增援从左上角开始给每个己方六角形增加一个骰子。若达到每个六边形的最大骰子数则跳过。
- 如果玩家都不能移动，游戏结束，占据最多六边形的玩家获胜。

###然后是漫长的源码……

```cl
;;Defining Some Global Variables
;玩家数二
(defparameter *num-players* 2)
;一个六边形最多3个骰子
(defparameter *max-dice* 3)
(defparameter *board-size* 2)
;2x2的board
(defparameter *board-hexnum* (* *board-size* *board-size*))
;clean
;将list转化为array，为今后优化做准备
(defun board-array (lst)
  (make-array *board-hexnum* :initial-contents lst))
;dirty
;生成随机的玩家分布和力量
(defun gen-board ()
  (board-array (loop for n below *board-hexnum*
                     collect (list (random *num-players*)
                                   (1+ (random *max-dice*))))))
;clean
;将玩家名由数字转换成字母
(defun player-letter (n)
  (code-char (+ 97 n)))
;dirty
;通过两层循环控制输出，绘制board
(defun draw-board (board)
  (loop for y below *board-size*
        do (progn (fresh-line)
                  (loop repeat (- *board-size* y)
                        do (princ " "))
                  (loop for x below *board-size*
                        for hex = (aref board (+ x (* *board-size* y)))
                        do (format t "~a-~a " (player-letter (first hex))
                                   (second hex))))))
;;;Decoupling Dice of Doom’s Rules from the Rest of the Game
;;Generating a Game Tree
;clean
;产生一个game-tree，形如(player board (moves))
(defun game-tree (board player spare-dice first-move)
  (list player
        board
        (add-passing-move board
                          player
                          spare-dice
                          first-move
                          (attacking-moves board player spare-dice))))
;;Calculating Passing Moves
;clean
;如果是第一次移动则返回原tree的moves，如果不是则添加nil表示
;无法移动，并递归调用game-tree添加玩家移动树
(defun add-passing-move (board player spare-dice first-move moves)
  (if first-move
    moves
    (cons (list nil
                (game-tree (add-new-dice board player (1- spare-dice))
                           (mod (1+ player) *num-players*)
                           0
                           t))
          moves)))
;clean
;Calculating Attacking Moves
;生成攻击可行的攻击game-tree中的moves
(defun attacking-moves (board cur-player spare-dice)
  (labels ((player (pos)
             (car (aref board pos)))
           (dice (pos)
             (cadr (aref board pos))))
    (mapcan (lambda (src)
              (when (eq (player src) cur-player)
                (mapcan (lambda (dst)
                          (when (and (not (eq (player dst) cur-player))
                                     (> (dice src) (dice dst)))
                            (list
                              (list (list src dst)
                                    (game-tree (board-attack board cur-player src dst (dice src))
                                               cur-player
                                               (+ spare-dice (dice dst))
                                               nil)))))
                        (neighbors src))))
            (loop for n below *board-hexnum*
              collect n))))
;Finding the Neighbors
;clean
;返回邻近的pos列表
(defun neighbors (pos)
  (let ((up (- pos *board-size*))
        (down (+ pos *board-size*)))
    (loop for p in (append (list up down)
                           (unless (zerop (mod pos *board-size*))
                             (list (1- up) (1- pos)))
                           (unless (zerop (mod (1+ pos) *board-size*))
                             (list (1+ pos) (1+ down))))
          when (and (>= p 0) (< p *board-hexnum*))
          collect p)))
;Attacking
;clean
;生成attack后的board
(defun board-attack (board player src dst dice)
  (board-array (loop for pos;第一个for为位置
                     for hex across board;数组用across
                     collect (cond ((eq pos src) (list player 1))
                                   ((eq pos dst) (list player (1- dice)))
                                   (t hex)))))
;Reinforcements
;clean
;根据spare-dice添加骰子,返回新的board（数组）
(defun add-new-dice (board player spare-dice)
  (labels ((f (lst n)
             (cond ((null lst) nil)
                   ((zerop n) lst)
                   (t (let ((cur-player (caar lst))
                            (cur-dice (cadar lst)))
                        (if (and (eq cur-player player) (< cur-dice *max-dice*))
                          (cons (list cur-player (1+ cur-dice))
                                (f (cdr lst) (1- n)))
                          (cons (car lst) (f (cdr lst) n))))))))
    (board-array (f (coerce board 'list) spare-dice))))
;;Playing Dice of Doom Against Another Human
;The Main Loop
;dirty
;人人对战主函数
(defun play-vs-human (tree)
  (print-info tree)
  (if (caddr tree)
    (play-vs-human (handle-human tree))
    (announce-winner (cadr tree))))
;Giving Information About the State of the Game
;dirty
;打印当前信息，包括当前玩家和board
(defun print-info (tree)
  (fresh-line)
  (format t "current player = ~a" (player-letter (car tree)))
  (draw-board (cadr tree)))
;Handling Input from Human Players
;dirty
;处理人的行动的函数，根据人的输入返回不同move的子树
(defun handle-human (tree)
  (fresh-line)
  (princ "choose your move:")
  (let ((moves (caddr tree)))
    (loop for move in moves
          for n from 1
          do (let ((action (car move)))
               (fresh-line)
               (format t "~a. " n)
               (if action
                 (format t "~a -> ~a" (car action) (cadr action))
                 (princ "end turn"))))
    (fresh-line)
    (cadr (nth (1- (read)) moves))))

;Determining the Winner
(defun winners (board)
  (let* ((tally (loop for hex across board
                      collect (car hex)))
         (totals (mapcar (lambda (player)
                           (cons player (count player tally)))
                         (remove-duplicates tally)))
         (best (apply #'max (mapcar #'cdr totals))))
    (mapcar #'car
            (remove-if (lambda (x)
                         (not (eq (cdr x) best)))
                       totals))))
```

现在可以试试新游戏：

```cl
(play-vs-human (game-tree (gen-board) 0 0 t))
```

其中0代表玩家0,第二个0代表刚开始获得的骰子为0,t代表第一次移动。

##写在最后

尼玛这怎么设计出来的，看起来倒容易，设计者真值得膜拜……

着一个函数接着一个函数真是超级强烈的函数式编程风格好不好，我又想起来C语言这种强烈的面向过程风格，难道函数式就是功能式，其实就是过程式？

要说有什么收获，什么cddrcdar搞得更清楚了，我觉得作者用one two three什么的看起来更方便些。loop for什么for什么的across什么算是开了眼界了。其它，只让我体会到强烈的面向过程风格，作为不能完美计划所有过程的小白我还是继续看c++去比较简单…………

[1]: http://en.wikipedia.org/wiki/Minimax

[2]: http://www.gamedesign.jp/flash/dice/dice.html

