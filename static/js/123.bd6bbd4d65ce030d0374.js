webpackJsonp([123,192],{499:function(e,n){e.exports={rawContent:"\n\n# Yet Another PhotoMosaic Generator\n\nUpdate: Mon 25 Feb 2013 11:38:47 AM CST add classic style. More refer to [github](https://github.com/reverland/scripts/blob/master/python/yapmg.py)\n\n> Python是面向对象的？没有对象面向毛对象。\n> \n> ——Anonymous\n\nSeveral weeks ago, I saw a poster of presidential campaign for Obama, in which Obama's portrait was made up of many voter's photos. It really attracted me, somedays later, I want to make one myself.\n\nThe completed code host [here](http://github.com/reverland/scripts/blob/master/python/yapmg.py). It is much more functional than object-oriented...\n\n## Search the Internet\n\nFirst of all, I searched the Google to find out how others achieve it, then I found many interesting implement and post on it.Along with them, there are pretty demos around.One of the demo of [Foto-Mosaik-Edda](http://www.fmedda.com/en/mosaic/chaos) striked me.It declaims as follows in their site:\n\n> The Chaos Mosaic Picture is a new form of photo mosaic which can, at present, only be created by Foto-Mosaik-Edda.\n\n![Chaos Mosaic Picture](http://www.fmedda.com/sites/default/files/pic/mosaic_chaos.png)\n\nUhm...Foto-Mosaic-Edda is an open-source project that really impressive.But it was an C# project. Linux users don't like it however.I don't like `mono`.\n\nI searched other open-source implement on photomosaic. I get some simple programs only use gray photos, and some complex ones can make beautiful classic photomosaic(like metapixel, even chaos style which it calls collage style), But none has as beautiful demos as Foto-Mosaic-Edda.(metapixel really amazing, it is robust and quickly.)\n\nHowever, I saw many enthusiastic people write one themselves, it really looks interesting for me. I've used PIL for processing images when I tried to decode captchas several days ago, so I believe with the help of PIL, someone can achieve photomosaic simply.\n\nSo I just read the documentation of PIL, then start my hack.\n\n## Write My Own PhotoMosaic Generator\n\nIt's not hard, however, what you should do is clear and simple:\n\n- analyse the image to be made mosaic, get a dict in which position as key and color as value.\n- use a bunch of images to get a dict, in which image name as key and colors as value.\n- thumbnail bunches of images and paste it in the right position, so that the big image looks like it consists of many small one.\n\nI'd like to got the chaos style, so some other requirements:\n\n- frame and shadow for small images\n- random paste small images onto large one\n\nNow, let's go.\n\n### Frame, Shadow and Rotate\n\nfirst add frame, shadow to small images\n\n```python\ndef add_frame(image):\n    '''Add frame for image.'''\n    im = ImageOps.expand(image, border=int(0.01 * max(image.size)), fill=0xffffff)\n    return im\n\n\ndef drop_shadow(image, offset, border=0, shadow_color=0x444444):\n    \"\"\"Add shadows for image\"\"\"\n    # Caclulate size\n    fullWidth = image.size[0] + abs(offset[0]) + 2 * border\n    fullHeight = image.size[1] + abs(offset[1]) + 2 * border\n    # Create shadow, hardcode color\n    shadow = Image.new('RGBA', (fullWidth, fullHeight), (0, 0, 0))\n    # Place the shadow, with required offset\n    shadowLeft = border + max(offset[0], 0)  # if <0, push the rest of the image right\n    shadowTop = border + max(offset[1], 0)  # if <0, push the rest of the image down\n    shadow.paste(shadow_color, [shadowLeft, shadowTop, shadowLeft + image.size[0], shadowTop + image.size[1]])\n    shadow_mask = shadow.convert(\"L\")\n     # Paste the original image on top of the shadow\n    imgLeft = border - min(offset[0], 0)  # if the shadow offset was <0, push right\n    imgTop = border - min(offset[1], 0)  # if the shadow offset was <0, push down\n    shadow.putalpha(shadow_mask)\n    shadow.paste(image, (imgLeft, imgTop))\n    return shadow\n```\n\n\nThen a function to rotate images.\n\n```python\ndef rotate_image(image, degree):\n    '''Rotate images for specific degree. Expand to show all'''\n    if image.mode != 'RGBA':\n        image = image.convert('RGBA')\n    im = image.rotate(degree, expand=1)\n    return im\n```\n\n'RGBA' mode is to support transparency. What's matter here is that jpeg/jpg does not support transparency. So you can't get transparency shadows and rotate pictures if you just use jpg/jpeg images.So, write a function to process images with jpg/jpeg format, transpose it into png.\n\n```python\ndef process_image(filename, newname):\n    '''convert image to png to support transparency'''\n    if filename.split('.')[-1] != 'png':\n        im = Image.open(filename)\n        im.save(newname + '.png')\n        print \"processing image file %s\" % filename\n    return 1\n\n\ndef process_directory(path):\n    os.chdir(path)\n    count = 1\n    for filename in os.listdir(path):\n        ext = filename.split('.')[-1]\n        if ext == 'jpeg' or ext == 'jpg':\n            process_image(filename, str(count))\n            os.remove(filename)\n            count += 1\n    return 1\n```\n\nReally poor work... But it works for me: )\n\nWe have to thumnail bunches of images, It's easy to thumbnail with PIL:\n\n```python\ndef thumbnail(im, size):\n    \"\"\"thumnail the image\"\"\"\n    im.thumbnail(size, Image.ANTIALIAS)\n    return im\n```\n\nLet's have a fun with them. To get heaps of images randomly on the desktop, I hardcoded these parameters to get my photos work, you HAVE TO find yours:\n\n```python\n# Just for fun\ndef chao_image(path, size=(800, 800), thumbnail_size=(50, 50), shadow_offset=(10, 10), backgroud_color=0xffffff):\n    image_all = Image.new('RGB', size, backgroud_color)\n    for image in os.listdir(path):\n        if image.split('.')[-1] == 'png':\n            im = Image.open(image)\n            degree = random.randint(-30, 30)\n            im = thumbnail(rotate_image(drop_shadow(add_frame(im), shadow_offset), degree), thumbnail_size)\n            image_all.paste(im, (random.randint(-thumbnail_size[0], size[0]), random.randint(-thumbnail_size[1], size[1])), im)\n    return image_all\n```\n\n## Calculate Images And Compare\n\nGet average colors of an image\n\n```python\ndef average_image(im):\n    \"\"\"return average (r,g,b) for image\"\"\"\n    color_vector = [int(x) for x in ImageStat.Stat(im).mean]\n    return color_vector\n```\n\nto compare images? Compare the (r,g,b) value of them.\n\n```python\ndef compare_vectors(v1, v2):\n    \"\"\"compare image1 and image2, return relations\"\"\"\n    if len(v1) == len(v2):\n        distance = 0\n        for i in xrange(len(v1)):\n            distance += (v1[i] - v2[i]) ** 2\n        return distance\n    else:\n        print \"vector not match in dimensions\"\n```\n\nI just use distance in (R, G, B) space to calculate similarity, someone advice compare in other space, you can change it just like the example in PIL's documentation:\n\n```python\n# May not useful\ndef rgb2xyz(im):\n    \"\"\"rgb to xyz\"\"\"\n    rgb2xyz = (0.412453, 0.357580, 0.180423, 0, 0.212671, 0.715160, 0.072169, 0, 0.019334, 0.119193, 0.950227, 0)\n    out = im.convert(\"RGB\", rgb2xyz)\n    return out\n```\n\nBut I find many implements just use R,G,B, and it works well.\n\nNext, get a dict of image in current path, in which filename as key, average (R,G,B) colors as value.\n\n```python\ndef tile_dict(path):\n    \"\"\"Return list of average (R,G,B) for image in this path as dict.\"\"\"\n    dic = {}\n    for image in os.listdir(path):\n        if image.split('.')[-1] == 'png':\n            try:\n                im = Image.open(image)\n            except:\n                print \"image file %s cannot open\" % image\n                continue\n            if im.mode != 'RGB':\n                im = im.convert('RGB')\n            dic[image] = average_image(im)\n    return dic\n```\n\nWe don't need to calculate every pixel of the large picture, just thumbnail it to get a nearest color of different regions.\n\n```python\ndef thumbnail_background(im, scale):\n    \"\"\"thumbnail backgroud image\"\"\"\n    newsize = im.size[0] / scale, im.size[1] / scale\n    im.thumbnail(newsize)\n    print 'thumbnail size and the number of tiles %d X %d' % im.size\n    return im.size\n```\n\nFor every pixel in the thumbnailed large image, find most similar small image filenames.(top ten):\n\n```python\ndef find_similar(lst, dic):\n    \"\"\"for lst([R, G, B], Calculate which key-value in dic has the most similarity.Return first 10)\"\"\"\n    similar = {}\n    for k, v in dic.items():\n        similar[k] = compare_vectors(v, lst)\n        # if len(v) != len(lst):\n        #     print v, len(v), lst, len(lst)\n    similar = [(v, k) for k, v in similar.items()]  # Not good, lost the same Score\n    similar.sort()\n    return similar[:10]\n```\n\nPoor hack, but it really works...\n\n## Final Work\n\nNow it's the final magic.\n\nGet the small image in order, the order imply where it should be. Then rotate, add shadows and frames for small images, finally paste it onto the large one randomly in the right position:\n\n```python\ndef get_image_list(im, dic):\n    \"\"\"receive a thumbnail image and a dict of image to be mosaic, return tiles(filename) in order(as a list)\"\"\"\n    lst = list(im.getdata())\n    tiles = []\n    for i in range(len(lst)):\n        #print find_similar(lst[i], dic)[random.randrange(10)][1]\n        tiles.append(find_similar(lst[i], dic)[random.randrange(10)][1])\n    return tiles\n    \n    \ndef paste_chaos(image, tiles, size, shadow_off_set=(30, 30)):\n    \"\"\"size is thumbnail of backgroud size that is how many tiles per line and row\"\"\"\n    # image_all = Image.new('RGB', image.size, 0xffffff)\n    image_all = image\n    lst = range(len(tiles))\n    random.shuffle(lst)\n    fragment_size = (image.size[0] / size[0], image.size[1] / size[1])\n    print 'tiles size %d X %d' % fragment_size\n    print 'number of tiles one iteration: %d' % len(lst)\n    for i in lst:\n        im = Image.open(tiles[i])\n        degree = random.randint(-20, 20)\n        im = thumbnail(rotate_image(drop_shadow(add_frame(im), shadow_off_set), degree), (fragment_size[0] * 3 / 2, fragment_size[1] * 3 / 2))\n        x = i % size[0] * fragment_size[0] + random.randrange(-fragment_size[0] / 2, fragment_size[0] / 2)\n        y = i / size[0] * fragment_size[1] + random.randrange(-fragment_size[1] / 2, fragment_size[1] / 2)\n        # print x, y\n        image_all.paste(im, (x, y), im)\n    return image_all\n```\n\nI try it like this, I know parameter `n` is tricky, it was the scale it thumbnail the large image. Maybe I'll change it to something more clear later...\n\n```python\ndef main(filename, n, scale, iteration, path='./'):\n    # 0. select an big image for mosaic\n    print \"open %s\" % filename\n    im = Image.open(filename)\n    # 1. process image as png to support transparency\n    print \"process directory %s\" % path\n    process_directory(path)\n    # 2. get a dict for path\n    print \"get tile dict for path `%s`\" % path\n    try:\n        with open('dic.txt', 'r') as f:\n            dic = p.load(f)\n    except:\n        dic = tile_dict(path)\n        with open('dic.txt', 'wb') as f:\n            p.dump(dic, f)\n    # 3. thumbnail the big image for compare\n    print \"thumbnail background for compare\"\n    # n = 30  # 原始图片缩为多少分之一\n    # scale = 3  # 原始图片放大倍数\n    big_size = im.size[0] * scale, im.size[1] * scale\n    im_chao = Image.new('RGB', big_size, 0xffffff)\n    imb_t_size = thumbnail_background(im, n)\n    print \"how may tiles: %d X %d\" % imb_t_size\n    print 'number of iterations: %d' % iteration\n    for i in range(iteration):\n        print 'iteration: %d' % (i + 1)\n        # 4. get a list of smail image for mosaic\n        print \"get pic list\"\n        im_tiles = get_image_list(im, dic)\n        # 5. paste in chaos style\n        print \"generate final image\"\n        im_chao = paste_chaos(im_chao, im_tiles, imb_t_size)\n    return im_chao\n\n\nif __name__ == '__main__':\n    im = main('../mm.jpg', 15, 5, 2)\n    im.save('../final3.png')\n    im.show()\n```\n\n## Demo\n\nDo you like it?\n\n![Demo](https://1a1rrq.sn2.livefilestore.com/y1p7DQkSgKd5dLtkOiUXpx6ACTajjZYAMtiwrPn3jkW3AzQrvwl9Ao76dCvM6bLWoa8nBKIxqQzGlXC1_ARqTVU2XJgVTkOjaCG/xxx.png?psid=1)\n\n**Can you see it?**\n\n[Demo Download(45.8M)](https://lhtlyybox.googlecode.com/files/final3.png)\n\nMore examples [here](http://photo.renren.com/photo/306127150/album-857154918)(Chinese)\n\n\n## Thanks\n\nMy family, It supports me.Never let me down, never pour cold water, never scold for insignificance.\n",metaData:{layout:"post",title:"Yet Another PhotoMosaic Generator",excerpt:"Writen by python, implement chaos style",category:"python",tags:["python","PIL"],disqus:!0}}}});