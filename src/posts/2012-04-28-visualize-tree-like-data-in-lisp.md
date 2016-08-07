---
layout: post
title: "Visualize tree like data in Lisp"
excerpt: "list的一些特殊列表及使用开源工具graphivz来可视化树状数据"
category: lisp
tags: [land-of-lisp]
disqus: true
---

## lisp中的特殊列表结构

- 点状列表
- pair
- circular list

***

## 可视化lisp数据

用graphviz把lisp中数据可视化的方法，代码如下：

```cl
;;切换到工作目录
(cd "/home/reverland/Documents/lisp/")
;;;有向图
;;定义节点及描述
(defparameter *wizard-nodes* '((living-room (you are in the living-room.
					     a wizard is snoring loudly on the couch.))
			       (garden (you are in a beautiful garden.
					w
				       )
				(attic (you are in the attic. there
					is a giant welding torch in the corner.)))))
;;定义节点与边
(defparameter *wizard-edges* '((living-room (garden west door)
				(attic upstairs ladder))
			       (garden (living-room east door))
			       (attic (living-room downstairs ladder))))
  ;;转换名函数
(defun dot-name (exp)
 (substitute-if #\_ (complement #'alphanumericp) (prin1-to-string exp)))
  ;将非字母数字的字符转化为下划线 
  ;;定义标签长度
(defparameter *max-label-length* 30)
  ;;处理位置描述
(defun dot-label (exp)
 (if exp
  (let ((s (write-to-string exp :pretty nil))); :pretty防止换行或加入tab
   (if (> (length s) *max-label-length*)
    (concatenate 'string 
     (subseq s 0 (- *max-label-length* 3)) "...")
    ;如果标签长度比最长值长，将超长的替换成...
    s))
  ""));strange,why not nil?
  ;;定义节点和标签函数
(defun nodes->dot (nodes)
 (mapc (lambda (node);mapc不返回列表
	(fresh-line)
	(princ (dot-name (car node)))
	(princ "[label=\"")
	(princ (dot-label node))
	(princ "\"];"))
  nodes))
  ;;定义遍历edges中每个元素，再对每个元素进行遍历
  (defun edges->dot (edges)
   (mapc (lambda (node)
	  (mapc (lambda (edge)
		 (fresh-line)
		 (princ (dot-name (car node)))
		 (princ "->")
		 (princ (dot-name (car edge)))
		 (princ "[label=\"")
		 (princ (dot-label (cdr edge)))
		 (princ "\"];"))
	   (cdr node)))
    edges))
  ;;生成dot文件内容
(defun graph->dot (nodes edges)
 (princ "digraph{")
 (nodes->dot nodes)
 (edges->dot edges)
 (princ "}"))
  ;;接受一个trunk，得到trunk的输出而非函数的值
  ;;to keep this dot->png function as reusable as possible, the graph->dot
  ;;function isn’t called directly. Instead, we write dot->png to accept a thunk
(defun dot->png (fname thunk)
 (with-open-file (*standard-output*;类比与let
		  fname ;输入到fname文件
		  :direction :output;keyword symbol即本身,方向输出
		  :if-exists :supersede);如果存在覆盖
  (funcall thunk));nully function
 (ext:shell (concatenate 'string "dot -Tpng -O " fname)))
;it's an O actually!it's not zero!
;;最后一步
(defun graph->png (fname nodes edges)
 (dot->png fname
  (lambda ();relay funcion
   (graph->dot nodes edges))));which is the trunk,I am not clear.
  ;;最后执行
  (graph->png "wizard.dot" *wizard-nodes* *wizard-edges*)
  ;;;无方向图
(defun uedges->dot (edges)
 (maplist (lambda (lst);遍历剩下的元素
	   (mapc (lambda (edge)
		  (unless (assoc (car edge) (cdr lst));除非以下不再出现这个位置
		   (fresh-line)
		   (princ (dot-name (caar lst)))
		   (princ "--")
		   (princ (dot-name (car edge)))
		   (princ "[label=\"")
		   (princ (dot-label (cdr edge)))
		   (princ "\"];")))
	    (cdar lst)))
  edges))
(defun ugraph->dot (nodes edges)
 (princ "graph{")
 (nodes->dot nodes)
 (uedges->dot edges)
 (princ "}"))
(defun ugraph->png (fname nodes edges)
 (dot->png fname
  (lambda ()
   (ugraph->dot nodes edges))))
  ;;执行命令
  (ugraph->png "uwizard.dot" *wizard-nodes* *wizard-edges*)

```

结合上回处理文本，觉得lisp在处理列表和文本时挺方便，虽然没有正则什么的。然后学习到lisp和unix环境交互还是比较方便的。

学会了一个生成文本数据的技术，把打印到终端而易于调试的输出包装成一个thunk，传递给其它函数。

学到了很多命令：

- cd(ext)
- substitute-if
- complement
- alphanumericp
- write-to-string
- subseq
- mapc
- maplist
- with-open-file
- funcall

***

## 参考资料

[graphivz中文使用指南](http://blog.openrays.org/blog.php?do=showone&tid=420)

