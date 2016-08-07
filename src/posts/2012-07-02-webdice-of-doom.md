---
layout: post
title: "基于web的Dice of Doom"
excerpt: "基于web的Dice of Doom游戏，html5版"
category: lisp
tags: [land-of-lisp]
disqus: true
---


# 基于web的Dice of Doom游戏

眼看最后两章了,虽然AI那里云山雾罩,然而看到web又精神为之一震,真是看得高潮迭起啊。作者也很给力，直接用html5来编写web应用，把svg直接嵌入到html中。可惜作者用的是firefox3.7 alpha，为了在我的archlinux x86_64的firefox12上运行良好，还是多废了些心机。这章看着很爽。

## 绘制游戏元素

毋庸置疑，所有游戏界面要用svg画出来，于是我们之前写得 [svg库](/lisp/2012/06/16/dsl/) 要派上用场了。什么？已经没有了？那么从该书主页上下载[svg.lisp](http://landoflisp.com/source.html).

由于要创建个基于web的应用程序，之前的[webserver](/lisp/2012/05/12/web-server-written-in-lisp/)也需要加载。

当然还有我们的游戏新引擎[Dice of Doom v2](/lisp/2012/06/29/dice-of-doom-v2/)

```cl
(cd "~/Documents/lisp") 
(load "dice_of_doom_v2")
(load "webserver")
(load "svg.lisp")
```

然后需要先设定一些常数

```cl
(defparameter *board-width* 900);面板宽度
(defparameter *board-height* 500);面板高度
(defparameter *board-scale* 64);面板缩放比例
(defparameter *top-offset* 3);两摞起来的骰子相对位移
(defparameter *dice-scale* 40);骰子缩放比例
(defparameter *dot-size* 0.05);骰子上点的大小
```

接下来画骰子

```cl
(defun draw-die-svg (x y col)
  (labels ((calc-pt (pt)
             (cons (+ x (* *dice-scale* (car pt)))
                   (+ y (* *dice-scale* (cdr pt)))))
           (f (pol col)
             (polygon (mapcar #'calc-pt pol) col)))
    (f '((0 . -1) (-0.6 . -0.75) (0 . -0.5) (0.6 . -0.75))
       (brightness col 40))
    (f '((0 . -0.5) (-0.6 . -0.75) (-0.6 . 0) (0 . 0.25))
       col)
    (f '((0 . -0.5) (0.6 . -0.75) (0.6 . 0) (0 . 0.25))
       (brightness col -40))
    (mapc (lambda (x y)
            (polygon (mapcar (lambda (xx yy)
                               (calc-pt (cons (+ x (* xx *dot-size*))
                                              (+ y (* yy *dot-size*)))))
                             '(-1 -1 1 1)
                             '(-1 1 1 -1))
                     '(255 255 255)))
          '(-0.05 0.125 0.3 -0.3 -0.125 0.05 0.2 0.2 0.45 0.45 -0.45 -0.2)
          '(-0.875 -0.80 -0.725 -0.775 -0.70 -0.625 -0.35 -0.05 -0.45 -0.15 -0.45 -0.05))))
;(with-open-file (*standard-output* "die.svg" :direction :output :if-exists :supersede) (svg 100 100 (draw-die-svg 50 50 '(255 0 0)))) 
```

再画一小块面板

```cl
(defun draw-tile-svg (x y pos hex xx yy col chosen-tile)
  (loop for z below 2
        do (polygon (mapcar (lambda (pt)
                              (cons (+ xx (* *board-scale* (car pt)))
                                    (+ yy (* *board-scale*
                                             (+ (cdr pt) (* (- 1 z) 0.1))))))
                            '((-1 . -0.2) (0 . -0.5) (1 . -0.2)
                                          (1 . 0.2) (0 . 0.5) (-1 . 0.2)))
                    (if (eql pos chosen-tile)
                      (brightness col 100)
                      col)))
  (loop for z below (second hex)
        do (draw-die-svg (+ xx
                            (* *dice-scale*
                               0.3
                               (if (oddp (+ x y z))
                                 -0.3
                                 0.3)))
                         (- yy (* *dice-scale* z 0.8)) col)))

;(with-open-file (*standard-output* "tile.svg" :direction :output) (svg 300 300 (draw-tile-svg 0 0 0 '(0 3) 100 150 '(255 0 0) nil)))
```

接下来是整个面板

```cl
;Draw the Board
(defparameter *die-colors* '((255 63 63) (63 63 255)))
(defun draw-board-svg (board chosen-tile legal-tiles)
  (loop for y below *board-size*
        do (loop for x below *board-size*
                 for pos = (+ x (* *board-size* y))
                 for hex = (aref board pos)
                 for xx = (* *board-scale* (+ (* 2 x) (- *board-size* y)))
                 for yy = (* *board-scale* (+ (* y 0.7) *top-offset*))
                 for col = (brightness (nth (first hex) *die-colors*)
                                       (* -15 (- *board-size* y)))
                 do (if (member pos legal-tiles)
                      (tag g ()
                        (tag a ("xlink:href" (make-game-link pos))
                          (draw-tile-svg x y pos hex xx yy col chosen-tile)))
                      (draw-tile-svg x y pos hex xx yy col chosen-tile)))))
(defun make-game-link (pos)
  (format nil "/game.html?chosen=~a" pos))
;(with-open-file (*standard-output* "board.svg" :direction :output :if-exists :supersede) (svg *board-width* *board-height* (draw-board-svg (gen-board) nil nil)))
```

这有个问题，之前我们svg宏不是像上文中那样定义的，svg宏需要稍加修改，具体参见本书的[errata](http://landoflisp.com/errata.html)

## 建立Web服务器

先写游戏的驱动

```cl
(defparameter *cur-game-tree* nil);初始化当前游戏树
(defparameter *from-tile* nil);选择的一片面板

(defun dod-request-handler (path header params)
  (if (equal path "game.html")
    (progn (princ "HTTP/1.1 200 OK

                  <!doctype html>
                  <html><head></head><body>")
           (tag center ()
             (princ "Welcome to DICE OF DOOM!")
             (tag br ())
             (let ((chosen (assoc 'chosen params)))
               (when (or (not *cur-game-tree*) (not chosen))
                 (setf chosen nil)
                 (web-initialize))
               (cond ((lazy-null (caddr *cur-game-tree*))
                      (web-announce-winner (cadr *cur-game-tree*)))
                     ((zerop (car *cur-game-tree*))
                      (web-handle-human
                        (when chosen
                          (read-from-string (cdr chosen)))))
                     (t (web-handle-computer))))
             (tag br ())
             (draw-dod-page *cur-game-tree* *from-tile*))
           (princ "</body></html>")) 
    (princ "Sorry... I don't know that page.")))
```

在这里我稍作修改，更改了服务器返回给浏览器的信息，使它更加符合标准能在firefox12中运行正常。

我们只做了一个超级简化的服务器，功能弱爆了，但作者许诺能在最后一章很轻易的扩展。之后我们处理些基于webserver的函数

```cl
(defun web-initialize ()
  (setf *from-tile* nil)
  (setf *cur-game-tree* (game-tree (gen-board) 0 0 t)))
;宣布胜者web version
(defun web-announce-winner (board)
  (fresh-line)
  (let ((w (winners board)))
    (if (> (length w ) 1)
      (format t "The game is a tie between ~a" (mapcar #'player-letter w))
      (format t "The winner is ~a" (player-letter (car w)))))
  (tag a (href "game.html")
    (princ " play again")))
;处理人类玩家
(defun web-handle-human (pos)
  (cond ((not pos) (princ "Please choose a hex to move from:"))
        ((eq pos 'pass) (setf *cur-game-tree*
                              (cadr (lazy-car (caddr *cur-game-tree*))))
                        (princ "Your reinforcements have been placed.")
                        (tag a (href (make-game-link nil))
                          (princ "continue")))
        ((not *from-tile*) (setf *from-tile* pos)
                           (princ "Now choose a destination:"))
        ((eq pos *from-tile*) (setf *from-tile* nil)
                              (princ "Move cancelled."))
        (t (setf *cur-game-tree*
                 (cadr (lazy-find-if (lambda (move)
                                       (equal (car move)
                                              (list *from-tile* pos)))
                                     (caddr *cur-game-tree*))))
           (setf *from-tile* nil)
           (princ "You may now ")
           (tag a (href (make-game-link 'pass))
             (princ "pass"))
           (princ " or make another move:"))))
;处理计算机玩家
(defun web-handle-computer ()
  (setf *cur-game-tree* (handle-computer *cur-game-tree*))
  (princ "The computer has moved. ")
  (tag script ()
    (princ
      "window.setTimeout('window.location=\"game.html?chosen=NIL\"',3000)")));javascript，改成3秒了，感觉5秒在我这里太慢了
```

然后在html中绘制svg游戏面板时有些tweak，首先是svg，你遵照之前errata提到的修正svg宏后才能正常显示，否则只显示一小块或完全看不到时可别吃惊。另外是作者定义两次点击同一片游戏面板代表取消，但它的legal-tile（合法面板）中却没有包含本身，以致于不能正常取消选中。我做了如下修改，把当前选中的游戏面板添加进合法面板中。

```cl
;caXXXXXXXdr……以后我要用firstsecond改写
(defun draw-dod-page (tree selected-tile)
  (svg *board-width* ;svg要更改！！
       *board-height* 
       (draw-board-svg (cadr tree)
                       selected-tile
                       (cons selected-tile;what I add 
                             (take-all (if selected-tile
                                   (lazy-mapcar
                                     (lambda (move)
                                       (when (eql (caar move)
                                                  selected-tile)
                                         (cadar move)))
                                     (caddr tree))
                                   (lazy-mapcar #'caar (caddr tree))))))))
```

然后很显然，enjoy我们基于网络的游戏吧

```cl
(serve #'dod-request-handler)
```

<hr />

## 游戏截图

截个图看看效果

![](http://fmn.rrimg.com/fmn064/20120702/1345/p_large_vHyz_01a000007c271262.jpg!)

