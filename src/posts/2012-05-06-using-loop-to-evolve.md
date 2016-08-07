---
layout: post
title: "Using Loop To Evolve"
excerpt: "Something like life game."
category: lisp 
tags: [land-of-lisp]
disqus: true
---


## 满目的loop

loop是lisp中饱受争议的命令，因为它看起来不这么lispy，但它真得很强大。以下列举下基本用法：

```cl
(loop for i
      below 5
      sum i) 
;counting from a starting point to an ending point
(loop for i
      from 5
      to 10
      sum i)
;iterating through values in a list
(loop for i
      in '(100 20 3)
      sum i)
;doing stuff in a loop
(loop for i
      below 5
      do (print i))
;dong stuff under certain conditions
(loop for i
      below 10
      when (oddp i)
      sum i)
;breaking out of a loop early
(loop for i
      from 0
      do (print i)
      when (= i 5)
      return 'falafel)
;collecting a list of values
(loop for i
      in '(2 3 4 5 6)
      collect (* i i))
;using multiple for clauses
;loop 10 times
(loop for x below 10
      for y below 10
      collect (+ x y))
;nested loops for 10x10 times
(loop for x below 10
      collect (loop for y below 10
                    collect (+ x y)))
;track the index number of items in a list
(loop for i
      from 0
      for day
      in '(monday tuesday wednesday thursday friday saturday sunday)
      collect (cons i day))
```

当然还有很多，这个命令异常灵活，以致于作者做了个[loop周期表][1]。

## Using Loop to Evolve

这个游戏看上去还挺轻松的，很有意思的“生命游戏”。不多说了，上码

```cl
;;;The extent of the world
(defparameter *width* 100)
(defparameter *height* 30)
(defparameter *jungle* '(45 10 10 10))
(defparameter *plant-energy* 80)
;;;Growing plants in our world
;;cons cells should be compared with equal
(defparameter *plants* (make-hash-table :test #'equal))
;;Grow new plants
(defun random-plant (left top width height)
  (let ((pos (cons (+ left (random width)) (+ top (random height)))))
    (setf (gethash pos *plants*) t)))
(defun add-plants ()
  (apply #'random-plant *jungle*)
  (random-plant 0 0 *width* *height*))
;;;Creating animals
(defstruct animal x y energy dir genes)
;;x,y stand for the position
;;energy represent its energy,when the energy exhausted,it will die
;;dir is the direction it faced
;;genes decide the direction it will choose
;;Creating an animal in the center of the map
(defparameter *animals*
  (list (make-animal :x;we only use list to traverse animal,
                     ;its efficient enough.
                     (ash *width* -1)
                     :y
                     (ash *height* -1)
                     :energy
                     1000
                     :dir
                     0
                     :genes
                     (loop repeat 8
                           ;collect is OK??
                           collecting (1+ (random 10))))))
;;;Handling animal motion
(defun move (animal)
  (let ((dir (animal-dir animal))
        (x (animal-x animal))
        (y (animal-y animal)))
    ;如果达到*width*,置0
    (setf (animal-x animal) (mod (+ x
                                    (cond ((and (>= dir 2) (< dir 5)) 1)
                                          ((or (= dir 1) (= dir 5)) 0)
                                          (t -1))
                                    *width*)
                                 *width*))
    (setf (animal-y animal) (mod (+ y
                                    (cond ((and (>= dir 0) (< dir 3)) -1)
                                          ((and (>= dir 4) (< dir 7)) 1)
                                          (t 0))
                                    *height*)
                                 *height*))
    (decf (animal-energy animal))))
;;;Handling animal turning
(defun turn (animal)
  (let ((x (random (apply #'+ (animal-genes animal)))))
    ;;this was not easy to understand it,
    ;;当随机数落在哪个区间就哪个方向的递归描述
    (labels ((angle (genes x)
               (let ((xnu (- x (car genes))))
                 (if (< xnu 0)
                   0
                   (1+ (angle (cdr genes) xnu))))))
      (setf (animal-dir animal)
            (mod (+ (animal-dir animal) (angle (animal-genes animal) x))
              8)))))
;;;Handling animal eating
(defun eat (animal)
  (let ((pos (cons (animal-x animal) (animal-y animal))))
    (when (gethash pos *plants*)
      (incf (animal-energy animal) *plant-energy*)
      (remhash pos *plants*))))
;;;Handling animal reproduction
;;定义繁殖时需要能量
(defparameter *reproduction-energy* 200)
(defun reproduce (animal)
  (let ((e (animal-energy animal)))
    (when (>= e *reproduction-energy*)
      (setf (animal-energy animal) (ash e -1))
      (let ((animal-nu (copy-structure animal));浅复制命令
            (genes (copy-list (animal-genes animal)))
            (mutation (random 8)))
        (setf (nth mutation genes) 
              (max 1 (+ (nth mutation genes) (random 3) -1)))
;This means the gene value will change plus or minus one, or
;stay the same.
        (setf (animal-genes animal-nu) genes)
        (push animal-nu *animals*)))))
;;;Simulating a day in our world
(defun update-world ()
  (setf *animals* (remove-if (lambda (animal)
                               (<= (animal-energy animal) 0))
                             *animals*))
  (mapc (lambda (animal)
          (turn animal)
          (move animal)
          (eat animal)
          (reproduce animal))
        *animals*)
  (add-plants))
;;;Drawing our world
;;;This has low performance but will not matters
(defun draw-world ()
  (loop for y
        below *height*
        do (progn 
             (fresh-line);outputs a newline only if the output-stream
             ;is not already at the start of a line
             (princ "|")
             (loop for x
                   below *width*
                   do (princ (cond ((some (lambda (animal)
                                     ;可能不止一个动物
                                            (and (= (animal-x animal) x)
                                                 (= (animal-y animal) y)))
                                          *animals*)
                                    #\M)
                                   ((gethash (cons x y) *plants*) #\*)
                                   (t #\space))))
             (princ "|"))))
;;;Creating a user interface
(defun evolution ()
  (draw-world)
  (fresh-line)
  (let ((str (read-line)))
    (cond ((equal str "quit") ())
;Recall Conrad’s Rule of Thumb for Comparing Stuff
;use eq for symbols
;use equal for everything else
          (t (let ((x (parse-integer str :junk-allowed t)))
               (if x
                 (loop for i
                       below x
                       do (update-world)
                       if (zerop (mod i 1000))
                       do (princ #\.))
                 (update-world))
               (evolution))))))

```

这样开始模拟

```cl
(evolution)
```

回车看看，100次看看，5000000次看看，据作者说5million次sbcl几分钟就可以搞定。我相信我的计算机比作者那时候好，可是....

```cl
Evaluation took:
  789.430 seconds of real time
  459.846682 seconds of total run time (456.986869 user, 2.859813 system)
  [ Run times consist of 18.864 seconds GC time, and 440.983 seconds non-GC time. ]
  58.25% CPU
  1,785,005,533,676 processor cycles
  125,872,778,768 bytes consed
```

什么叫手抖竟然开始打成了5billion.这时候科学计数法就发挥作用了，感谢自由建客。

***

Looks good however，

M代表某无性生殖动物，`*`代表某随机生长植物

<img src="http://lhtlyybox.googlecode.com/files/%E6%8A%93%E5%9B%BE75.png" hight="200" width="400" alt="虚拟进化" />

***

## 写在最后

资源丰富区自然选择留下了那些逡巡不前的，资源短缺区留下了富于冒险的。

之后有上网查查其它进化游戏，发现资源丰富时资源消耗小的被淘汰，资源缺乏时资源消耗大的被淘汰

启发性的游戏啊

最后看了个有关进化选择的视频，是某研究人员们通过进化设计人工大脑的，感觉很震惊。特别是看到最后对之失控，看到人工大脑进化出意想不到的特性时。

[1]: http://landoflisp.com/
