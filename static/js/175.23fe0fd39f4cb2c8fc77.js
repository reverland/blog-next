webpackJsonp([175,192],{447:function(n,e){n.exports={rawContent:'\n\n## 关于服务器\n\n首先我们要知道服务器是怎么工作的。如下图(有没有很熟悉?)\n\n![Alt 服务器工作原理][1]\n\n浏览器负责接收和渲染服务器返回的信息，服务器解析浏览器发送的报文并返回正确的信息。两方通过socket来进行通信。\n\n浏览器发给服务器的报文应该是这样的，这是我从firebug中复制的：\n\n```bash\nGET /greeting HTTP/1.1\nHost: 127.0.0.1:8080\nUser-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3\nAccept-Encoding: gzip, deflate\nDNT: 1\nConnection: keep-alive\n```\n\n其中第一行中间是url，说到url，如果url是这样\n\n```bash\n/greeting?name=bob\n```\n？后面的称作参数\n\n还有种叫作Post请求方法，该方法向指定资源提交数据进行处理请求（例如提交表单或者上传文件）。数据被包含在请求体中。POST请求可能会导致新的资源的建立和/或已有资源的修改。\n\n如果是post request,应该像下面这样,最后一行也是参数。\n\n```bash\nPOST /login.html HTTP/1.1\nHost: www.mywebsite.com\nUser-Agent: Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.5)\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\nAccept-Language: en-us,en;q=0.5\nAccept-Encoding: gzip,deflate\nAccept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7\nKeep-Alive: 300\nConnection: keep-alive\nContent-Length: 39\n\nuserid=foo&password=supersecretpassword\n```\n\n## 如何以lisp的方式处理\n\n在common lisp中，我们可以通过socket stream来完成服务器和浏览器的通信，通过把http报文转换成alist形式存储在clisp webserver中，同时完成对浏览器相应信息的响应。\n\n因为网络中有许多意料之外的例外错误，为了确保发生错误后程序继续运行，比如说让webserver出错后可以正确关闭socket。可以使用unwind-protect.\n\n源码如下：\n\n```cl\n;;;;这是一个简单的lisp服务器示例\n;;;Decoding the Values of Request Parameters\n;;将c1和c2两个字符读为16进制数并返回对应ascii码符号\n(defun http-char (c1 c2 &optional (default #\\space))\n  (let ((code (parse-integer\n                (coerce (list c1 c2) \'string)\n                :radix 16\n                :junk-allowed t)))\n    (if code\n      (code-char code)\n      default)))\n;;分别讨论\n;;%后为16进制数，转化为相应ascii码字符\n;;+转化位空格\n(defun decode-param (s)\n  (labels ((f (lst)\n             (when lst\n               (case (car lst)\n                 (#\\% (cons (http-char (cadr lst) (caddr lst))\n                            (f (cdddr lst))))\n                 (#\\+ (cons #\\space (f (cdr lst))))\n                 (otherwise (cons (car lst) (f (cdr lst))))))))\n  (coerce (f (coerce s \'list)) \'string)))\n;将字符串拆成列表处理再转成字符串\n;可以用以下命令查看效果\n;(decode-param "foo")\n;(decode-param "foo%3F")\n;(decode-param "foo+bar")\n;;;Decoding Lists of Request Parameters\n;;store these parameters as an alist\n;;递归调用，将形如name=bob&age=25的东西变成\n;;((name . "bob") (age . "25"))这样的alist\n(defun parse-params (s)\n  (let* ((i1 (position #\\= s))\n         (i2 (position #\\& s)))\n    (cond (i1 (cons (cons (intern (string-upcase (subseq s 0 i1))) \n                          (decode-param (subseq s (1+ i1) i2)))\n                    (and i2 (parse-params (subseq s (1+ i2))))))\n          ((equal s "") nil);?后两行经测试完全可以不要……\n          (t s))));?\n;;;Parsing the Request Header\n;;从http报表头中抽取url，并把其余部分保存为alist\n;;GET /this/is/url?name=bob&gender=female HTTP/1.1\n(defun parse-url (s)\n  (let* ((url (subseq s\n                      (+ 2 (position #\\space s))\n                      (position #\\space s :from-end t)))\n         (x (position #\\? url)))\n    (if x\n      (cons (subseq url 0 x) (parse-params (subseq url (1+ x))))\n      ;注意+1所以要分情况讨论\n      (cons url \'()))))\n;可以用以下看看效果\n;(parse-url "GET /lolcats.html?name=bob&gender=female HTTP/1.1")\n;;将http报表的body部分解析成alist形式\n;;name: bob->(name . "bob")\n(defun get-header (stream)\n  (let* ((s (read-line stream))\n         (h (let ((i (position #\\: s)))\n              (when i\n                (cons (intern (string-upcase (subseq s 0 i)))\n                      (subseq s (+ i 2)))))))\n    (when h\n      (cons h (get-header stream)))))\n;可以用以下命令看效果\n;(get-header (make-string-input-stream "foo: 1\n;bar: abc, 123\n\n;"))\n;;;Parsing the Request Body\n;;;解析post request中最后一行,填充进content-length长的字符串中\n(defun get-content-params (stream header)\n  (let ((length (cdr (assoc \'content-length header))))\n    (when length\n      (let ((content (make-string (parse-integer length))))\n        (read-sequence content stream)\n        (parse-params content)))))\n\n;;;The serve function\n(defun serve (request-handler)\n  (let ((socket (socket-server 8080)))\n    (unwind-protect;错误保护\n      (loop (with-open-stream (stream (socket-accept socket))\n              (let* ((url\n                       (parse-url (read-line stream)))\n                     ;读出stream中第一行并解析出url，留下剩下的行\n                     (path\n                       (car url))\n                     (header (get-header stream))\n                     ;将header解析\n                     (params (append \n                               (cdr url)\n                               (get-content-params stream header)))\n                     ;将post request最后一行解析与url中内容一起放进\n                     ;params里\n                     (*standard-output* stream))\n                (funcall request-handler path header params))))\n      (socket-server-close socket))));关闭socket\n;;;Building a Dynamic Website\n(defun hello-request-handler (path header params)\n  (if (equal path "greeting")\n    (let ((name (assoc \'name params)))\n      (if (not name)\n        (princ "HTTP/1.1 200 OK\n\n<!DOCTYPE html>\n<html>\n<body>\n<form>What is your name?<input name=\'name\' />\n</form>\n</body>\n</html>")\n(format t "HTTP/1.1 200 OK\n\n<!DOCTYPE html>\n<html><head></head><body>Nice to meet you, ~a!</body></html>"\n(cdr name))))\n(princ "Sorry... I don\'t know that page.")))\n```\n\n## 学到的命令\n\n- parse-integer\n- code-char\n- position\n- subseq\n- intern\n- make-string\n- read-sequence\n- with-open-stream\n- unwind-protect\n- read-line\n\n## 写在最后\n\n其实这个webserver还是有很多疑惑的。\n\n首先，实际操作中我在firebugs中并没有看到Post request，<strike>邮件组中热心人说可以用telnet来查看交互信息但我不会。所以对content-length的处理就感觉挺蹊跷（liutos同学似乎也这样认为）。可能通信时为了准确性都要验证吧。</strike>\n\n其二是照书上源码和网上提供的源码返回给浏览器的是plain text而非解析为html，经参照服务器返回信息添加上\n\n```bash\nHTTP/1.1 200 OK\n```\n\n同时保证html5标准，不要漏掉一大堆head、body、html标签。\n\n最后还有对parse-params的处理，为什么要分三种情况处理?我把后两种去掉后也能正常运行,还是说三种情况容错性好？<strike>我不明白，这个问题留待高人吧。</strike>\n\nedit:第二种情况处理末尾，虽然对commonlisp来说没有指定输入nil的情况也会输出nil，秉持着递归时考虑所有情况的lisper们还是会写出来。另外最后一种情况处理错误情况，以防出现中断.\n\n如果webserver不能正常工作，可以用telnet来测试。\n\n```bash\ntelnet 127.0.0.1 8080\n```\n\n最后对Purity和liuto的解惑与帮助致以诚挚谢意。\n\n[1]: /images/server.dot.png\n\n',metaData:{layout:"post",title:"Lisp Web Server",excerpt:"A very simple web server written in lisp",category:"lisp",tags:["land-of-lisp"],disqus:!0}}}});