---
layout: post
title: "Grand Theft Wumpus"
excerpt: "一个lisp游戏————The most violent programming example ever put into a textbook"
category: lisp
tags: [land-of-lisp]
disqus: true
---


## About this game

假设你是lisp生物，你和一个怪物刚刚抢劫了一家酒品店，并带着战利品窜逃。然而，在逃跑期间，怪物决定出卖你并抢走你的车和钱。虽然他把车开走之前你多次试图截获它。

现在你别无选择，因为你的“原则”，决定去hunt the wumpus。你知道他受了重伤需要在堵塞的都市中某处静养好几个月。问题是道路十分复杂，即使城市中的老居民也难以判清方向。

幸好你是个lisp生物，你随身带着计算机......(这......)

你很了解怪物，知道它藏身之前一定会先侦查两条路内的所有地点，所以那里会留下血迹。

问题是它有把AK-47,你只有把小手枪和一发子弹。你只有一次机会找到并消灭它。

不幸的是，城市里有许多3G党，他们是残忍的绑匪，如果你落入他们手中，他们会蒙上你的眼睛，然后把你仍在城市的可能的任何一个地方。

幸运的是，他们会发光(这......)，你可以在一条路外看见他们发出的光。而且城市里只有三个他们的团伙。

最后，警察也在四处设卡追捕你们，你会在街区两端听见警笛如果这条街上有警察。

找到并消灭怪物，拿回你的车和钱很难很难

是很难，有时候不可能成功......

如果你认为你足够作为一个能抓住怪物的lisp生物，开始写这个游戏并猎杀怪物！

## 游戏

整个游戏lisp代码如下，我们需要上次写的库来可视化lisp的数据

```cl
(cd "/home/reverland/Documents/lisp/")
;;加载上回写的库
(load "graph-util.lisp")
;;定义基本参数
(defparameter *congestion-city-nodes* nil)
(defparameter *congestion-city-edges* nil)
(defparameter *visited-nodes* nil)
(defparameter *node-num* 30)
(defparameter *edge-num* 45)
(defparameter *worm-num* 3)
(defparameter *cop-odds* 15)
;;产生1到30的随机数
(defun random-node ()
  (1+ (random *node-num*)))
;;生成形如((a . b) (b . a))的节点对
(defun edge-pair (a b)
  (unless (eql a b)
    (list (cons a b) (cons b a))))
;;形成45条随机边
(defun make-edge-list ()
  (apply #'append (loop repeat *edge-num*;合并进一个列表
                        collect (edge-pair (random-node) (random-node)))))
;;与node直接相连,即以node开头的边
(defun direct-edges (node edge-list)
  (remove-if-not (lambda (x)
                   (eql (car x) node))
                 edge-list))
;;返回与node相连的nodes，(node 2 3 4 5 6)
(defun get-connected (node edge-list)
  (let ((visited nil))
    (labels ((traverse (node)
               (unless (member node visited);如果没访问过
                 (push node visited);加入visited中
                 (mapc (lambda (edge)
                         ;递归node的子节点，没访问过则推入visited
                         (traverse (cdr edge)))
                       (direct-edges node edge-list)))))
      (traverse node))
    visited));返回visited列表
;;找到孤岛，返回((1 2 3) (4 5 6))一类的东西
(defun find-islands (nodes edge-list)
  (let ((islands nil))
    (labels ((find-island (nodes)
               (let* ((connected (get-connected (car nodes) edge-list))
                      (unconnected (set-difference nodes connected)))
                 (push connected islands)
                 (when unconnected;如果没相连对不相连的部分递归调用
                   (find-island unconnected)))))
      (find-island nodes))
    islands))
;;把不想连的孤岛连上
(defun connect-with-bridges (islands)
  (when (cdr islands);如果不止一个island
    (append (edge-pair (caar islands) (caadr islands));想象以下islands，它就是这样
            (connect-with-bridges (cdr islands)))))
;;把新添加的桥加入边的列表((a . b) (c . d))
(defun connect-all-islands (nodes edge-list)
  (append (connect-with-bridges (find-islands nodes edge-list)) edge-list))
;;生成整个城市的边
(defun make-city-edges ()
  (let* ((nodes (loop for i from 1 to *node-num*
                      collect i))
         ;nodes
         (edge-list (connect-all-islands nodes (make-edge-list)))
         ;节点与节点关系，即边((a .b) (b .a) (e. f) (f .e)...) 
         (cops (remove-if-not (lambda (n);为什么一定要有个变量？
                                (zerop (random *cop-odds*)))
                              edge-list)))
    ;有cops的边(点对）
    (add-cops (edges-to-alist edge-list) cops)))
;;将点对转换成(node1 ((1) (2)...))的形式，即alist
(defun edges-to-alist (edge-list)
  (mapcar (lambda (node1);遍历每个node
            (cons node1
                  (mapcar (lambda (edge)
                            (list (cdr edge)))
                          (remove-duplicates (direct-edges node1 edge-list)
                                             :test #'equal))));为什么会有重复的？确实可能有,生成是随机的
          (remove-duplicates (mapcar #'car edge-list))))
;(mapcar #'car '((a . b) (c . d)))
;(a c)
;(remove-duplicates '((a . b) (a . b)) :test #'equal)
;((a . b))
;往edge-alist中加入cops,返回形如(a ((b cops) (c)))
(defun add-cops (edge-alist edges-with-cops)
  (mapcar (lambda (x)
            (let ((node1 (car x))
                  (node1-edges (cdr x)))
              (cons node1
                    (mapcar (lambda (edge)
                              (let ((node2 (car edge)))
                                (if (intersection (edge-pair node1 node2)
                                                  edges-with-cops
                                                  :test #'equal)
                                  (list node2 'cops)
                                  edge)))
                            node1-edges))))
          edge-alist))
;(mapcar #'car '((a) (b) (c)))
;(a b c)
;;返回与node相邻的点(a b c)
(defun neighbors (node edge-alist)
  (mapcar #'car (cdr (assoc node edge-alist))))
;;判断是否相邻的点
(defun within-one (a b edge-alist)
  (member b (neighbors a edge-alist)))
;;是否相差两个的点
(defun within-two (a b edge-alist)
  (or (within-one a b edge-alist)
      (some (lambda (x);存在与a相邻的点与b相邻
              (within-one x b edge-alist))
            (neighbors a edge-alist))))
;;最终生成这个城市所有的点
;;形如
(defun make-city-nodes (edge-alist)
  (let ((wumpus (random-node));随机wumpus位置
        (glow-worms (loop for i below *worm-num*
                          collect (random-node))))
    ;glow-worms位置列表
    (loop for n from 1 to *node-num*
          collect (append (list n)
                          (cond ((eql n wumpus) '(wumpus))
                                ((within-two n wumpus edge-alist) '(blood!)))
                          ;添加血迹
                          (cond ((member n glow-worms)
                                 '(glow-worm))
                                ;添加glow-worn标志
                                ((some (lambda (worm)
                                         (within-one n worm edge-alist))
                                       glow-worms);glow-warms中存在元素在n的withinone范围内，则让n发光
                                 '(lights!)));添加lights
                          (when (some #'cdr (cdr (assoc n edge-alist)))
                            '(sirens!))))));如果n的alist存在有cops这一项添加警笛
;(some (lambda (n) (= (- n 1) 1)) '(1 2 3 3))
;T
;定义新游戏
(defun new-game ()
  (setf *congestion-city-edges* (make-city-edges))
  (setf *congestion-city-nodes* (make-city-nodes *congestion-city-edges*))
  (setf *player-pos* (find-empty-node))
  (setf *visited-nodes* (list *player-pos*))
  (draw-city)
  (draw-known-city))
;;寻找没有线索的点
(defun find-empty-node ()
  (let ((x (random-node)))
    (if (cdr (assoc x *congestion-city-nodes*))
      (find-empty-node)
      x)))
;;根据已知绘图
(defun draw-city ()
  (ugraph->png "city" *congestion-city-nodes* *congestion-city-edges*))
;;可以先编译看看都什么样的
;(princ *congestion-city-edges*)
;(princ *congestion-city-nodes*)
;;已知城市节点
(defun known-city-nodes ()
  (mapcar (lambda (node)
            (if (member node *visited-nodes*)
              (let ((n (assoc node *congestion-city-nodes*)))
                ;若访问过
                (if (eql node *player-pos*)
                  (append n '(*));player位置加*号
                  n))
              (list node '?)));没访问过则加?
          ;之后一大段返回访问过和与访问过点相邻的点的列表
          (remove-duplicates;保留后一个
            (append *visited-nodes*
                    (mapcan (lambda (node);把结果归入一个列表
                              (mapcar #'car
                                      (cdr (assoc node
                                                  *congestion-city-edges*))))
                            *visited-nodes*)))))
;已知的边
(defun known-city-edges ()
  (mapcar (lambda (node)
            (cons node (mapcar (lambda (x);yes
                                 (if (member (car x) *visited-nodes*)
                                   x;保留边的信息cops
                                   (list (car x))));去掉cops
                               (cdr (assoc node *congestion-city-edges*)))))
          *visited-nodes*))
;(cons 1 '(2 3 4))
;(1 2 3 4)
;;绘制已知地图
(defun draw-known-city ()
  (ugraph->png "known-city" (known-city-nodes) (known-city-edges)))
;;定义walk和charge
(defun walk (pos)
  (handle-direction pos nil))
(defun charge (pos)
  (handle-direction pos t))
()
(defun handle-direction (pos charging)
  (let ((edge (assoc pos;原来单元素可以assoc，看作(element,nil)?
                     (cdr (assoc *player-pos* *congestion-city-edges*)))))
    (if edge
      (handle-new-place edge pos charging)
      (princ "That location does not exist!"))))
;;处理新节点
(defun handle-new-place (edge pos charging)
  (let* ((node (assoc pos *congestion-city-nodes*))
         (has-worm (and (member 'glow-worm node)
                        ;第二次访问不会有worm
                        (not (member pos *visited-nodes*)))))
    (pushnew pos *visited-nodes*)
    (setf *player-pos* pos)
    (draw-known-city)
    (cond ((member 'cops edge) (princ "You ran into the cops. Game Over."))
          ((member 'wumpus node) (if charging
                                   (princ "You found the Wumpus!")
                                   (princ "You ran into the Wumpus")))
          (charging (princ "You wasted your last bullet. Game Over."))
          (has-worm (let ((new-pos (random-node)))
                      (princ "You ran into a Glow Worm Gang! You're now at ")
                      (princ new-pos)
                      (handle-new-place nil new-pos nil))))))
```

当然，你可以参照第一章定义自己的interface

```cl
(defun game-start ()
  (let ((cmd (my-read)))
    (unless (eq (car cmd) 'quit)
      (princ (my-eval cmd))
      (fresh-line)
      (game-start))))
(defun my-read ()
  (let ((cmd (read-from-string
               (concatenate 'string "(" (read-line) ")"))))
    cmd))
(my-read)
(defparameter *allowed-commands* '(walk charge new-game quit))
(defun my-eval (sexp)
  (if (member (car sexp) *allowed-commands*)
    (eval sexp)
    '(i do not know that command.)))
```

在终端中启动clisp，并且加载你的这些代码。

```cl
(load "/path/to/wumpus.lisp")
```

输入如下命令进入游戏环境：

```bash
(game-start)
```

没有提示，加个sayhello可能更好，但我们开始新游戏吧

```bash
new-game
```

用konqureror打开生成的png文件known-city.png，一遍walk/charge一边按住F5疯狂刷新吧。

***

看看截图效果

<img src="http://lhtlyybox.googlecode.com/files/%E6%8A%93%E5%9B%BE70.png" hight="200" width="400" alt="konqureror中玩hunt the wumpus" />

***

## 我学到了什么

以下命令：

- load
- random
- cons
- apply
- loop
- remove-if-not
- let*
- push
- when
- remove-duplicates
- mapcan
- intersection :test equal
- some
- pushnew

搞得有些乱了，一般alist和本文中的alist不一样。lisp对列表的处理看得我眼花缭乱，自由但复杂。不过lisp没什么语法，这点有些Simple and stupid。

剩下是对编程的想法了，把各种情况都想清楚并设计好不是件容易的事！！就像前一阵去为一个机器人小车编程，两个传感器四个轮子都研究了半天，何况这个游戏，我只能说能看懂了，自己写就各种错误和手足无措了。

