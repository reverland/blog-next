webpackJsonp([17,192],{605:function(n,s){n.exports={rawContent:'\n> 流是Node中最好也最被误解的概念。\n> \n> –[dominictarr](https://github.com/dominictarr/event-stream)\n\n当我第一次接触NodeJS时，NodeJS有很不一样的感觉。异步、流、神奇的Javascript等等等等，花了将近几个月时间才渐渐理解其中很多概念。流就是其中一个开始很难以理解也很让人好奇的东西，而流在NodeJS中又是无处不在的。\n\n后来，抱着好奇心翻看流的文档、翻看实现的代码，搜索网络上的文章，调了调流的代码看看它怎么运作的，看看别人做的实验。\n\n感觉：\n\n1.  流是个在发展的模式。\n2.  状态管理和反压控制流速细节非常麻烦。\n\n本文是一堆笔记堆砌而成，也算个资料汇编吧。\n\n## 模型\n\n添油加醋意译自[Streams Living Standard](https://streams.spec.whatwg.org/#model)\n\n> 程序皆模型。这些模型脱胎于现实或精神过程，于头脑中孕育。这些过程，源于人类经验和思考，数量庞大，结构复杂，从来都只被部分理解。\n> \n> –[Structure and Interpretation of Computer Programs(second edition), Foreword](https://mitpress.mit.edu/sicp/full-text/book/book-Z-H-5.html#%_chap_Temp_2)\n\n程序是我们心智的模型，是我们对世界的认识。\n\n异步非阻塞IO是、观察者模式、单例是，所有计算机科学中天花乱坠的东西概莫能外。\n\nNodeJS中看到的流也是。大道筑于流：其生灭变换于无穷之时间，不困于有限之空间。\n\n### 数据块(Chunk)\n\n数据块： 每次读入或写入的一段数据，可以是任何类型。\n\n### 读取流(Readable Streams)\n\n读取流: 代表数据源的模型，数据的来源。  \n潜在资源(underlying source)：读取流所封装的底层I/O源  \n推送源(push sources): 无论如何都在将数据推出的源。也许提供了暂停和恢复的功能。  \n拉取源(pull sources): 需要有消费数据的对象从他们中请求数据的源。  \n队列(queue): 潜在资源将数据块推入流内部队列，这些数据块可以通过流的公共接口一次一个读出。  \n消费者(Consumer): 使用读取流的公共接口从其读取数据的程序。  \n取消(cancel): 消费者能够取消读取流。当其不再对流中数据有兴趣，立即关闭流，放弃任何队列中的数据块，执行任何潜在资源的取消机制。  \n分流(tee): 消费者能够复制读取流。锁定流使其不再直接可用，创建两个新的能独立消费的分支(branches)。\n\n### 写入流(Writable Streams)\n\n写入流： 代表数据的目的地，数据的流向处。\n\n潜在汇入(underlying sink)： 写入流所封装的底层I/O汇入点。写入流通过将之后的写入缓存到队列中，一次传递一个给潜在汇入，来抽象底层汇入的复杂实现。数据块被一次一个地通过写入流的公共接口传递给潜在汇入。\n\n供给者(producer): 通过使用写入流的公共接口将数据写入的代码为供给者。\n\n终止(abort): 供给者有能力终止写入流。如果供给者认为有错误，任何之后的写入都应该被禁止，可以将写入流转换到错误状态而无需潜在汇入的信号。\n\n### 转换流(Transform Streams)\n\n转换流包含一对流：一个写入流，一个读取流。数据写入写入流，处理转换后，将可以从读取流读取新数据。\n\n### 管道(Pipe)链(Chains)和反压(Backpressure)\n\n管道: 流一个接一个好像管道一样连接起来，比如一个读取流连接上写入流。这些流可以一个接一个连接起来。\n\n管道链： 一系列像管道一样连接的流成为管道链。\n\n初始源(original source): 是链中第一个读取流所代表的潜在资源。\n\n终点汇入(ultimate sink): 是链中最后一个写入流代表的潜在资源。\n\n反压: 一旦管道链建立起来，就可以传播流速信号。如果任何链中环节还不能接受数据块，就将该信号反向传回初始源，告知其不要这么快生成数据。这种根据链中数据处理速度将信号反馈给初始源的过程叫做反压。\n\n如果分裂一个读取流，两个分支的反压信号将聚合，任何一个分支有反压信号将被传送给读取流的潜在资源。\n\n### 内部队列和队列策略\n\n读取流和写入流都维护一个内部队列(internal queues)。他们有相似的目的。在读取流中，内部队列缓存了潜在来源推入队列的数据。在写入流中，内部队列缓存了将要传递给潜在汇入还未来得及被其处理的数据。\n\n队列策略(queuing strategy)是一种决定流如何根据它的内部状态给出反压信号的策略。队列策略赋给每个数据块一个尺寸，比较队列中所有数据块总体尺寸和一个特殊的叫做水平标记(high water mark)的值做比较。结果之差，即水平标记减去数据块总尺寸，用来决定填入流队列中意向尺寸(desired size to fill the stream’s queue。\n\n流意向读取的尺寸 = 水平标记 - 队列中已有数据块总大小\n\n对读取流来说，一个潜在来源可以使用该意向作为反压信号，减慢数据块生成速度来保持意向读取尺寸大于等于零。\n\n对写入流来说，供给源可以类似避免写入速度过快。\n\n简单例子，如果每个数据块尺寸为1，水平标志为3，在流考虑应用反压之前流中队列最多有三个数据块。\n\n### 锁定(Locking)\n\n读取流读者(readable stream reader)是允许直接从读取流中读取数据块的对象。没有这个对象，消费者只能对读取流进行高级操作：等待流关闭或者出错，取消流，用管道将读取流连接上写入流。许多这些高级操作实际自身使用流读者。\n\n给定的流一次只能有一个读者。叫做流被锁定到读者(locked to the reader)，读者被成为激活的(active)。\n\n读者也有能力释放它的锁(release its read lock)，让其不再激活。其他读者可以自由获取这个锁。如果流因为潜在来源或这取消而关闭或出错，读者将自动释放锁。\n\n## Stream in NodeJS\n\n本章翻译整理自[Streams2 Node.js Streams2 Demystified. by Bryce Baril](https://brycebaril.github.io/streams2-presentation/)\n\nStream可以看作是一种数据处理惰性求值(lazy evaluation)。\n\n### 好处\n\n*   延迟处理缓冲的数据\n*   时间驱动非阻塞\n*   内存消耗低\n*   自动 back-pressure 处理\n*   突破 V8 堆内存限制\n*   NodeJS 核心结构\n\n### Classes\n\n五个类\n\n*   Readable: 读出\n*   Writable: 写入\n*   Duplex: 双向流\n*   Transform: 流变形\n*   Passthrough: 流间谍\n\n#### Readable实现\n\n1.  集成`stream.Readable`\n2.  实现`_read(size)`方法\n\nor\n\n简化Constructor\n\n##### _read(size)\n\n`size`是字节，可以忽略（尤其对 objectMode 的流）。\n\n`_read(size)`中必须调用`this.push(chunk)`把数据推入读取队列。只有数据消耗者出现的时候才被调用（read或者pipe）。\n\n##### readable options\n\n`highWaterMark`number:内部缓冲区读取的最大字节大小限制，默认为16kb  \n`encoding`String: 字符编码，默认为 null  \n`objectMode`Boolean: 使用 Javascript 对象代替 Buffer 或字符串\n\n##### 使用 Readable 流\n\n*   `readable.pipe(target)`\n*   `readable.read(size)`\n*   `readable.on("data", /*...*/)`\n\n#### Writable\n\n##### 实现 Writable\n\n1.  继承`stream.Writable`\n2.  实现`_write(chunk, encoding, callback)`方法\n\nor\n\n简化Constructor\n\n##### _write(chunk, encoding, callback)\n\n##### Writable Options\n\n*   `highWaterMark`number:\n*   `decodeStrings`Boolean:是否在传递给`_write()`之前将string decode到buffer\n\n##### 使用Writable\n\n*   `source.pipe(writable)`\n*   `writable.write(chunk[, encoding, callback])`\n\n如果write 返回false则需要监听`drain`事件\n\n#### Duplex\n\n双工\n\n##### 实现\n\n1.  继承`stream.Duplex`\n2.  实现`_read(size)`方法\n3.  实现`_write(chunk, encoding, callback)`方法\n\nor\n\n简化Constructor\n\n##### options\n\nReadable和Writable的超集\n\n##### 使用\n\n*   input.pipe(duplex)\n*   duplex.pipe(output)\n*   duplex.on(‘data’, /_…_/)\n*   duplex.write()\n*   duplex.read()\n\n#### Transform\n\n操作流中数据，特殊双工流\n\n##### 实现\n\n1.  继承`stream.Transform`\n2.  实现`_transform(chunk, encoding, callback)`方法\n3.  可选实现`_flush(callback)`方法\n\nor\n\n简化Constructor\n\n##### _transform(chunk, encoding, callback)方法\n\n*   调用`this.push(something)`传递给下一个消费者\n*   如果不push任何东西，将略过一个chunk\n*   必须在每次`_transform`被调用时调用一次`callback`\n\n##### _flush(callback)\n\n当流结束时，有一次清理和最后`this.push()`调用来清理任何缓冲或工作的机会。结束时调用`callback()`。\n\n##### transform options\n\n依然是读写流的超集\n\n##### 使用transform流\n\n所有读写流方法\n\n*   source.pipe(transform).pipe(drain)\n*   transform.on(‘data’, /_…_/)\n\n#### Passthrough\n\n大多passthrough流用来测试，是没有变幻的transform流\n\n### Buffering\n\nStreams 自动处理缓冲和 backpressure\n\n#### readable buffering\n\n当你调用`this.push(chunk)`时缓冲，知道流被读取\n\n#### 写缓冲\n\n写入时缓冲，流被读取或处理时排空\n\n#### stream.read(0)\n\n在可读流上调用`.read(0)`更新系统而不读取任何数据。一般不会用\n\n有时候你想要触发潜在读取流机制，而不处理任何数据\n\n如果内部缓冲区在最高吃水线(highWaterMark)之下，流当前并不被读。这时候调用`read(0)`将触发底层`_read`调用。\n\n#### stream.push(‘’)或者stream.push(null)\n\n推入一个0字节字符或者对象模式中推入null会结束流。会触发状态，将触发Readable Stream的readable事件。\n\n### 错误处理\n\nStream是EventEmitter。要么监听`error`事件，要么就让它们冒泡\n\n#### 传递错误\n\n当error发生时，将错误放在`_write`或`_transform`里callback的第一个参数来结束流和给出错误信号。\n\n## 历史\n\n然而Stream既不是凭空来的，也不是提前设计好的，是一步一步进化出来的并仍在不断进化。Isaac曾经这样说：\n\n> 贯穿整个Node的开发，我们都在逐渐迭代一个理想的基于事件的数据处理API。这就是你们所看到的渗透到Node核心模块和无数npm中模块的 Stream 接口。\n> \n> –[A New Streaming API for Node v0.10, Isaac Z. Schlueter, 2012-12-21](https://nodejs.org/en/blog/feature/streams2/)\n\n那么，NodeJS中的流是怎样进化的呢？\n\n### Stream 1\n\n最早的Stream是从http.js和net.js模块抽象出来，说明其源头正是因处理网络而生。参见[Add Stream Base class with stream.pipe, ry committed on 11 Oct 2010](https://github.com/nodejs/node/commit/bc695475b908ccf30e5016689328df37b678b870)\n\n这时候的Stream是朴素的基础类，仅仅从EventEmitter继承而来，有一个`pipe`方法，实现从src读取数据写入dest的功能。\n\n<figure class="highlight javascript">\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td class="gutter">\n\n<pre><span class="line">1</span>  \n<span class="line">2</span>  \n<span class="line">3</span>  \n<span class="line">4</span>  \n<span class="line">5</span>  \n<span class="line">6</span>  \n<span class="line">7</span>  \n<span class="line">8</span>  \n<span class="line">9</span>  \n<span class="line">10</span>  \n<span class="line">11</span>  \n<span class="line">12</span>  \n<span class="line">13</span>  \n<span class="line">14</span>  \n<span class="line">15</span>  \n<span class="line">16</span>  \n</pre>\n\n</td>\n\n<td class="code">\n\n<pre><span class="line"><span class="function"><span class="keyword">function</span> <span class="title">Stream</span> (<span class="params"></span>)</span> {</span>  \n <span class="line">events.EventEmitter.call(<span class="keyword">this</span>);</span>  \n<span class="line">}</span>  \n<span class="line">inherits(Stream, events.EventEmitter);</span>  \n<span class="line">exports.Stream = Stream;</span>  \n<span class="line"></span>  \n<span class="line">Stream.prototype.pipe = <span class="function"><span class="keyword">function</span> (<span class="params">dest, options</span>)</span> {</span>  \n <span class="line"><span class="keyword">var</span> source = <span class="keyword">this</span>;</span>  \n<span class="line"></span>  \n<span class="line">source.on(<span class="string">"data"</span>, <span class="function"><span class="keyword">function</span> (<span class="params">chunk</span>)</span> {</span>  \n <span class="line"><span class="keyword">if</span> (<span class="literal">false</span> === dest.write(chunk)) source.pause();</span>  \n<span class="line">});</span>  \n<span class="line"></span>  \n<span class="line">dest.on(<span class="string">"drain"</span>, <span class="function"><span class="keyword">function</span> (<span class="params"></span>)</span> {</span>  \n <span class="line"><span class="keyword">if</span> (source.readable) source.resume();</span>  \n<span class="line">});</span>  \n</pre>\n\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n</figure>\n\npipe实现了一种简单的流量管理。有数据时，就往dest写入。而dest.write如果返回false就表示dest无法及时处理数据，将source暂停(pause)。一旦dest的缓冲区为空，drain事件触发，如果src是可读的，就恢复(resume)src。看上去似乎很好。\n\n接下来，几经修修改改，增增减减，没有太大变化。\n\n这时的Stream有[四个特点](https://nodejs.org/en/blog/feature/streams2/)：\n\n*   `pause`是建议性质的，并不一定真能暂停\n*   `data`事件不管你准备没准备好都会发生\n*   没法处理特定数目的数据然后将剩下的数据交给其他部分处理\n*   实现流难到极点，需要顾及缓冲、暂停、恢复、数据事件、状态等等。缺少共享的类致使反复解决同样的问题，产生同样的错误和相似的bug。\n\n### Stream 2\n\n两年后，Node 0.10 发布，Stream 2 应运而生。参见[streams2: The new stream base classes , isaacs committed on 3 Oct 2012](https://github.com/nodejs/node/commit/420e07c5777bdb2e493147d296abfc102f725015)\n\n<figure class="highlight javascript">\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td class="gutter">\n\n<pre><span class="line">1</span>  \n<span class="line">2</span>  \n<span class="line">3</span>  \n<span class="line">4</span>  \n<span class="line">5</span>  \n<span class="line">6</span>  \n<span class="line">7</span>  \n<span class="line">8</span>  \n<span class="line">9</span>  \n<span class="line">10</span>  \n<span class="line">11</span>  \n<span class="line">12</span>  \n</pre>\n\n</td>\n\n<td class="code">\n\n<pre><span class="line">util.inherits(Stream, events.EventEmitter);</span>  \n<span class="line"><span class="built_in">module</span>.exports = Stream;</span>  \n<span class="line">Stream.Readable = <span class="built_in">require</span>(<span class="string">\'_stream_readable\'</span>);</span>  \n<span class="line">Stream.Writable = <span class="built_in">require</span>(<span class="string">\'_stream_writable\'</span>);</span>  \n<span class="line">Stream.Duplex = <span class="built_in">require</span>(<span class="string">\'_stream_duplex\'</span>);</span>  \n<span class="line">Stream.Transform = <span class="built_in">require</span>(<span class="string">\'_stream_transform\'</span>);</span>  \n<span class="line">Stream.PassThrough = <span class="built_in">require</span>(<span class="string">\'_stream_passthrough\'</span>);</span>  \n<span class="line"></span>  \n<span class="line"><span class="comment">// Backwards-compat with node 0.4.x</span></span>  \n<span class="line"><span class="comment">// Backwards-compat with node 0.4.x</span></span>  \n<span class="line">Stream.Stream = Stream;</span>  \n<span class="line">Stream.Stream = Stream;</span>  \n</pre>\n\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n</figure>\n\n提供了五种基本流类，还提供原始的Stream以兼容旧版。这几种基本类提供了强大的抽象，但也给nodejs的核心模块带来了巨大的复杂度。Stream一跃成为NodeJS核心模块中最复杂的部分之一。以至于社区内有很多人认为，应该将[这些模块分离维护](https://r.va.gg/2014/06/why-i-dont-use-nodes-core-stream-module.html)以维持NodeJS较小的稳定核心。\n\n但不管怎么说，托Stream 2的福，用户实现流简单很多。Stream 2的流API也着重解决Stream 1 的一些问题。将Push stream改成Pull stream。\n\n之后，Stream2全面更新NodeJS其他核心模块。在实践中增增减减。稳定成如下形式：\n\n当流的缓冲队列内有数据时会触发`readable`事件，流通过`read`读取潜在资源推入缓冲队列中的数据块。这样，就可以指定想要读取的数据大小。\n\n为了兼容，可以通过`data`事件继续使用Stream 1的api，当监听`data`事件时会取消流的暂停状态。\n\nstream2还有很多细节。NodeJS团队为了更优雅的流量控制和更高的效率，不断锤炼Stream 2的设计和实现。接口和设计频繁变化，lowWaterMark特性被移除，push和unshift被加入，_read()不再接受回调，read(0)频繁变化，实现自动扩展的highWaterMark、[添加ObjectMode](https://github.com/nodejs/node/commit/444bbd4fa7315423a6b55aba0e0c12ea6534b2cb)等等，同时其他使用stream的核心模块也渐渐使用新的stream类。\n\n比较重要的API倒不多，比如readable stream除了`stream.read()`。有当流想要拉取更多数据时调用的`stream._read`(实际上就是read调用的)。有操作缓冲队列的`stream.push`和`stream.unshift`。\n\n这时的stream，push和pull stream两种模式不能同时使用，`read()`时并不会触发相应的`data`事件。\n\n修修改改修修改改。\n\n2014年12月，贡献者因对NodeJS开发公司Joyent在NodeJS管理上的长期不满，社区分裂。15年1月，iojs发布。\n\n### Stream 3\n\n[Summary of changes from Node.js v0.10.35 to io.js v1.0.0](https://github.com/nodejs/node/blob/master/CHANGELOG.md#streams)里写道：这次流的变化没有从streams1倒streams2这么大：他们都是从现存的想法中提炼出来的，这些设计应该让人类更少意外，让计算机能更快处理。最终所有这些改变, 成为了stream3，但大部分改变将不会被流消费者和实现者察觉。\n\n也就是说，Streams 3是两者的结合，两者将更加一致与和谐。比如读取流不再只能从非flowing状态转移到flowing状态而不可逆，`read()`也将触发`data`事件。\n\nChangelog里[一副图完整描绘了Stream 3](https://cloud.githubusercontent.com/assets/37303/5728694/f9a3e300-9b20-11e4-9e14-a6938b3327f0.png)\n\n修修补补修修补补。\n\nstream的API仍然非常复杂，社区创造了through等来简化流的创建。终于，官方实现了[简化版的流构建(construction)](https://github.com/nodejs/node/commit/50daee7243a3f987e1a28d93c43f913471d6885a)\n\n<figure class="highlight javascript">\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td class="gutter">\n\n<pre><span class="line">1</span>  \n<span class="line">2</span>  \n</pre>\n\n</td>\n\n<td class="code">\n\n<pre><span class="line"><span class="keyword">if</span> (options && <span class="keyword">typeof</span> options.read === <span class="string">\'function\'</span>)</span>  \n <span class="line"><span class="keyword">this</span>._read = options.read;</span>  \n</pre>\n\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n</figure>\n\n就是上面这种黑魔法。。。\n\n顺便说到黑魔法，isaac实现的扩展highWaterMark[stream: Raise readable high water mark in powers of 2](https://github.com/nodejs/node/commit/9208c890582305218716a2bdadb7461ef24f5830) 。\n\n<figure class="highlight javascript">\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td class="gutter">\n\n<pre><span class="line">1</span>  \n<span class="line">2</span>  \n<span class="line">3</span>  \n<span class="line">4</span>  \n<span class="line">5</span>  \n<span class="line">6</span>  \n<span class="line">7</span>  \n<span class="line">8</span>  \n<span class="line">9</span>  \n<span class="line">10</span>  \n<span class="line">11</span>  \n</pre>\n\n</td>\n\n<td class="code">\n\n<pre><span class="line"><span class="function"><span class="keyword">function</span> <span class="title">roundUpToNextPowerOf2</span>(<span class="params">n</span>)</span> {</span>  \n <span class="line"><span class="keyword">if</span> (n >= MAX_HWM) {</span>  \n <span class="line">n = MAX_HWM;</span>  \n <span class="line">} <span class="keyword">else</span> {</span>  \n <span class="line"><span class="comment">// Get the next highest power of 2</span></span>  \n <span class="line">n--;</span>  \n <span class="line"><span class="keyword">for</span> (<span class="keyword">var</span> p = <span class="number">1</span>; p < <span class="number">32</span>; p <<= <span class="number">1</span>) n |= n >> p;</span>  \n <span class="line">n++;</span>  \n <span class="line">}</span>  \n <span class="line"><span class="keyword">return</span> n;</span>  \n<span class="line">}</span>  \n</pre>\n\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n</figure>\n\n2015年8月21日，[更新了这么一个微优化](https://github.com/nodejs/node/commit/1c6e014bfa)。。。第一眼看去我擦咧这是啥？！直觉似乎hackers delight里会有这种东西，[果然](https://en.wikipedia.org/wiki/Power_of_two#cite_note-8)。。。这也是神奇的算法。\n\n<figure class="highlight javascript">\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td class="gutter">\n\n<pre><span class="line">1</span>  \n<span class="line">2</span>  \n<span class="line">3</span>  \n<span class="line">4</span>  \n<span class="line">5</span>  \n<span class="line">6</span>  \n<span class="line">7</span>  \n<span class="line">8</span>  \n<span class="line">9</span>  \n<span class="line">10</span>  \n<span class="line">11</span>  \n<span class="line">12</span>  \n<span class="line">13</span>  \n<span class="line">14</span>  \n<span class="line">15</span>  \n</pre>\n\n</td>\n\n<td class="code">\n\n<pre><span class="line"><span class="function"><span class="keyword">function</span> <span class="title">computeNewHighWaterMark</span>(<span class="params">n</span>)</span> {</span>  \n <span class="line"><span class="keyword">if</span> (n >= MAX_HWM) {</span>  \n <span class="line">n = MAX_HWM;</span>  \n <span class="line">} <span class="keyword">else</span> {</span>  \n <span class="line"><span class="comment">// Get the next highest power of 2</span></span>  \n <span class="line">n--;</span>  \n <span class="line">n |= n >>> <span class="number">1</span>;</span>  \n <span class="line">n |= n >>> <span class="number">2</span>;</span>  \n <span class="line">n |= n >>> <span class="number">4</span>;</span>  \n <span class="line">n |= n >>> <span class="number">8</span>;</span>  \n <span class="line">n |= n >>> <span class="number">16</span>;</span>  \n <span class="line">n++;</span>  \n <span class="line">}</span>  \n <span class="line"><span class="keyword">return</span> n;</span>  \n<span class="line">}</span>  \n</pre>\n\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n</figure>\n\neventEmitter实现里关于函数参数也有些优化黑魔法，如果哪天写那个再说吧。\n\n之后stream的接口和实现趋于稳定，修修改改提升效率，更新文档，专注应用。\n\n## 代码\n\n参考[_stream_readable源码](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js)，我们看到为了处理各种历史遗留问题不一致的API、混乱的状态管理、同步异步代码一片混杂、古老冗余的javascript语法和各种黑魔法。。。\n\n不管怎样，来段代码follow一下程序流程好了，这篇文章告结。\n\n<figure class="highlight javascript">\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td class="gutter">\n\n<pre><span class="line">1</span>  \n<span class="line">2</span>  \n<span class="line">3</span>  \n<span class="line">4</span>  \n<span class="line">5</span>  \n<span class="line">6</span>  \n<span class="line">7</span>  \n<span class="line">8</span>  \n<span class="line">9</span>  \n<span class="line">10</span>  \n<span class="line">11</span>  \n<span class="line">12</span>  \n<span class="line">13</span>  \n<span class="line">14</span>  \n<span class="line">15</span>  \n<span class="line">16</span>  \n<span class="line">17</span>  \n<span class="line">18</span>  \n<span class="line">19</span>  \n<span class="line">20</span>  \n<span class="line">21</span>  \n<span class="line">22</span>  \n<span class="line">23</span>  \n</pre>\n\n</td>\n\n<td class="code">\n\n<pre><span class="line">┌─[reverland@reverland-R478-R429] - [~<span class="regexp">/tmp/</span>stream/stream-explore] - [<span class="number">2015</span>-<span class="number">12</span>-<span class="number">20</span> <span class="number">10</span>:<span class="number">18</span>:<span class="number">25</span>]</span>  \n<span class="line">└─[<span class="number">0</span>] <> cat read.js</span>   \n<span class="line"><span class="keyword">var</span> Readable = <span class="built_in">require</span>(<span class="string">\'stream\'</span>).Readable;</span>  \n<span class="line"><span class="keyword">var</span> inherits = <span class="built_in">require</span>(<span class="string">\'util\'</span>).inherits;</span>  \n<span class="line"></span>  \n<span class="line"><span class="keyword">var</span> EMIT;</span>  \n<span class="line"></span>  \n<span class="line"><span class="function"><span class="keyword">function</span> <span class="title">Source</span>(<span class="params">opts</span>)</span> {</span>  \n <span class="line">Readable.call(<span class="keyword">this</span>, opts);</span>  \n<span class="line">}</span>  \n<span class="line"></span>  \n<span class="line">inherits(Source, Readable);</span>  \n<span class="line"></span>  \n<span class="line">Source.prototype._read = <span class="function"><span class="keyword">function</span>(<span class="params">size</span>)</span> {</span>  \n <span class="line"><span class="keyword">if</span> (EMIT)</span>  \n <span class="line"><span class="keyword">this</span>.push(<span class="string">\'Mary has a little lamb\'</span>);</span>  \n <span class="line"><span class="keyword">else</span></span>  \n <span class="line"><span class="keyword">this</span>.push(<span class="literal">null</span>);</span>  \n<span class="line">}</span>  \n<span class="line"></span>  \n<span class="line"></span>  \n<span class="line"><span class="keyword">var</span> s = <span class="keyword">new</span> Source()</span>  \n<span class="line">s.read();</span>  \n</pre>\n\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n</figure>\n\ndebug的使用参见NodeJS文档，得到如下：\n\n<figure class="highlight bash">\n\n<table>\n\n<tbody>\n\n<tr>\n\n<td class="gutter">\n\n<pre><span class="line">1</span>  \n<span class="line">2</span>  \n<span class="line">3</span>  \n<span class="line">4</span>  \n<span class="line">5</span>  \n<span class="line">6</span>  \n<span class="line">7</span>  \n<span class="line">8</span>  \n<span class="line">9</span>  \n<span class="line">10</span>  \n<span class="line">11</span>  \n<span class="line">12</span>  \n<span class="line">13</span>  \n<span class="line">14</span>  \n</pre>\n\n</td>\n\n<td class="code">\n\n<pre><span class="line"></span>  \n<span class="line">STREAM <span class="number">5102</span>: <span class="built_in">read</span> undefined ...................................................................(<span class="number">1</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: need readable <span class="literal">false</span> ..............................................................(<span class="number">2</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: length less than watermark <span class="literal">true</span> ..................................................(<span class="number">3</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: <span class="keyword">do</span> <span class="built_in">read</span> ..........................................................................(<span class="number">4</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: emitReadable null ................................................................(<span class="number">5</span>)</span>  \n<span class="line"><span class="number">1</span> .............................................................................................(<span class="number">6</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: emit readable ....................................................................(<span class="number">7</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: flow null ........................................................................(<span class="number">8</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: maybeReadMore <span class="built_in">read</span> <span class="number">0</span> .............................................................(<span class="number">9</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: <span class="built_in">read</span> <span class="number">0</span> ...........................................................................(<span class="number">10</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: need readable <span class="literal">true</span> ...............................................................(<span class="number">11</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: length less than watermark <span class="literal">true</span> ..................................................(<span class="number">12</span>)</span>  \n<span class="line">STREAM <span class="number">5102</span>: <span class="keyword">do</span> <span class="built_in">read</span> ..........................................................................(<span class="number">13</span>)</span>  \n</pre>\n\n</td>\n\n</tr>\n\n</tbody>\n\n</table>\n\n</figure>\n\n我们看到`read()`\n\n*   [(1)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L251)read()函数被调用，undefined是参数\n*   [(2)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L305)needReadable状态还为false\n*   [(3)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L310)state.length为0， 因此缓冲区长度还小于highWaterMark, doRead标志变为 true\n*   [(4)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L320)由于doRead为true, 于是state.reading为true， state.sync为true，再state.length为0时， state.needReadable变成true。调用_read。将state.sync变回false\n\n*   [(5)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L99)进入我们的_read实现中，我们的_read调用push。而push调用[readableAddChunk](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L123)。在这个函数中，由于state.needReadable为true, 调用[emitReadable](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L157)。此时state.sync为true，把emitReadable_安排到下一次eventLoop中。于是出现(6).[这里](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L141)state.reading变为false，就是说push会中止读取状态。\n\n*   [(7)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L410)emitReadable_内\n*   [(8)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L740)state.flowing为null，显然，我们不是flowing模式。\n\n*   [(9)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L433)  \n    从[(5)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L160)继续执行。调用[maybeReadMore](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L422)，由于state.readingMore还是false,变为true，将maybeReadMore_放到nextTick.于是这里就开始read(0)\n\n*   [(10)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L251) read(0)中\n\n*   [(11)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L305)所以state.needReadable变成了true\n\n*   [(12)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L310)state.length - n比watermark少继续读\n*   [(13)](https://github.com/nodejs/node/blob/292218828eea50861680ac9276b1b764e7342134/lib/_stream_readable.js#L321)继续读。。。\n\nhave fun!\n\n## 参考文献\n\n关于NodeJS其中那个的流及其发展的资料\n\n*   [whats-new-io-js-beta-streams3](https://strongloop.com/strongblog/whats-new-io-js-beta-streams3/)\n*   [A New Streaming API for Node v0.10](https://nodejs.org/en/blog/feature/streams2/)\n*   [Stream Node.js v5.3.0 Manual & Documentation](https://nodejs.org/api/stream.html)\n*   [What are Node.js streams?](http://codewinds.com/blog/2013-07-25-streams-what-why.html)\n*   [Node.js ChangeLog](https://github.com/nodejs/node/blob/master/CHANGELOG.md)\n*   [the-strange-world-of-node-js-design-patterns](http://www.mariocasciaro.me/the-strange-world-of-node-js-design-patterns)\n*   [Node.js Stream Playground](http://nodestreams.com/)\n*   [Daddy, what’s a stream?](http://howtonode.org/streams-explained)\n*   [Why I don’t use Node’s core ‘stream’ module](https://r.va.gg/2014/06/why-i-dont-use-nodes-core-stream-module.html)\n*   [Streams Living Standard — Last Updated 28 December 2015](https://streams.spec.whatwg.org)\n*   [Stream-Viz](http://thlorenz.com/stream-viz/)\n*   [stream-handbook](https://github.com/substack/stream-handbook)\n*   [Functional Reactive Programming with the Power of Node.js Streams](https://blog.risingstack.com/functional-reactive-programming-with-the-power-of-nodejs-streams/)\n*   [event-stream](https://github.com/dominictarr/event-stream)  \n    FIXME:\n*   [Streams2 - Node.js Streams2 Demystified, by Bryce Baril](https://brycebaril.github.io/streams2-presentation/)\n\n非NodeJS关于流和backpressure，说明这是随着计算机实践发展应运而生的编程方式和需求。\n\n*   [Reactive Streams](http://www.reactive-streams.org/)\n*   [Basics and working with Flows - Akka Documentation](http://doc.akka.io/docs/akka-stream-and-http-experimental/1.0-RC2/java/stream-flows-and-basics.html)\n*   [visualizing-back-pressure-and-reactive-streams-akka-streams-statsd-grafana-and-influxdb](http://www.smartjava.org/content/visualizing-back-pressure-and-reactive-streams-akka-streams-statsd-grafana-and-influxdb)\n*   [Backpressure - ReactiveX/RxJava Wiki](https://github.com/ReactiveX/RxJava/wiki/Backpressure)\n',metaData:{layout:"post",title:"Stream in NodeJS",excerpt:"一篇有关NodeJS中流的概念的详细参考，历史、设计、应用等",category:"javascript",tags:["javascript","stream","nodejs"],disqus:!0}}}});