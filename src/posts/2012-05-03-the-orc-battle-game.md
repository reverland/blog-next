---
layout: post
title: "The Orc Battle Game"
excerpt: "Yet another game written by lisp"
category: lisp
tags: [land-of-lisp]
disqus: true
---


## Lisp中的特殊数据结构

引用原文中的话来形容Lisp,

```bash
Think of the Babel fish in the Hitchhiker’s Guide to the Galaxy trilogy—something 
so impossibly useful that it really has no business existing in the first place.
```

现在知道land of lisp的作者为什么把common lisp比作狼狗，为什么说cl强大了。支持list也就算了，支持个array、hash table、OOp、范型(generic)什么乱七八糟一堆其它语言中各种强大的东西，这么逆天的东西根本就不该存在！不过作为代价，丧失了一种纯粹的美。

```cl

lisp is symmetry,while common lisp is powerful.
```

### Arrays

一些有用的命令

- make-array
- aref
- setf

array有比列表更高的效率

### Hash Table

这玩意强到逆天：

- make-hash-table
- gethash

#### 返回多值

- round
- values
- multiple-value-bind

hash表性能总体还是很高的..比如说我们上回写的wumpus游戏，我们可以分别对hash表和alists运行效率做如下对比。先看alists：

```cl
(load "/home/lyy/Documents/lisp/wumpus.lisp")
(setf *edge-num* 1000)
(setf *node-num* 1000)
(time (dotimes (i 100) (get-connected 1 (make-edge-list))))
```

好吧，我花的时间：

```cl
(time (dotimes (i 100) (get-connected 1 (make-edge-list))))
Real time: 64.1503 sec.
Run time: 64.025826 sec.
Space: 75275184 Bytes
GC: 65, GC time: 0.43664 sec.
NIL
```

下面我们更改之前的wumpus游戏。

```cl
;;生成hash表的边版本
(defun hash-edges (edge-list)
  (let ((tab (make-hash-table)))
    (mapc (lambda (x);mapc返回副作用
            (let ((node (car x)))
              (push (cdr x) (gethash node tab))));推入新值
          edge-list)
    tab))
;;生成hash表。如果与node相连，则hash表中值为t
(defun get-connected-hash (node edge-tab)
  (let ((visited (make-hash-table)))
    (labels ((traverse (node)
               (unless (gethash node visited);非则执行
                 (setf (gethash node visited) t)
                 (mapc (lambda (edge)
                         (traverse edge))
                       (gethash node edge-tab)))))
      (traverse node))
    visited))
;;可以看看什么样的
;;看看运行时间
(time (dotimes (i 100)
        (get-connected-hash 1 (hash-edges (make-edge-list)))))
```

很显然，效率高多了：

```cl
(time (dotimes (i 100)
        (get-connected-hash 1 (hash-edges (make-edge-list)))))
Real time: 1.530112 sec.
Run time: 1.526567 sec.
Space: 64337496 Bytes
GC: 56, GC time: 0.366641 sec.
NIL
```

### Structures

构建structure可以直接用defstruct：

```cl
(defstruct person
  name
  age
  waist-size
  favorite-color)
;;然后进行跟改
(defparameter *bob* (make-person :name "Bob";make-person函数自动生成
                                 :age 35
                                 :waist-size 32
                                 :favorite-color "blue"))
*bob* ;查看
;#S(person :name "rob" :age 35 :waist-size 32 :favorite-color "blue")
(person-age *bob*);自动生成person-age函数
(setf (person-age *bob*) 36);generical programming
```
也可以直接这样：

```cl
(defparameter *that-guy* #S(person :name "rob" :age 35 :waist-size 32
                                   :favorite-color "blue"))
(print *that-guy*) 
```

### Generical Programming

有些范函可以接受多种类型参数,典型的sequence函数有：

- length
- sequence
- find-if
- count
- position
- some
- every
- reduce
- subseq
- sort

通过类型检验创建generic function是可行的但不太好。有种叫作type dispatching的东西可以让用户自己通过defmethod来定义generic function。

***

## The Orc Battle Game

好了，之前全是扯淡。开始进入正题，写我们的新游戏：

```cl
;;;player的三属性
(defparameter *player-health* nil)
(defparameter *player-agility* nil)
(defparameter *player-strength* nil)
;;;monsters
(defparameter *monsters* nil)
(defparameter *monster-builders* nil);各种怪物
(defparameter *monster-num* 12)
(princ *monster-builders*) 
;;;main function
(defun orc-battle ()
  (init-monsters)
  (init-player)
  (game-loop)
  (when (player-dead)
    (princ "You have been killed. Game Over."))
  (when (monsters-dead)
    (princ "Congratulations! You have vanquished all of your foes.")))
;;;define game loop
(defun game-loop ()
  (unless (or (player-dead) (monsters-dead))
    (show-player)
  ;;依据敏捷计算攻击次数
    (dotimes (k (1+ (truncate (/ (max 0 *player-agility*) 15))))
      (unless (monsters-dead)
        (show-monsters)
        (player-attack)))
    (fresh-line)
    (map 'list
         (lambda(m)
           (or (monster-dead m) (monster-attack m)))
         *monsters*)
    (game-loop)))
;;;manage players function
(defun init-player ()
  (setf *player-health* 30)
  (setf *player-agility* 30)
  (setf *player-strength* 30))
(defun player-dead ()
  (<= *player-health* 0))
(defun show-player ()
  (fresh-line)
  (princ "You are a valiant knight with a health of ")
  (princ *player-health*)
  (princ ", an agility of ")
  (princ *player-agility*)
  (princ ", and a strength of ")
  (princ *player-strength*))
(defun player-attack ()
  (fresh-line)
  (princ "Attack style: [s]tab [d]ouble swing [r]oundhouse:")
  (case (read);case函数
    (s (monster-hit (pick-monster);monster-hit表monster被攻击
                    (+ 2 (randval (ash *player-strength* -1)))))
    (d (let ((x (randval (truncate (/ *player-strength* 6)))))
         (princ "Your double swing has a strength of ")
         (princ x)
         (fresh-line)
         (monster-hit (pick-monster) x)
         (unless (monsters-dead);除非第一次攻击就消灭所有怪物
           (monster-hit (pick-monster) x))))
    (otherwise (dotimes (x (1+ (randval (truncate (/ *player-strength* 3)))))
;否则一阵乱打
                 (unless (monsters-dead);若之中有一次已经消灭所有怪物
                   (monster-hit (random-monster) 1))))))
;;;产生不小于1的1到n的随机数
(defun randval (n)
  (1+ (random (max 1 n))));以防n<1
;;;Player Attacks的辅助函数
;;随机活着的怪物编号
(defun random-monster ()
  (let ((m (aref *monsters* (random (length *monsters*)))))
    (if (monster-dead m)
      (random-monster)
      m)))

;;选择特定monster
(defun pick-monster ()
  (fresh-line)
  (princ "Monster #:")
  (let ((x (read)))
    (if (not (and (integerp x) (>= x 1) (<= x *monster-num*)))
      (progn (princ "That is not a valid monster number.")
             (pick-monster))
      (let ((m (aref *monsters* (1- x))))
        (if (monster-dead m)
          (progn (princ "That monster is alread dead.")
                 (pick-monster))
          m)))))
;;Monster Management Functions
(defun init-monsters ()
  (setf *monsters*
        (map 'vector
             (lambda (x);I make no sense of it
               (funcall (nth (random (length *monster-builders*))
                             *monster-builders*)))
             (make-array *monster-num*))))
(defun monster-dead (m)
  (<= (monster-health m) 0))
(defun monsters-dead ()
  (every #'monster-dead *monsters*))

(defun show-monsters ()
  (fresh-line)
  (princ "Your foes:")
  (let ((x 0))
    (map 'list
         (lambda (m)
           (fresh-line)
           (princ "     ")
           (princ (incf x))
           (princ ". ")
           (if (monster-dead m)
             (princ "**dead**")
             (progn (princ "(Health=")
                    (princ (monster-health m))
                    (princ ") ")
                    (monster-show m))));怪物描述
                  *monsters*)))
;;定义monster的structure
(defstruct monster (health (randval 10)))
;;monster被攻击
(defmethod monster-hit (m x)
  (decf (monster-health m) x)
  (if (monster-dead m)
    (progn (princ "You killed the ")
           (princ (type-of m))
           (princ "! "))
    (progn (princ "You hit the ")
           (princ (type-of m))
           (princ ", knocking off ")
           (princ x)
           (princ " health points! "))))
;;(type-of (make-monster))
;;;;MONSTER
;;;总体定义下
(defmethod monster-show (m)
  (princ "A fierce ")
  (princ (type-of m)))
;;占位
(defmethod monster-attack (m))
;;;orc
;;;defstruct还可以这样定义
(defstruct (orc (:include monster)) (club-level (randval 8)))
(push #'make-orc *monster-builders*)
(defmethod monster-show ((m orc));something like "defmethod function ((a number) (b string))"
  (princ "A wicked orc with a level ")
  (princ (orc-club-level m))
  (princ " club"))
(defmethod monster-attack ((m orc))
  (let ((x (randval (orc-club-level m))))
    (princ "An orc swings his club at you and knocks off ")
    (princ x)
    (princ " of your health points. ")
    (decf *player-health* x)))
;;;hydra,多头鸟
(defstruct (hydra (:include monster)))
(push #'make-hydra *monster-builders*)
(defmethod monster-show ((m hydra))
  (princ "A malicious hydra with ")
  (princ (monster-health m))
  (princ " heads."))
(defmethod monster-hit ((m hydra) x);x代表头数
  (decf (monster-health m) x)
  (if (monster-dead m)
    (princ "The corpse of the fully decapitated and decapacitated hydra
           falls to the floor!")
    (progn (princ "You lop off ")
           (princ x)
           (princ " of the hydra's heads! "))))
(defmethod monster-attack ((m hydra))
  (let ((x (randval (ash (monster-health m) -1))))
    (princ "A hydra attacks you with ")
    (princ x)
    (princ " of its heads! It also grows back one more head! ")
    (incf (monster-health m))
    (decf *player-health* x)))
;;;slime
(defstruct (slime-mold (:include monster)) (sliminess (randval 5)))
(push #'make-slime-mold *monster-builders*)
(defmethod monster-show ((m slime-mold))
  (princ "A slime mold with a sliminess of ")
  (princ (slime-mold-sliminess m)))
(defmethod monster-attack ((m slime-mold))
  (let ((x (randval (slime-mold-sliminess m))))
    (princ "A slime mold wraps around your legs and decreases your agility
           by ")
    (princ x)
    (princ "! ")
    (decf *player-agility* x)
    ;;为了防止进入永无止境的僵持,使slime有几率攻击
    (when (zerop (random 2))
      (princ "It also squirts in your face, taking away a health point! ")
      (decf *player-health*))))
;The Cunning Brigand
(defstruct (brigand (:include monster)))
(push #'make-brigand *monster-builders*)
(defmethod monster-attack ((m brigand))
  (let ((x (max *player-health* *player-agility* *player-strength*)))
    (cond ((= x *player-health*)
           (princ "A brigand hits you with his slingshot, taking off 2 health
                  points! ")
                  (decf *player-health* 2))
          ((= x *player-agility*)
           (princ "A brigand catches your leg with his whip, taking off 2
                  agility points! ")
           (decf *player-agility* 2))
          ((= x *player-strength*)
           (princ "A brigand cuts your arm with his whip, taking off 2
                  strength points! ")
           (decf *player-strength* 2)))))

```

然后这样开始游戏

```cl
(orc-battle)
```

不过游戏参数貌似设置的不太好，我基本是出来被秒的！！
