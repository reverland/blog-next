webpackJsonp([174,192],{448:function(n,t){n.exports={rawContent:'\n\n## 跑题的前言\n\n光阴飞逝，这本书已经看了半个月了。我没想过会这么啃一本英文书，收获良多，疑惑也多。匆匆学习到这一章时，再回头看前面的，恍若隔世。人的忘性还是很大的，如果不使用，终归一定会忘记的。希望自己能将这个爱好坚持下去，在此祭奠遗忘的R和perl。\n\n***\n\n## 什么是函数式编程\n我是从来看不进去定义的，实例更符合我认识世界的习惯，所以有人想明白什么是函数式编程，请参看[维基百科][1].\n\n关于函数式编程的特性和优点，阮一峰的日志有个比较好的笔记:[函数式编程初探][2].\n\n## 特性 \n\n- 函数式编程对同样的参数总会给出同样的值\n- 函数式编程不会产生副作用，仅仅返回一个计算的结果\n- 还有种像菜谱式的程序被认为是脏的程序，但能直接做很多事。纯函数完全不能做任何事，所以函数式编程通常将这两种程序分开。\n- 函数式编程可以写得更快、更紧凑、更少bug。\n\n## 实例\n\n```cl\n;the clean, functional part\n(defun add-widget (database widget)\n  (cons widget database))\n\n;the dirty, nonfunctional part\n(defparameter *database* nil)\n\n(defun main-loop ()\n  (loop (princ "Please enter the name of a new widget:")\n        (setf *database* (add-widget *database* (read)))\n        (format t "The database contains the following: ~a~%" *database*)))\n\n(defparameter *my-list* \'(4 7 2 3))\n\n;For demonstration purposes only. A lisper would not write code like this.\n(loop for n below (length *my-list*)\n      do (setf (nth n *my-list*) (+ (nth n *my-list*) 2)))\n*my-list*\n(defun add-two (list)\n  (when list\n    (cons (+ 2 (car list)) (add-two (cdr list)))))\n(add-two nil)\n;A lisper will use high-order function like this\n(mapcar (lambda (x)\n          (+ x 2))\n        \'(4 7 2 3))\n```\n\n[1]: http://zh.wikipedia.org/wiki/%E5%87%BD%E6%95%B8%E7%A8%8B%E5%BC%8F%E8%AA%9E%E8%A8%80\n[2]: http://www.ruanyifeng.com/blog/2012/04/functional_programming.html\n',metaData:{layout:"post",title:"函数式编程初体验",excerpt:"关于函数式编程",category:"lisp",tags:["land-of-lisp"],disqus:!0}}}});