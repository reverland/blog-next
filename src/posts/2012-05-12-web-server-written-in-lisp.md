---
layout: post
title: "Lisp Web Server"
excerpt: "A very simple web server written in lisp"
category: lisp
tags: [land-of-lisp]
disqus: true
---


## 关于服务器

首先我们要知道服务器是怎么工作的。如下图(有没有很熟悉?)

![Alt 服务器工作原理][1]

浏览器负责接收和渲染服务器返回的信息，服务器解析浏览器发送的报文并返回正确的信息。两方通过socket来进行通信。

浏览器发给服务器的报文应该是这样的，这是我从firebug中复制的：

```bash
GET /greeting HTTP/1.1
Host: 127.0.0.1:8080
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate
DNT: 1
Connection: keep-alive
```

其中第一行中间是url，说到url，如果url是这样

```bash
/greeting?name=bob
```
？后面的称作参数

还有种叫作Post请求方法，该方法向指定资源提交数据进行处理请求（例如提交表单或者上传文件）。数据被包含在请求体中。POST请求可能会导致新的资源的建立和/或已有资源的修改。

如果是post request,应该像下面这样,最后一行也是参数。

```bash
POST /login.html HTTP/1.1
Host: www.mywebsite.com
User-Agent: Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.5)
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-us,en;q=0.5
Accept-Encoding: gzip,deflate
Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7
Keep-Alive: 300
Connection: keep-alive
Content-Length: 39

userid=foo&password=supersecretpassword
```

## 如何以lisp的方式处理

在common lisp中，我们可以通过socket stream来完成服务器和浏览器的通信，通过把http报文转换成alist形式存储在clisp webserver中，同时完成对浏览器相应信息的响应。

因为网络中有许多意料之外的例外错误，为了确保发生错误后程序继续运行，比如说让webserver出错后可以正确关闭socket。可以使用unwind-protect.

源码如下：

```cl
;;;;这是一个简单的lisp服务器示例
;;;Decoding the Values of Request Parameters
;;将c1和c2两个字符读为16进制数并返回对应ascii码符号
(defun http-char (c1 c2 &optional (default #\space))
  (let ((code (parse-integer
                (coerce (list c1 c2) 'string)
                :radix 16
                :junk-allowed t)))
    (if code
      (code-char code)
      default)))
;;分别讨论
;;%后为16进制数，转化为相应ascii码字符
;;+转化位空格
(defun decode-param (s)
  (labels ((f (lst)
             (when lst
               (case (car lst)
                 (#\% (cons (http-char (cadr lst) (caddr lst))
                            (f (cdddr lst))))
                 (#\+ (cons #\space (f (cdr lst))))
                 (otherwise (cons (car lst) (f (cdr lst))))))))
  (coerce (f (coerce s 'list)) 'string)))
;将字符串拆成列表处理再转成字符串
;可以用以下命令查看效果
;(decode-param "foo")
;(decode-param "foo%3F")
;(decode-param "foo+bar")
;;;Decoding Lists of Request Parameters
;;store these parameters as an alist
;;递归调用，将形如name=bob&age=25的东西变成
;;((name . "bob") (age . "25"))这样的alist
(defun parse-params (s)
  (let* ((i1 (position #\= s))
         (i2 (position #\& s)))
    (cond (i1 (cons (cons (intern (string-upcase (subseq s 0 i1))) 
                          (decode-param (subseq s (1+ i1) i2)))
                    (and i2 (parse-params (subseq s (1+ i2))))))
          ((equal s "") nil);?后两行经测试完全可以不要……
          (t s))));?
;;;Parsing the Request Header
;;从http报表头中抽取url，并把其余部分保存为alist
;;GET /this/is/url?name=bob&gender=female HTTP/1.1
(defun parse-url (s)
  (let* ((url (subseq s
                      (+ 2 (position #\space s))
                      (position #\space s :from-end t)))
         (x (position #\? url)))
    (if x
      (cons (subseq url 0 x) (parse-params (subseq url (1+ x))))
      ;注意+1所以要分情况讨论
      (cons url '()))))
;可以用以下看看效果
;(parse-url "GET /lolcats.html?name=bob&gender=female HTTP/1.1")
;;将http报表的body部分解析成alist形式
;;name: bob->(name . "bob")
(defun get-header (stream)
  (let* ((s (read-line stream))
         (h (let ((i (position #\: s)))
              (when i
                (cons (intern (string-upcase (subseq s 0 i)))
                      (subseq s (+ i 2)))))))
    (when h
      (cons h (get-header stream)))))
;可以用以下命令看效果
;(get-header (make-string-input-stream "foo: 1
;bar: abc, 123

;"))
;;;Parsing the Request Body
;;;解析post request中最后一行,填充进content-length长的字符串中
(defun get-content-params (stream header)
  (let ((length (cdr (assoc 'content-length header))))
    (when length
      (let ((content (make-string (parse-integer length))))
        (read-sequence content stream)
        (parse-params content)))))

;;;The serve function
(defun serve (request-handler)
  (let ((socket (socket-server 8080)))
    (unwind-protect;错误保护
      (loop (with-open-stream (stream (socket-accept socket))
              (let* ((url
                       (parse-url (read-line stream)))
                     ;读出stream中第一行并解析出url，留下剩下的行
                     (path
                       (car url))
                     (header (get-header stream))
                     ;将header解析
                     (params (append 
                               (cdr url)
                               (get-content-params stream header)))
                     ;将post request最后一行解析与url中内容一起放进
                     ;params里
                     (*standard-output* stream))
                (funcall request-handler path header params))))
      (socket-server-close socket))));关闭socket
;;;Building a Dynamic Website
(defun hello-request-handler (path header params)
  (if (equal path "greeting")
    (let ((name (assoc 'name params)))
      (if (not name)
        (princ "HTTP/1.1 200 OK

<!DOCTYPE html>
<html>
<body>
<form>What is your name?<input name='name' />
</form>
</body>
</html>")
(format t "HTTP/1.1 200 OK

<!DOCTYPE html>
<html><head></head><body>Nice to meet you, ~a!</body></html>"
(cdr name))))
(princ "Sorry... I don't know that page.")))
```

## 学到的命令

- parse-integer
- code-char
- position
- subseq
- intern
- make-string
- read-sequence
- with-open-stream
- unwind-protect
- read-line

## 写在最后

其实这个webserver还是有很多疑惑的。

首先，实际操作中我在firebugs中并没有看到Post request，<strike>邮件组中热心人说可以用telnet来查看交互信息但我不会。所以对content-length的处理就感觉挺蹊跷（liutos同学似乎也这样认为）。可能通信时为了准确性都要验证吧。</strike>

其二是照书上源码和网上提供的源码返回给浏览器的是plain text而非解析为html，经参照服务器返回信息添加上

```bash
HTTP/1.1 200 OK
```

同时保证html5标准，不要漏掉一大堆head、body、html标签。

最后还有对parse-params的处理，为什么要分三种情况处理?我把后两种去掉后也能正常运行,还是说三种情况容错性好？<strike>我不明白，这个问题留待高人吧。</strike>

edit:第二种情况处理末尾，虽然对commonlisp来说没有指定输入nil的情况也会输出nil，秉持着递归时考虑所有情况的lisper们还是会写出来。另外最后一种情况处理错误情况，以防出现中断.

如果webserver不能正常工作，可以用telnet来测试。

```bash
telnet 127.0.0.1 8080
```

最后对Purity和liuto的解惑与帮助致以诚挚谢意。

[1]: /images/server.dot.png

