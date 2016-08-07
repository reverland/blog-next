---
layout: post
title: "Yet Another PhotoMosaic Generator"
excerpt: "Writen by python, implement chaos style"
category: python
tags: [python, PIL]
disqus: true
---


# Yet Another PhotoMosaic Generator

Update: Mon 25 Feb 2013 11:38:47 AM CST add classic style. More refer to [github](https://github.com/reverland/scripts/blob/master/python/yapmg.py)

> Python是面向对象的？没有对象面向毛对象。
> 
> ——Anonymous

Several weeks ago, I saw a poster of presidential campaign for Obama, in which Obama's portrait was made up of many voter's photos. It really attracted me, somedays later, I want to make one myself.

The completed code host [here](http://github.com/reverland/scripts/blob/master/python/yapmg.py). It is much more functional than object-oriented...

## Search the Internet

First of all, I searched the Google to find out how others achieve it, then I found many interesting implement and post on it.Along with them, there are pretty demos around.One of the demo of [Foto-Mosaik-Edda](http://www.fmedda.com/en/mosaic/chaos) striked me.It declaims as follows in their site:

> The Chaos Mosaic Picture is a new form of photo mosaic which can, at present, only be created by Foto-Mosaik-Edda.

![Chaos Mosaic Picture](http://www.fmedda.com/sites/default/files/pic/mosaic_chaos.png)

Uhm...Foto-Mosaic-Edda is an open-source project that really impressive.But it was an C# project. Linux users don't like it however.I don't like `mono`.

I searched other open-source implement on photomosaic. I get some simple programs only use gray photos, and some complex ones can make beautiful classic photomosaic(like metapixel, even chaos style which it calls collage style), But none has as beautiful demos as Foto-Mosaic-Edda.(metapixel really amazing, it is robust and quickly.)

However, I saw many enthusiastic people write one themselves, it really looks interesting for me. I've used PIL for processing images when I tried to decode captchas several days ago, so I believe with the help of PIL, someone can achieve photomosaic simply.

So I just read the documentation of PIL, then start my hack.

## Write My Own PhotoMosaic Generator

It's not hard, however, what you should do is clear and simple:

- analyse the image to be made mosaic, get a dict in which position as key and color as value.
- use a bunch of images to get a dict, in which image name as key and colors as value.
- thumbnail bunches of images and paste it in the right position, so that the big image looks like it consists of many small one.

I'd like to got the chaos style, so some other requirements:

- frame and shadow for small images
- random paste small images onto large one

Now, let's go.

### Frame, Shadow and Rotate

first add frame, shadow to small images

```python
def add_frame(image):
    '''Add frame for image.'''
    im = ImageOps.expand(image, border=int(0.01 * max(image.size)), fill=0xffffff)
    return im


def drop_shadow(image, offset, border=0, shadow_color=0x444444):
    """Add shadows for image"""
    # Caclulate size
    fullWidth = image.size[0] + abs(offset[0]) + 2 * border
    fullHeight = image.size[1] + abs(offset[1]) + 2 * border
    # Create shadow, hardcode color
    shadow = Image.new('RGBA', (fullWidth, fullHeight), (0, 0, 0))
    # Place the shadow, with required offset
    shadowLeft = border + max(offset[0], 0)  # if <0, push the rest of the image right
    shadowTop = border + max(offset[1], 0)  # if <0, push the rest of the image down
    shadow.paste(shadow_color, [shadowLeft, shadowTop, shadowLeft + image.size[0], shadowTop + image.size[1]])
    shadow_mask = shadow.convert("L")
     # Paste the original image on top of the shadow
    imgLeft = border - min(offset[0], 0)  # if the shadow offset was <0, push right
    imgTop = border - min(offset[1], 0)  # if the shadow offset was <0, push down
    shadow.putalpha(shadow_mask)
    shadow.paste(image, (imgLeft, imgTop))
    return shadow
```


Then a function to rotate images.

```python
def rotate_image(image, degree):
    '''Rotate images for specific degree. Expand to show all'''
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    im = image.rotate(degree, expand=1)
    return im
```

'RGBA' mode is to support transparency. What's matter here is that jpeg/jpg does not support transparency. So you can't get transparency shadows and rotate pictures if you just use jpg/jpeg images.So, write a function to process images with jpg/jpeg format, transpose it into png.

```python
def process_image(filename, newname):
    '''convert image to png to support transparency'''
    if filename.split('.')[-1] != 'png':
        im = Image.open(filename)
        im.save(newname + '.png')
        print "processing image file %s" % filename
    return 1


def process_directory(path):
    os.chdir(path)
    count = 1
    for filename in os.listdir(path):
        ext = filename.split('.')[-1]
        if ext == 'jpeg' or ext == 'jpg':
            process_image(filename, str(count))
            os.remove(filename)
            count += 1
    return 1
```

Really poor work... But it works for me: )

We have to thumnail bunches of images, It's easy to thumbnail with PIL:

```python
def thumbnail(im, size):
    """thumnail the image"""
    im.thumbnail(size, Image.ANTIALIAS)
    return im
```

Let's have a fun with them. To get heaps of images randomly on the desktop, I hardcoded these parameters to get my photos work, you HAVE TO find yours:

```python
# Just for fun
def chao_image(path, size=(800, 800), thumbnail_size=(50, 50), shadow_offset=(10, 10), backgroud_color=0xffffff):
    image_all = Image.new('RGB', size, backgroud_color)
    for image in os.listdir(path):
        if image.split('.')[-1] == 'png':
            im = Image.open(image)
            degree = random.randint(-30, 30)
            im = thumbnail(rotate_image(drop_shadow(add_frame(im), shadow_offset), degree), thumbnail_size)
            image_all.paste(im, (random.randint(-thumbnail_size[0], size[0]), random.randint(-thumbnail_size[1], size[1])), im)
    return image_all
```

## Calculate Images And Compare

Get average colors of an image

```python
def average_image(im):
    """return average (r,g,b) for image"""
    color_vector = [int(x) for x in ImageStat.Stat(im).mean]
    return color_vector
```

to compare images? Compare the (r,g,b) value of them.

```python
def compare_vectors(v1, v2):
    """compare image1 and image2, return relations"""
    if len(v1) == len(v2):
        distance = 0
        for i in xrange(len(v1)):
            distance += (v1[i] - v2[i]) ** 2
        return distance
    else:
        print "vector not match in dimensions"
```

I just use distance in (R, G, B) space to calculate similarity, someone advice compare in other space, you can change it just like the example in PIL's documentation:

```python
# May not useful
def rgb2xyz(im):
    """rgb to xyz"""
    rgb2xyz = (0.412453, 0.357580, 0.180423, 0, 0.212671, 0.715160, 0.072169, 0, 0.019334, 0.119193, 0.950227, 0)
    out = im.convert("RGB", rgb2xyz)
    return out
```

But I find many implements just use R,G,B, and it works well.

Next, get a dict of image in current path, in which filename as key, average (R,G,B) colors as value.

```python
def tile_dict(path):
    """Return list of average (R,G,B) for image in this path as dict."""
    dic = {}
    for image in os.listdir(path):
        if image.split('.')[-1] == 'png':
            try:
                im = Image.open(image)
            except:
                print "image file %s cannot open" % image
                continue
            if im.mode != 'RGB':
                im = im.convert('RGB')
            dic[image] = average_image(im)
    return dic
```

We don't need to calculate every pixel of the large picture, just thumbnail it to get a nearest color of different regions.

```python
def thumbnail_background(im, scale):
    """thumbnail backgroud image"""
    newsize = im.size[0] / scale, im.size[1] / scale
    im.thumbnail(newsize)
    print 'thumbnail size and the number of tiles %d X %d' % im.size
    return im.size
```

For every pixel in the thumbnailed large image, find most similar small image filenames.(top ten):

```python
def find_similar(lst, dic):
    """for lst([R, G, B], Calculate which key-value in dic has the most similarity.Return first 10)"""
    similar = {}
    for k, v in dic.items():
        similar[k] = compare_vectors(v, lst)
        # if len(v) != len(lst):
        #     print v, len(v), lst, len(lst)
    similar = [(v, k) for k, v in similar.items()]  # Not good, lost the same Score
    similar.sort()
    return similar[:10]
```

Poor hack, but it really works...

## Final Work

Now it's the final magic.

Get the small image in order, the order imply where it should be. Then rotate, add shadows and frames for small images, finally paste it onto the large one randomly in the right position:

```python
def get_image_list(im, dic):
    """receive a thumbnail image and a dict of image to be mosaic, return tiles(filename) in order(as a list)"""
    lst = list(im.getdata())
    tiles = []
    for i in range(len(lst)):
        #print find_similar(lst[i], dic)[random.randrange(10)][1]
        tiles.append(find_similar(lst[i], dic)[random.randrange(10)][1])
    return tiles
    
    
def paste_chaos(image, tiles, size, shadow_off_set=(30, 30)):
    """size is thumbnail of backgroud size that is how many tiles per line and row"""
    # image_all = Image.new('RGB', image.size, 0xffffff)
    image_all = image
    lst = range(len(tiles))
    random.shuffle(lst)
    fragment_size = (image.size[0] / size[0], image.size[1] / size[1])
    print 'tiles size %d X %d' % fragment_size
    print 'number of tiles one iteration: %d' % len(lst)
    for i in lst:
        im = Image.open(tiles[i])
        degree = random.randint(-20, 20)
        im = thumbnail(rotate_image(drop_shadow(add_frame(im), shadow_off_set), degree), (fragment_size[0] * 3 / 2, fragment_size[1] * 3 / 2))
        x = i % size[0] * fragment_size[0] + random.randrange(-fragment_size[0] / 2, fragment_size[0] / 2)
        y = i / size[0] * fragment_size[1] + random.randrange(-fragment_size[1] / 2, fragment_size[1] / 2)
        # print x, y
        image_all.paste(im, (x, y), im)
    return image_all
```

I try it like this, I know parameter `n` is tricky, it was the scale it thumbnail the large image. Maybe I'll change it to something more clear later...

```python
def main(filename, n, scale, iteration, path='./'):
    # 0. select an big image for mosaic
    print "open %s" % filename
    im = Image.open(filename)
    # 1. process image as png to support transparency
    print "process directory %s" % path
    process_directory(path)
    # 2. get a dict for path
    print "get tile dict for path `%s`" % path
    try:
        with open('dic.txt', 'r') as f:
            dic = p.load(f)
    except:
        dic = tile_dict(path)
        with open('dic.txt', 'wb') as f:
            p.dump(dic, f)
    # 3. thumbnail the big image for compare
    print "thumbnail background for compare"
    # n = 30  # 原始图片缩为多少分之一
    # scale = 3  # 原始图片放大倍数
    big_size = im.size[0] * scale, im.size[1] * scale
    im_chao = Image.new('RGB', big_size, 0xffffff)
    imb_t_size = thumbnail_background(im, n)
    print "how may tiles: %d X %d" % imb_t_size
    print 'number of iterations: %d' % iteration
    for i in range(iteration):
        print 'iteration: %d' % (i + 1)
        # 4. get a list of smail image for mosaic
        print "get pic list"
        im_tiles = get_image_list(im, dic)
        # 5. paste in chaos style
        print "generate final image"
        im_chao = paste_chaos(im_chao, im_tiles, imb_t_size)
    return im_chao


if __name__ == '__main__':
    im = main('../mm.jpg', 15, 5, 2)
    im.save('../final3.png')
    im.show()
```

## Demo

Do you like it?

![Demo](https://1a1rrq.sn2.livefilestore.com/y1p7DQkSgKd5dLtkOiUXpx6ACTajjZYAMtiwrPn3jkW3AzQrvwl9Ao76dCvM6bLWoa8nBKIxqQzGlXC1_ARqTVU2XJgVTkOjaCG/xxx.png?psid=1)

**Can you see it?**

[Demo Download(45.8M)](https://lhtlyybox.googlecode.com/files/final3.png)

More examples [here](http://photo.renren.com/photo/306127150/album-857154918)(Chinese)


## Thanks

My family, It supports me.Never let me down, never pour cold water, never scold for insignificance.
