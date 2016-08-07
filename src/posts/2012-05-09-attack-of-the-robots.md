---
layout: post
title: "Attack of the Robots"
excerpt: "Yet another robots game written with loop and format"
category: lisp
tags: [land-of-lisp]
disqus: true
---


## Powerful format

format又是一个在common lisp中灵活“过头”，争议超多的一个宏。它十分强大。

基本用法如下

```cl
(princ (reverse (format nil "Add onion rings for only ~$ dollars more!" 1.5))) 
;;;Control sequences for printing lisp values
;;(prin1 "foo")
(format t "I am printing ~s in the middle of this sentence" "foo")
;;(princ "foo")
(format t "I am printing ~a in the middle of this sentence" "foo")
;;第一个参数,右边补白
(format t "I am printing ~10a within ten spaces of room." "foo")
;;第二个参数，分成3部分，补白9格
(format t "I am printing ~10,3a within ten (or more) spaces of room." "foo")
;;第三个参数，右边补白4格
(format t "I am printing ~,,4a in the middle of this sentence." "foo")
;;第四个参数，补充符号
(format t "The world ~,,4,'!a feels very important." "foo")
(format t "The world ~,,4,'!@a feels very important." "foo")
;;;Control Sequences for formatting numbers
;;Integers
(format t "The number 1000 in hexadrcimal is ~x" 1000)
(format t "The number 1000 in hexadrcimal is ~b" 1000)
(format t "The number 1000 in hexadrcimal is ~d" 1000)
;digit group separators
(format t "Numbers with commas in them are ~:d times better." 1000000)
(format t "I am printing ~10d within ten spaces of room." 1000000)
(format t "I am printing ~10,'xd within ten spaces of room." 1000000)
;;;Control Sequences for formatting Floating-point numbers
;;default
(format t "PI can be estimated as ~4f" 3.141593)
;;小数点后数位
(format t "PI can be estimated as ~,4f" pi)
;;Percentage
(format t "Percentages are ~,,2f percent better than fractions" 0.77)
;;Format currency
(format t "I wish I had ~$ dollars in my bank account." 1000000.2)
;;;Print multiple lines of output
;;terpri
(progn (princ 22)
       (terpri)
       (princ 33))
;;fresh-line
(progn (princ 22)
       (fresh-line)
       (fresh-line)
       (princ 33))
;;~% like terpri
;;~& like fresh-line
(progn (format t "This is on one line ~%")
       (format t "~%This is on another line")) 
(progn (format t "This is on one line ~&")
       (format t "~&This is on another line"))
;;there can be a number in front of them
(format t "this will print ~5%on two lines spread far apart")
(format t "this will print ~5&on two lines spread far apart")
;;;Justifying output
;;for example a function
(defun random-animal ()
  (nth (random 5) '("dog" "tick" "tiger" "walrus" "kangaroo")))
;;equally width
(loop repeat 10
      do (format t "~5t~a ~15t~a ~25t~a~%"
                 (random-animal)
                 (random-animal)
                 (random-animal)))
;;equally apart
(loop repeat 10
      do (format t "~30<~a~;~a~;~a~>~%"
                 (random-animal)
                 (random-animal)
                 (random-animal)))
;;center
(loop repeat 10
      do (format t "~30:@<~a~>~%" (random-animal)))
(loop repeat 10
      do (format t "~30:@<~a~;~a~;~a~>~%"
                 (random-animal)
                 (random-animal)
                 (random-animal)))
;;still wavy?to make it like this
(loop repeat 10
      do (format t "~10:@<~a~>~10:@<~a~>~10:@<~a~>~%"
                 (random-animal)
                 (random-animal)
                 (random-animal)))
;;;Iterating Through Lists Using Control Sequences
;;Lets create a list of animals
(defparameter *animals* (loop repeat 10 collect (random-animal)))
;;loop through sequenses
(format t "~{I see a ~a! ~%~}" *animals*) 
;;not only one item
(format t "~{I see a ~a... or was it a ~a?~%~}" *animals*)
;;;A crazy formatting trick for creating pretty tables of data
(format t "|~{~<|~%|~,33:;~2d ~>~}|"
        (loop for x below 100 collect x))
```

可以看到，format的参数多的……而且像perl一样有很多“奇怪”的符号。

## Attack by robots

让我们接下来看看一个被作者称作可怕的游戏，It's really drive me crazy!!

```cl
;;;整个界面大小为16x64，产生个1024长度序列
(defun robots ()
  (loop named main;便于跳出
     ;;方向
     with directions = '((q . -65) (w . -64) (e . -63) (a . -1)
                         (d .   1) (z .  63) (x .  64) (c . 65))
     ;;初始位置
     for pos = 544
     then (progn (format t "~%qwe/asd/zxc to move, (t)eleport, (l)eave:")
                 (force-output);clean any output not waiting return
                 (let* ((c (read))
                        (d (assoc c directions)))
                   (cond (d (+ pos (cdr d)))
                         ((eq 't c) (random 1024))
                         ((eq 'l c) (return-from main 'bye))
                         (t pos))))
     ;;获得monster的位置
     for monsters = (loop repeat 10
                          collect (random 1024))
     then (loop for mpos in monsters
                collect (if (> (count mpos monsters) 1)
                          mpos
                          ;;都走了一遍。
                          (cdar (sort (loop for (k . d) in directions
                                            for new-mpos = (+ mpos d)
                                            ;行与列距离和与新位置cons                                
                                            collect (cons (+ (abs (- (mod new-mpos 64) 
                                                                     (mod pos 64)))
                                                             (abs (- (ash new-mpos -6)
                                                                     (ash pos -6))))
                                                          new-mpos))
                                      '<
                                      :key #'car))))
     when (loop for mpos in monsters
                always (> (count mpos monsters) 1))
     return 'player-wins
     do (format t
                "~%|~{~<|~%|~,65:;~A~>~}|"
                (loop for p 
                      below 1024
                      collect (cond ((member p monsters) 
                                     (cond ((= p pos) (return-from main 'player-loses))
                                           ((> (count p monsters) 1) #\#)
                                           (t #\A)))
                                    ((= p pos) 
                                     #\@)
                                    (t 
                                     #\ ))))))

```

整个游戏就一个函数，由loop和format这种强大的lisp异类来完成。

## 写在最后

挺好玩的一个游戏。挺难理解的代码……

为了看懂又回头看看作者的loop周期表，再次见识了format和loop的强大之处，也感受到了它们的复杂。
