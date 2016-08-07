---
layout: post
title: "Streams in Lisp"
excerpt: "clisp中的stream"
category: lisp
tags: [land-of-lisp]
disqus: true
---


lisp中有多种流，不同的流与不同的资源交互。这些流包括控制台流，文件流，socket流和字符串流。

流的处理方式是popup和push.

流可依据方向分为输入流和输出流。

Socket流允许网络上的计算机程序进行通信。我们必须在通信的两端都打开socket并且在程序间建立连接。

字符串流允许我们使用不需要连接外部资源来使用流的函数来调试，同时能帮我们用优美有效率的方法（with-open-to-string）来建立复杂字符串。但这个宏不符合函数式编程原则，争议很大。

下面是使用stream的一些例子

```cl
;;在做图的那部分已经见识过了
;;to see if we have a valid output stream
(output-stream-p *standard-output*) 
;;write a chracter to stream
(write-char #\x *standard-output*)

;;to see if we have a valid stream
(input-stream-p *standard-input*)
;;pop an item off the stream
(read-char *standard-input*)
;123
;\#1
;;reading and printing can be used too
;;;reading and writing with files
(with-open-file (my-stream "data.txt" :direction :output)
  (print "my data" my-stream))
(with-open-file (my-stream "data.txt" :direction :input)
  (read my-stream))
;;;some more complicated examples using print and read
(let ((animal-noises '((dog . woof)
                       (cat . meow))))
  (with-open-file (my-stream "animal-noises.txt" :direction :output)
    (print animal-noises my-stream)))
(with-open-file (my-stream "animal-noises.txt" :direction :input)
  (read my-stream))
;;if exists
(with-open-file (my-stream "data.txt" :direction :output :if-exists :error)
  (print "my data" my-stream)) 
(with-open-file (my-stream "data.txt" :direction :output :if-exists :supersede)
  (print "my data" my-stream))
;;stream over a socket
(defparameter my-socket (socket-server 4321)) ;ON THE SERVER
(defparameter my-stream (socket-accept my-socket)) ;ON THE SERVER
;;It's a bidirectional stream
;;princ may cause strange things
(print "Yo Server!" my-stream) ;ON THE CLIENT
(read my-stream) ;ON THE SERVER
(print "What up, Client!" my-stream) ;ON THE SERVER
(read my-stream) ;ON THE CLIENT
;;tidying up after ourselves
(close my-stream) ;ON BOTH
(socket-server-close my-socket) ;ON THE SERVER
;;;String Streams: The Oddball Type
;;;They are useful for debugging, 
;;;as well as for creating complex strings efficiently.
(defparameter foo (make-string-output-stream))
(princ "This will go into foo. " foo)
(princ "This will also go into foo. " foo)
(get-output-stream-string foo)
;;with-output-to-string
(with-output-to-string (*standard-output*)
  (princ "the sum of ")
  (princ 5)
  (princ " and ")
  (princ 2)
  (princ " is ")
  (princ (+ 2 5)))

```

正如你所见，我们之前用过这些流，来完成与外界资源的交互。

## 学习到这些命令

- output-steam-p/input-stream-p
- write-char/read-char
- with-open-file
- make-string-output-stream
- get-output-stream-string
- with-output-to-string
- close

clisp中特有：

- socket-server
- socket-accept
- socket-server-close
