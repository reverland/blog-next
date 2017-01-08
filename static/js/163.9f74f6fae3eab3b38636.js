webpackJsonp([163,194],{466:function(n,e){n.exports={rawContent:"\n\n# lisp中的dsl\n\n## 什么是dsl，为什么要dsl\n\n显然对于特定的领域，特定的程序是更好的解决方案，这个程序就是DSL[1].lisp非常方便来实现DSL。在land of lisp一书中进行了两种dsl，一种是生成xml或html，另一种是对我们之前[wizard游戏的](/lisp/2012/04/26/a-text-game-engine-written-by-lisp/)中的游戏命令进行dsl。\n\n## 生成svg文件\n\n关于svg文件不加以详述，读者可以参考[这里](http://zh.wikipedia.org/zh/SVG) 。这非常重要，只有理解了xml文件的格式才能继续我们的dsl。svg采用xml格式，顺便我们也说说生成网页的dsl。\n\n首先写一个辅助函数，\n\n```cl\n;Creating XML and HTML with the tag Macro\n;Writing a Macro Helper Function\n(defun print-tag (name alst closingp)\n  (princ #\\<)\n  (when closingp\n    (princ #\\/))\n  (princ (string-downcase name))\n  (mapc (lambda (att);使用mapc是为了副作用。它总返回第一个参数\n          (format t \" ~a=\\\"~a\\\"\" (string-downcase (car att)) (cdr att)))\n        alst)\n  (princ #\\>))\n```\n\n可以试试\n\n```cl\n(print-tag 'mytag '((color . blue) (height . 9)) nil)\n```\n\n然后创造生成标签的宏，宏能在以下几个方面提供不可替代的改善：\n\n- 标签总是成对的，如果想要嵌套标签，函数办不到。因为它要求我们在嵌套标签被求值之前和之后执行代码。这在宏中是可能的，函数却做不到。\n- 标签名和属性名通常不必通过动态方式改变。因此，把标签名通过单引号引用是多余的。换句话说，标签名应该默认被对待为想数据模式一样。\n- 不像标签名，属性值则应该动态生成。我们的宏将拥有这么一个语法去把属性值放到代码模式，让我们可以执行lisp代码去生成这些值。\n\n总之我们想让我们的宏看上去这样：\n\n```cl\n(tag mytag (color 'blue height (+ 4 5)))\n<mytag color=\"BLUE\" height=\"9\"><mytag>\n```\n\n我们这么做：\n\n```cl\n(defmacro tag (name atts &body body)\n  `(progn (print-tag ',name\n                     (list ,@(mapcar (lambda (x)\n                                       `(cons ',(car x) ,(cdr x)))\n                                     (pairs atts)))\n                     nil)\n          ,@body\n          (print-tag ',name nil t)))\n```\n\n很好的实现了以上要求，可以展开看看：\n\n```cl\n(macroexpand '(tag mytag (color 'blue height (+ 4 5))))\n```\n\n可以看看如何实现嵌套的：\n\n```cl\n(tag mytag (color 'blue size 'big)\n  (tag first_inner_tag ())\n  (tag second_inner_tag ()))\n```\n\n我们还可以用来生成html\n\n```cl\n(tag html ();比之前我们生成html的版本好看多了……\n  (tag body ()\n    (princ \"Hello World!\")))\n```\n\nhtml的标签是特定的，我们还能为特定的html标签编写宏：\n\n```cl\n(defmacro html (&body body)\n  `(tag html ()\n     ,@body))\n(defmacro body (&body body)\n  `(tag body ()\n     ,@body))\n(html (body (princ \"Hi boys\")))\n```\n\n好了，不跑题了，开始写生成svg的宏\n\n```cl\n;Creating SVG-Specific Macros and Functions \n(defmacro svg (&body body)\n  `(tag svg (xmlns \"http://www.w3.org/2000/svg\";声明标准在哪里\n             \"xmlns:xlink\" \"http://www.w3.org/1999/xlink\");链接\n        ,@body))\n```\n\n写一个函数专门加深色彩，方便我们绘图\n\n```cl\n(defun brightness (col amt)\n  (mapcar (lambda (x)\n            (min 255 (max 0 (+ x amt))))\n          col))\n(brightness '(255 0 0) -100)\n```\n\n使用一个svg样式函数生成颜色属性，边比内部颜色深.注意～{和～}可以起遍历的作用。\n\n```cl\n(defun svg-style (color)\n  (format nil\n          \"~{fill:rgb(~a,~a,~a);stroke:rgb(~a,~a,~a)~}\"\n          (append color;边界比内部颜色更深\n                  (brightness color -100))))\n```\n\n于是得到生成圆的一个函数\n\n```cl\n(defun circle (center radius color)\n  (tag circle (cx (car center)\n                  cy (cdr center)\n                  r radius\n                  style (svg-style color))))\n```\n\n最后可以简单的得到svg文件\n\n```cl\n(svg (circle '(50 .50) 50 '(255 0 0))\n     (circle '(100 . 100) 50 '(0 0 255)))\n```\n\n还可以写些更复杂的svg例子，比如一个多边形\n\n```cl\n;Building a More Complicated SVG Example\n(defun polygon (points color)\n  (tag polygon (points (format nil\n                               \"~{~a,~a ~}\";~{允许我们迭代\n                               (mapcan (lambda (tp)\n                                         (list (car tp) (cdr tp)));mapcan是有append的mapcar\n                                       points))\n                       style (svg-style color))))\n```\n\n写个random-walk函数，我想读者应该知道是干什么的\n\n```cl\n(defun random-walk (value length)\n  (unless (zerop length)\n    (cons value\n          (random-walk (if (zerop (random 2))\n                         (1- value)\n                         (1+ value))\n                       (1- length)))))\n(random-walk 100 10);测试\n```\n\n写进一个文件\n\n```cl\n(with-open-file (*standard-output* \"random_walk.svg\"\n                                   :direction :output\n                                   :if-exists :supersede)\n  (svg (loop repeat 10\n             do (polygon (append '((0 . 200))\n                                 (loop for x;又是这种风格，sbcl识别不了啊\n                                       for y in (random-walk 100 400)\n                                       collect (cons x y))\n                                 '((400 . 200)))\n                         (loop repeat 3\n                               collect (random 256))))))\n```\n\n用你的浏览器打开random_walk.svg看看吧，生成大概这样的图像:\n\"random_walk\":/images/random_walk.svg\n\n## 对先前的游戏进行dsl\n\n首先别忘了加载那个游戏\n\n```cl\n;Creating Custom Game Commands for Wizard's Adventure Game\n(load \"wizards_game\")\n```\n\n添加两个命令，一个把链条和篮子焊接在一起，另一个用焊好的篮子从井里打水。\n\n```cl\n;Creating New Game Commands by Hand\n;A Command for Welding\n(defun have (object)\n  (member object (inventory)))\n(defparameter *chain-welded* nil)\n(defun weld (subject object)\n  (if (and (eq *location* 'attic)\n           (eq subject 'chain)\n           (eq obejct 'bucket)\n           (have 'chain)\n           (have 'bucket)\n           (not *chain-welded*))\n    (progn (setf *chain-welded* t)\n           '(the chain is now securely welded to the bucket.))\n    '(you cannot weld like that)))\n(weld 'chain 'bucket)\n;(game-repl)\n(pushnew 'weld *allowed-commands*);这很关键，不是吗？\n;A Command for Dunking\n(setf *bucket-filled* nil)\n\n(defun dunk (subject object)\n  (if (and (eq *location* 'garden)\n           (eq subject 'bucket)\n           (eq object 'well)\n           (have 'bucket)\n           *chain-welded*)\n    (progn (setf *bucket-filled* 't)\n           '(the bucket is now full of water))\n    '(you cannot dunk like that.)))\n(pushnew 'dunk *allowed-commands*)\n```\n\n发现没？这两种命令很相似，我们来dsl,重新用我们的宏来重新添加上两个命令，另为我们还添加了一个更复杂的命令splash，把水泼到巫师脸上……\n\n```cl\n;The game-action Macro\n(defmacro game-action (command subj obj place &body body)\n  (let1 subject (gensym) (let1 object (gensym) \n  `(progn (defun ,command (,subject ,object)\n            (if (and (eq *location* ',place)\n                     (eq ,subject ',subj)\n                     (eq ,object ',obj)\n                     (have ',subj))\n            ,@body \n            '(i cant ,command like that.)))\n  (pushnew ',command *allowed-commands*)))))\n;rewrite\n(defparameter *chain-welded* nil)\n(game-action weld chain bucket attic\n  (if (and (have 'bucket) (not *chain-welded*))\n    (progn (setf *chain-welded* 't)\n           '(the chain is now securely welded to the bucket.))\n    '(you do not have a bucket.)))\n(setf *bucket-filled* nil)\n(game-action dunk bucket well garden\n  (if *chain-welded*\n    (progn (setf *bucket-filled* 't)\n           '(the bucket is now full of water))\n    '(the water level is too low to reach.)))\n(game-action splash bucket wizard living-room\n  (cond ((not *bucket-filled*) '(the bucket has nothing in it.))\n        ((have 'frog) '(the wizard awakens and sees that you stole his frog.\n                            he is so upset he banishes you to the\n                            netherworlds- you lose! the end.))\n        (t '(the wizard awakens from his slumber and greets you warmly.\n                 he hands you the magic low-carb donut- you win! the end.))))\n```\n\n试试我们的新游戏，很棒不是？\n\n```cl\n(game-repl)\n```\n\n## 小结\n-  当你需要一些特定领域的古怪的程序，宏是很棒的方案。通过它们，你可以创建自己的dsl。\n- 通常，首先为宏写一个辅助函数，然后写宏来提供宏能提供的提升。这些提高通常关乎能更清晰更安全地语法来使用代码。\n- 你可以混合DSL和常规Lisp 程序。lisp程序可以更方便你调试。\n- DSL非常有用，当你需要写下非常特定代码——无论是生成网页，代码，或是画图，或是建立特殊的游戏命令的代码。\n\n<hr></hr>\n\n## 照例的废话\n\n寝室的室友在看dota比赛，不要这么激情好么，吵死了。晚上试着跑了将近一个小时步，感觉不错。\n\n[^1]: domian-specific language\n\n\n",metaData:{layout:"post",title:"传说中的DSL",excerpt:"Domain-Specific Languages in Common Lisp",category:"lisp",tags:["land-of-lisp"],disqus:!0}}}});