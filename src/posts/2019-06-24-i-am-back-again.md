---
layout: post
title: "I'm back again"
excerpt: "After nearly three years without posting here, I'm back again."
category: Life
tags: [life]
disqus: true
---

## Bring This Blog Back

After nearly three years' break for blogging, I finally back here.

Open a terminal, git clone my blog system develop as a game 3 years ago.

I read the README file, it tells me to `npm install`.

but my system complained that no command `npm` found. 

Aha! I haven't write a single line of web 
frontend code for nearly three years except some `xss` code, but I still know what `npm` it is.

I know I should install `Nodejs` first, so I typed:

```bash
sudo apt install -y nodejs
```

Minutes passed by, a fresh new Nodejs was installed. I was satified as if I met a old friend.

I typed the command

```bash
npm install
```

However, it surpised me that no `npm` is installed when nodejs installed on my system.Ok, ok

```bash
sudo apt install -y npm
```

Three years has passed, I dont know whether my code still works. I remember in nodejs world, 
code quality is always suspectable, poor api compatibility and radical development will always bite 
you hard.

Nevertheless, three years has passed. I choose the nodejs and npm bundled with ubuntu(however in subsystem),
It may be the nodejs/npm version I write my blog system three years ago, who knows.

Everything went smoothly, so I just typed:

```bash
npm install
```

I've heard from colleagues work on web frontend development that npm has change alot since I leave.
developers add more feature and it has become a quick, flexible and robust package manager for nodejs.
Even better than `yarn`. When the last time I work as a FE worker, the speed yarn handle things makes 
me appreciate, despite I prefer npm more.

But it was still slow, I checked the dependencies and thought some may work or not. It will really comfort to 
the semantic version? ten minutes passed, the installation process failed.

I didnt really understand the error log, it couldt find files? but I think it will just disapear if I retry, as my experience
in programming told me. 

And it truly disapear...

then I added some of my never published posts and begin

```bash
npm build
```

I hope it work, but half of the hour passed, I even finished this post, in which to announce I'm backing.

It still not finish building.

I suspect it will never finish for some unknown breaking changes.

## Later Posts

Maybe some posts on cryptography.

I walked through [Dan Boneh's Cryptography](https://www.coursera.org/learn/crypto) again after coursera delete and recreate this course.

It looks like a _new_ course for me, I've forgot nearly everything. If I didnt find a passing course email received in year 2013, hardly could I believe I've passed this course ever.


Another interesting things I messed with these months is [a crypto challenge](http://cryptopals.com/). It worth you making you hands dirty if you are interested in cryptography.

I'm curious about all of this and that magics around the world. However, I have to denote nearly all my energy into *work*, and its really hard to make time to learn magic things and enjoy them after a day of working.

I hate work definately, but it really feeds me so I don't have to worry about food and shed.

> Hack for fun, Work for live.

Oh, god. the blog system wakeup from three years ago is still building my posts.

Then I find I just suspend terminal for windows subsystem is a little wired, when you click a running terminal, it will suspend it...

Hollyshit! The blog system still works and runs as quickly as a lightning!

Honor to amazing javascript community.
