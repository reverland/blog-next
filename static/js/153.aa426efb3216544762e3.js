webpackJsonp([153,192],{469:function(e,n){e.exports={rawContent:'\n\n# 基于web的Dice of Doom游戏\n\n眼看最后两章了,虽然AI那里云山雾罩,然而看到web又精神为之一震,真是看得高潮迭起啊。作者也很给力，直接用html5来编写web应用，把svg直接嵌入到html中。可惜作者用的是firefox3.7 alpha，为了在我的archlinux x86_64的firefox12上运行良好，还是多废了些心机。这章看着很爽。\n\n## 绘制游戏元素\n\n毋庸置疑，所有游戏界面要用svg画出来，于是我们之前写得 [svg库](/lisp/2012/06/16/dsl/) 要派上用场了。什么？已经没有了？那么从该书主页上下载[svg.lisp](http://landoflisp.com/source.html).\n\n由于要创建个基于web的应用程序，之前的[webserver](/lisp/2012/05/12/web-server-written-in-lisp/)也需要加载。\n\n当然还有我们的游戏新引擎[Dice of Doom v2](/lisp/2012/06/29/dice-of-doom-v2/)\n\n```cl\n(cd "~/Documents/lisp") \n(load "dice_of_doom_v2")\n(load "webserver")\n(load "svg.lisp")\n```\n\n然后需要先设定一些常数\n\n```cl\n(defparameter *board-width* 900);面板宽度\n(defparameter *board-height* 500);面板高度\n(defparameter *board-scale* 64);面板缩放比例\n(defparameter *top-offset* 3);两摞起来的骰子相对位移\n(defparameter *dice-scale* 40);骰子缩放比例\n(defparameter *dot-size* 0.05);骰子上点的大小\n```\n\n接下来画骰子\n\n```cl\n(defun draw-die-svg (x y col)\n  (labels ((calc-pt (pt)\n             (cons (+ x (* *dice-scale* (car pt)))\n                   (+ y (* *dice-scale* (cdr pt)))))\n           (f (pol col)\n             (polygon (mapcar #\'calc-pt pol) col)))\n    (f \'((0 . -1) (-0.6 . -0.75) (0 . -0.5) (0.6 . -0.75))\n       (brightness col 40))\n    (f \'((0 . -0.5) (-0.6 . -0.75) (-0.6 . 0) (0 . 0.25))\n       col)\n    (f \'((0 . -0.5) (0.6 . -0.75) (0.6 . 0) (0 . 0.25))\n       (brightness col -40))\n    (mapc (lambda (x y)\n            (polygon (mapcar (lambda (xx yy)\n                               (calc-pt (cons (+ x (* xx *dot-size*))\n                                              (+ y (* yy *dot-size*)))))\n                             \'(-1 -1 1 1)\n                             \'(-1 1 1 -1))\n                     \'(255 255 255)))\n          \'(-0.05 0.125 0.3 -0.3 -0.125 0.05 0.2 0.2 0.45 0.45 -0.45 -0.2)\n          \'(-0.875 -0.80 -0.725 -0.775 -0.70 -0.625 -0.35 -0.05 -0.45 -0.15 -0.45 -0.05))))\n;(with-open-file (*standard-output* "die.svg" :direction :output :if-exists :supersede) (svg 100 100 (draw-die-svg 50 50 \'(255 0 0)))) \n```\n\n再画一小块面板\n\n```cl\n(defun draw-tile-svg (x y pos hex xx yy col chosen-tile)\n  (loop for z below 2\n        do (polygon (mapcar (lambda (pt)\n                              (cons (+ xx (* *board-scale* (car pt)))\n                                    (+ yy (* *board-scale*\n                                             (+ (cdr pt) (* (- 1 z) 0.1))))))\n                            \'((-1 . -0.2) (0 . -0.5) (1 . -0.2)\n                                          (1 . 0.2) (0 . 0.5) (-1 . 0.2)))\n                    (if (eql pos chosen-tile)\n                      (brightness col 100)\n                      col)))\n  (loop for z below (second hex)\n        do (draw-die-svg (+ xx\n                            (* *dice-scale*\n                               0.3\n                               (if (oddp (+ x y z))\n                                 -0.3\n                                 0.3)))\n                         (- yy (* *dice-scale* z 0.8)) col)))\n\n;(with-open-file (*standard-output* "tile.svg" :direction :output) (svg 300 300 (draw-tile-svg 0 0 0 \'(0 3) 100 150 \'(255 0 0) nil)))\n```\n\n接下来是整个面板\n\n```cl\n;Draw the Board\n(defparameter *die-colors* \'((255 63 63) (63 63 255)))\n(defun draw-board-svg (board chosen-tile legal-tiles)\n  (loop for y below *board-size*\n        do (loop for x below *board-size*\n                 for pos = (+ x (* *board-size* y))\n                 for hex = (aref board pos)\n                 for xx = (* *board-scale* (+ (* 2 x) (- *board-size* y)))\n                 for yy = (* *board-scale* (+ (* y 0.7) *top-offset*))\n                 for col = (brightness (nth (first hex) *die-colors*)\n                                       (* -15 (- *board-size* y)))\n                 do (if (member pos legal-tiles)\n                      (tag g ()\n                        (tag a ("xlink:href" (make-game-link pos))\n                          (draw-tile-svg x y pos hex xx yy col chosen-tile)))\n                      (draw-tile-svg x y pos hex xx yy col chosen-tile)))))\n(defun make-game-link (pos)\n  (format nil "/game.html?chosen=~a" pos))\n;(with-open-file (*standard-output* "board.svg" :direction :output :if-exists :supersede) (svg *board-width* *board-height* (draw-board-svg (gen-board) nil nil)))\n```\n\n这有个问题，之前我们svg宏不是像上文中那样定义的，svg宏需要稍加修改，具体参见本书的[errata](http://landoflisp.com/errata.html)\n\n## 建立Web服务器\n\n先写游戏的驱动\n\n```cl\n(defparameter *cur-game-tree* nil);初始化当前游戏树\n(defparameter *from-tile* nil);选择的一片面板\n\n(defun dod-request-handler (path header params)\n  (if (equal path "game.html")\n    (progn (princ "HTTP/1.1 200 OK\n\n                  <!doctype html>\n                  <html><head></head><body>")\n           (tag center ()\n             (princ "Welcome to DICE OF DOOM!")\n             (tag br ())\n             (let ((chosen (assoc \'chosen params)))\n               (when (or (not *cur-game-tree*) (not chosen))\n                 (setf chosen nil)\n                 (web-initialize))\n               (cond ((lazy-null (caddr *cur-game-tree*))\n                      (web-announce-winner (cadr *cur-game-tree*)))\n                     ((zerop (car *cur-game-tree*))\n                      (web-handle-human\n                        (when chosen\n                          (read-from-string (cdr chosen)))))\n                     (t (web-handle-computer))))\n             (tag br ())\n             (draw-dod-page *cur-game-tree* *from-tile*))\n           (princ "</body></html>")) \n    (princ "Sorry... I don\'t know that page.")))\n```\n\n在这里我稍作修改，更改了服务器返回给浏览器的信息，使它更加符合标准能在firefox12中运行正常。\n\n我们只做了一个超级简化的服务器，功能弱爆了，但作者许诺能在最后一章很轻易的扩展。之后我们处理些基于webserver的函数\n\n```cl\n(defun web-initialize ()\n  (setf *from-tile* nil)\n  (setf *cur-game-tree* (game-tree (gen-board) 0 0 t)))\n;宣布胜者web version\n(defun web-announce-winner (board)\n  (fresh-line)\n  (let ((w (winners board)))\n    (if (> (length w ) 1)\n      (format t "The game is a tie between ~a" (mapcar #\'player-letter w))\n      (format t "The winner is ~a" (player-letter (car w)))))\n  (tag a (href "game.html")\n    (princ " play again")))\n;处理人类玩家\n(defun web-handle-human (pos)\n  (cond ((not pos) (princ "Please choose a hex to move from:"))\n        ((eq pos \'pass) (setf *cur-game-tree*\n                              (cadr (lazy-car (caddr *cur-game-tree*))))\n                        (princ "Your reinforcements have been placed.")\n                        (tag a (href (make-game-link nil))\n                          (princ "continue")))\n        ((not *from-tile*) (setf *from-tile* pos)\n                           (princ "Now choose a destination:"))\n        ((eq pos *from-tile*) (setf *from-tile* nil)\n                              (princ "Move cancelled."))\n        (t (setf *cur-game-tree*\n                 (cadr (lazy-find-if (lambda (move)\n                                       (equal (car move)\n                                              (list *from-tile* pos)))\n                                     (caddr *cur-game-tree*))))\n           (setf *from-tile* nil)\n           (princ "You may now ")\n           (tag a (href (make-game-link \'pass))\n             (princ "pass"))\n           (princ " or make another move:"))))\n;处理计算机玩家\n(defun web-handle-computer ()\n  (setf *cur-game-tree* (handle-computer *cur-game-tree*))\n  (princ "The computer has moved. ")\n  (tag script ()\n    (princ\n      "window.setTimeout(\'window.location=\\"game.html?chosen=NIL\\"\',3000)")));javascript，改成3秒了，感觉5秒在我这里太慢了\n```\n\n然后在html中绘制svg游戏面板时有些tweak，首先是svg，你遵照之前errata提到的修正svg宏后才能正常显示，否则只显示一小块或完全看不到时可别吃惊。另外是作者定义两次点击同一片游戏面板代表取消，但它的legal-tile（合法面板）中却没有包含本身，以致于不能正常取消选中。我做了如下修改，把当前选中的游戏面板添加进合法面板中。\n\n```cl\n;caXXXXXXXdr……以后我要用firstsecond改写\n(defun draw-dod-page (tree selected-tile)\n  (svg *board-width* ;svg要更改！！\n       *board-height* \n       (draw-board-svg (cadr tree)\n                       selected-tile\n                       (cons selected-tile;what I add \n                             (take-all (if selected-tile\n                                   (lazy-mapcar\n                                     (lambda (move)\n                                       (when (eql (caar move)\n                                                  selected-tile)\n                                         (cadar move)))\n                                     (caddr tree))\n                                   (lazy-mapcar #\'caar (caddr tree))))))))\n```\n\n然后很显然，enjoy我们基于网络的游戏吧\n\n```cl\n(serve #\'dod-request-handler)\n```\n\n<hr />\n\n## 游戏截图\n\n截个图看看效果\n\n![](http://fmn.rrimg.com/fmn064/20120702/1345/p_large_vHyz_01a000007c271262.jpg!)\n\n',metaData:{layout:"post",title:"基于web的Dice of Doom",excerpt:"基于web的Dice of Doom游戏，html5版",category:"lisp",tags:["land-of-lisp"],disqus:!0}}}});