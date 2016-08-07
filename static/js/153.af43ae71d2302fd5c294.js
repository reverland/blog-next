webpackJsonp([153,170],{193:function(t,n){t.exports='\n\nlisp中有多种流，不同的流与不同的资源交互。这些流包括控制台流，文件流，socket流和字符串流。\n\n流的处理方式是popup和push.\n\n流可依据方向分为输入流和输出流。\n\nSocket流允许网络上的计算机程序进行通信。我们必须在通信的两端都打开socket并且在程序间建立连接。\n\n字符串流允许我们使用不需要连接外部资源来使用流的函数来调试，同时能帮我们用优美有效率的方法（with-open-to-string）来建立复杂字符串。但这个宏不符合函数式编程原则，争议很大。\n\n下面是使用stream的一些例子\n\n```cl\n;;在做图的那部分已经见识过了\n;;to see if we have a valid output stream\n(output-stream-p *standard-output*) \n;;write a chracter to stream\n(write-char #\\x *standard-output*)\n\n;;to see if we have a valid stream\n(input-stream-p *standard-input*)\n;;pop an item off the stream\n(read-char *standard-input*)\n;123\n;\\#1\n;;reading and printing can be used too\n;;;reading and writing with files\n(with-open-file (my-stream "data.txt" :direction :output)\n  (print "my data" my-stream))\n(with-open-file (my-stream "data.txt" :direction :input)\n  (read my-stream))\n;;;some more complicated examples using print and read\n(let ((animal-noises \'((dog . woof)\n                       (cat . meow))))\n  (with-open-file (my-stream "animal-noises.txt" :direction :output)\n    (print animal-noises my-stream)))\n(with-open-file (my-stream "animal-noises.txt" :direction :input)\n  (read my-stream))\n;;if exists\n(with-open-file (my-stream "data.txt" :direction :output :if-exists :error)\n  (print "my data" my-stream)) \n(with-open-file (my-stream "data.txt" :direction :output :if-exists :supersede)\n  (print "my data" my-stream))\n;;stream over a socket\n(defparameter my-socket (socket-server 4321)) ;ON THE SERVER\n(defparameter my-stream (socket-accept my-socket)) ;ON THE SERVER\n;;It\'s a bidirectional stream\n;;princ may cause strange things\n(print "Yo Server!" my-stream) ;ON THE CLIENT\n(read my-stream) ;ON THE SERVER\n(print "What up, Client!" my-stream) ;ON THE SERVER\n(read my-stream) ;ON THE CLIENT\n;;tidying up after ourselves\n(close my-stream) ;ON BOTH\n(socket-server-close my-socket) ;ON THE SERVER\n;;;String Streams: The Oddball Type\n;;;They are useful for debugging, \n;;;as well as for creating complex strings efficiently.\n(defparameter foo (make-string-output-stream))\n(princ "This will go into foo. " foo)\n(princ "This will also go into foo. " foo)\n(get-output-stream-string foo)\n;;with-output-to-string\n(with-output-to-string (*standard-output*)\n  (princ "the sum of ")\n  (princ 5)\n  (princ " and ")\n  (princ 2)\n  (princ " is ")\n  (princ (+ 2 5)))\n\n```\n\n正如你所见，我们之前用过这些流，来完成与外界资源的交互。\n\n## 学习到这些命令\n\n- output-steam-p/input-stream-p\n- write-char/read-char\n- with-open-file\n- make-string-output-stream\n- get-output-stream-string\n- with-output-to-string\n- close\n\nclisp中特有：\n\n- socket-server\n- socket-accept\n- socket-server-close\n'}});
//# sourceMappingURL=153.af43ae71d2302fd5c294.js.map