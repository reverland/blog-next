webpackJsonp([63,194],{566:function(n,t){n.exports={rawContent:"\n\n最终效果可以看这里：\n\n[来自asciinema的终端录像](http://ascii.io/a/12843)\n\n## 缘起\n\n自从降频之后，电脑特别卡……\n\n降频是因为总是自动关机\n\n自动关机据几个月观察是因为cpu过热\n\ncpu过热猜测是因为散热有问题了\n\n散热有问题猜测是该清灰换硅胶了\n\n但三星……非常麻烦，自从去年毕业自己把本拆了一遍后就再懒得拆机了。\n\n于是，想听歌时懒得打开vlc界面，就用命令行版本的cvlc来播放\n\n可是……没有歌词？\n\n某天想干脆自己做个支持lrc的终端播放器算了。\n\n作为一个脚本小子，我只习惯python……\n\n## 说干就干\n\n谷歌搜寻了下：\n\n- python如何播放mp3音乐\n- lrc文件的格式，考虑下如何在终端打印歌词\n- vlc有没有python绑定\n\n于是，有了以下版本，仅仅100行的多彩歌词显示终端播放器(使用`pygame`来播放音乐)：\n\n```python\n#!/usr/bin/env python\n# -*- coding:utf-8 -*-\n\nfrom pygame import mixer\nfrom mutagen.mp3 import MP3\nimport re\nimport time\nimport sys\nimport random\n\nf_mp3 = sys.argv[1]\nf_lrc = sys.argv[2]\n\n\ndef lrc2dict(lrc):\n    lrc_dict = {}\n    remove = lambda x: x.strip('[|]')\n    for line in lrc.split('\\n'):\n        time_stamps = re.findall(r'\\[[^\\]]+\\]', line)\n        if time_stamps:\n            # 截取歌词\n            lyric = line\n            for tplus in time_stamps:\n                lyric = lyric.replace(tplus, '')\n            # 解析时间\n            # tplus: [02:31.79]\n            # t 02:31.79\n            for tplus in time_stamps:\n                t = remove(tplus)\n                tag_flag = t.split(':')[0]\n                # 跳过: [ar: 逃跑计划]\n                if not tag_flag.isdigit():\n                    continue\n                time_lrc = int(tag_flag) * 60000\n                time_lrc += int(t.split(':')[1].split('.')[0]) * 1000\n                # ms也许没有\n                try:\n                    time_lrc += int(t.split('.')[1])\n                except:\n                    pass\n                # 截取到0.1s精度,降低cpu占用\n                time_lrc = time_lrc / 100 * 100\n                lrc_dict[time_lrc] = lyric\n    return lrc_dict\n\n\ndef print_lrc(mixer, lrc_d, color, wholetime):\n    mixer.music.play()\n    # 防止开头歌词来不及播放\n    mixer.music.pause()\n    time.sleep(0.001)\n    mixer.music.play()\n    while 1:\n        # 截取到0.1s精度,降低cpu占用\n        t = mixer.music.get_pos() / 100 * 100\n        sys.stdout.write('[' +\n                         time.strftime(\"%M:%S\", time.localtime(t / 1000)) +\n                         '/' +\n                         time.strftime(\"%M:%S\",\n                                       time.localtime(wholetime)) +\n                         '] ')\n        if t in lrc_d:\n            sys.stdout.write(color + lrc_d[t] + '\\033[0m')\n            sys.stdout.flush()\n            # 向后清除\n            sys.stdout.write(\"\\033[K\")\n        else:\n            sys.stdout.flush()\n            # 向后清除\n            # sys.stdout.write(\"\\033[K\")\n        sys.stdout.write('\\r')\n        # 播放停止时退出\n        if t < 0:\n            sys.exit(0)\n        # 0.05s循环\n        time.sleep(0.05)\n\nwith open(f_lrc) as f:\n    lrc = f.read()\n\nlrc_d = lrc2dict(lrc)\n\nmixer.init()\nmixer.music.load(f_mp3)\n\ntry:\n    wholetime = MP3(f_mp3).info.length\nexcept:\n    wholetime = 0\n\ncolors = [\n    '\\x1B[31m',  # 红色\n    '\\x1B[32m',  # 绿色\n    '\\x1B[33m',  # 黄色\n    '\\x1B[34m',  # 蓝色\n    '\\x1B[35m',  # 紫色\n    '\\x1B[36m',  # 青色\n    '\\x1B[37m'  # 灰白\n]\ncolor = random.choice(colors)\nprint_lrc(mixer, lrc_d, color, wholetime)\n```\n\n那个不断循环查看播放进度打印对应歌词的实现真够丧心病狂的……精确到0.1s算了。\n\n    Be aware that MP3 support is limited. On some systems an unsupported format can crash the program, e.g. Debian Linux. Consider using OGG instead.\n\n开始在pygame的[文档](http://www.pygame.org/docs/ref/music.html)中看到这句话还没在意后来，播放某个叫`in my life`的mp3时发现完全不对劲……而且没有获取音频长度的功能[^1]\n\n后来想想，还是用vlc的py绑定吧。\n\nvlc的py绑定相当赞：\n\n完整覆盖libvlc功能，纯python，支持各个vlc版本和完整的文档。[^2]\n\n但开始我以为pip可以直接下载……后来发现pip搜索到的是macos独有的vlc python wrapper……和这个绑定是两码事……真给跪了……\n\n自行下载[vlc.py](http://git.videolan.org/?p=vlc/bindings/python.git;a=tree;f=generated;b=HEAD)到当前目录或者扔到python搜索路径。\n\n```python\n#!/usr/bin/env python\n# -*- coding:utf-8 -*-\n\nimport vlc\nimport re\nimport time\nimport sys\nimport random\n\nf_mp3 = sys.argv[1]\nf_lrc = sys.argv[2]\n\n\ndef lrc2dict(lrc):\n    lrc_dict = {}\n    remove = lambda x: x.strip('[|]')\n    for line in lrc.split('\\n'):\n        time_stamps = re.findall(r'\\[[^\\]]+\\]', line)\n        if time_stamps:\n            # 截取歌词\n            lyric = line\n            for tplus in time_stamps:\n                lyric = lyric.replace(tplus, '')\n            # 解析时间\n            # tplus: [02:31.79]\n            # t 02:31.79\n            for tplus in time_stamps:\n                t = remove(tplus)\n                tag_flag = t.split(':')[0]\n                # 跳过: [ar: 逃跑计划]\n                if not tag_flag.isdigit():\n                    continue\n                time_lrc = int(tag_flag) * 60000\n                time_lrc += int(t.split(':')[1].split('.')[0]) * 1000\n                # ms也许没有\n                try:\n                    time_lrc += int(t.split('.')[1])\n                except:\n                    pass\n                # 截取到0.1s精度,降低cpu占用\n                time_lrc = time_lrc / 1000 * 1000\n                lrc_dict[time_lrc] = lyric\n    return lrc_dict\n\n\ndef print_lrc(player, lrc_d, color):\n    player.play()\n    player.pause()\n    # 防止无法获取整个音频时长\n    # 音频时长必须加载才能读取\n    time.sleep(0.1)\n    player.play()\n    wholetime = mediaObject.get_duration() / 1000 * 1000\n    while 1:\n        # 截取到0.1s精度,降低cpu占用, notwork fine for vlc\n        # FIXME: get_time NOT WORK WELL, 只能精确到0.3s\n        # t = player.get_position() * wholetime\n        t = player.get_time() / 1000 * 1000\n        # sys.stdout.write(str(t) + '\\r')\n        sys.stdout.write('[' +\n                         time.strftime(\"%M:%S\", time.localtime(t / 1000)) +\n                         '/' +\n                         time.strftime(\"%M:%S\",\n                                       time.localtime(wholetime / 1000)) +\n                         '] ')\n        if t not in lrc_d:\n            sys.stdout.flush()\n            # 向后清除\n            # sys.stdout.write(\"\\033[K\")\n        else:\n            sys.stdout.write(color + lrc_d[t] + '\\033[0m')\n            sys.stdout.flush()\n            # 向后清除\n            sys.stdout.write(\"\\033[K\")\n        sys.stdout.write('\\r')\n        # 播放停止时退出\n        if t == wholetime:\n            sys.exit(0)\n        # 0.05s循环\n        time.sleep(0.05)\n\nwith open(f_lrc) as f:\n    lrc = f.read()\n\nlrc_d = lrc2dict(lrc)\n\nvlcInstance = vlc.Instance()\nplayer = vlcInstance.media_player_new()\nmediaObject = vlcInstance.media_new(f_mp3)\nplayer.set_media(mediaObject)\n\ncolors = [\n    '\\x1B[31m',  # 红色\n    '\\x1B[32m',  # 绿色\n    '\\x1B[33m',  # 黄色\n    '\\x1B[34m',  # 蓝色\n    '\\x1B[35m',  # 紫色\n    '\\x1B[36m',  # 青色\n    '\\x1B[37m'  # 灰白\n]\ncolor = random.choice(colors)\nprint_lrc(player, lrc_d, color)\n```\n\n奇葩的还是那个丧心病狂的循环，查询播放进度最短间隔只有0.3s。只好把lrc歌词显示精度降到1s了\n\n反正对我是能用了。\n\n也许有空可以让它支持播放列表的，用vlc完全不是问题。\n\n嗯，完工。我擦嘞我竟然一天写了俩！\n\n## FootNotes\n\n[^1]: [Find the Length of a Song with Pygame](http://stackoverflow.com/questions/6936393/find-the-length-of-a-song-with-pygame)\n[^2]: [Python bindings](https://wiki.videolan.org/Python_bindings)\n\n",metaData:{layout:"post",title:"支持LRC歌词的终端播放器",excerpt:"一个简明python实现",category:"python",tags:["python"],disqus:!0}}}});