---
layout: post
title: "Upgrade Gentoo Linux"
excerpt: "A simple notes"
category: linux
tags: [linux]
disqus: true
---


Nowadays, I upgraded my gentoo linux.

I have not synchronoused the portage tree for nearly half of the year. When I came with upgrading my system, I got stuck with a lot of things I've never thought.

Luckily enough, gentoo use a mechanism to incremental upgrade. So I spent days to completely upgrade the system just with the system working properly.

This is a simple notes. I can't really remember the details.

I'll just write down what I learned from this lesson. To more smoothly upgrade the  system the next time.

## Upgrade The Stable

### Upgrade it

First, syncing the portage tree.

    emerge-websync

Select a good source, if you encounter with something wrong just remove the portage tree in `/usr/portage/`.

<p color='red'>NEVER NEVER FORGET TO READ THE NEWS</p>

    eselect news list

Then, emerge the world. You can edit `/usr/portage/world` to select what you really want. I've play a lot of things I may never explore later, so I just edit it to minimize the time for upgrading.

We can emerge world now. And, preparing for struggling for hours or days...Always use `--with-bdeps=y`.

    emerge --update --deep --with-bdeps=y @world

As a alternative, emerge system first.

    emerge --update --deep --with-bdeps=y system

Always, there exists tons of conflicts and some other problems like licenses and so on.

As far as I know, one have to solve them step by step.

### Problems

There may three major problems:

#### Dependency Conflict

Check if you have emerge softwares are not included in the stable portage tree. Remove it like this:

    emerge --depclean google-chrome

Check if you've masked some software. Remove them...

Re-emerge.

#### Build or Configure Error

Just search via google. You may re-emerge something portage won't handle properly.

Sometimes, this is because you have to rebuild Perl modules.

    perl-cleaner --all -- --exclude=perl-core/Module-CoreList

#### New XXX Need to be Changed to Proceed

Use `--auto-unmask-write` if you know what you are doing.

then:

    dispatch-conf

or:

    etc-update

## Post Upgrading

You may want to update the overlay too.

    layman -S

Yet another emerge world(If you encounter with problems, refer to the notes above):

    emerge --update --deep --with-bdeps=y @world

Remove orphaned packages.

    emerge --depclean -a

Check obsolete packages:

    eix-test-obsolete

Update configure files:

    etc-update

Rebuild broken packages:

    revdep-rebuild

Update eix databases:

    eix-update

If you compile a new kernel(you do not have to), don't forget to:

    emerge @module-rebuild

That's all, hope this helps.
