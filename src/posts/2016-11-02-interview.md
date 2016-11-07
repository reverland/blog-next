---
layout: post
title: "翼をください"
excerpt: "翼をください"
category: Life
tags: [life]
disqus: true
---

林原めぐみ - アニメ『ヱヴァンゲリヲン新劇場版:破』挿入歌。

この歌が大好きです、そして...

## 翼をください

今私の

願いごとが

かなうならば

翼がほしい

この背中に

鳥のように

白い翼

つけてください

この大空に

翼を広げ

飛んで

行きたいよ

悲しみのない

自由な空へ

翼はためかせ

行きたい


子供の時

夢見たこど

今も同じ

夢にみていろ


この大空に

翼を広げ

飛んで

行きたいよ

悲しみのない

自由な空へ

翼はためかせ

この大空に

翼を広げ

飛んで

行きたいよ

悲しみのない

自由な空へ

翼はためかせ

この大空に

翼を広げ

飛んで

行きたいよ

悲しみのない

自由な空へ

翼はためかせ

この大空に

翼を広げ

飛んで

行きたいよ

悲しみのない

自由な空へ

翼はためかせ

行きたい

## 赐吾双翼

若吾愿能行

请赐双飞翼

如鸟负白羽

长空展翅飞

自在青空里

无伤亦无悲

少时梦中物

今犹心徘徊

## Give Me Wings

If my dream can come true,

the Wings is what I like to have,

Looking like a bird is really cool,

Waving white wings like a bird man do,

no sadness and no sorrow too,

I have dream this since my childhood.

## Javascript

```javascript
'use strict'

let canAchiveDream = true
let growUpSeconds = 3

if (canAchiveDream) {
  have_wings().then((wings) => {
    wings.fly()
  })
}

function have_wings () {
  console.log('childhood')
  let wings = {
    position: 'back'
    , number: 2
    , color: '#ffffff'
    , fly: function () {
      console.log('freely fly in the open sky')
    }
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('I grow up, so')
      resolve(wings)
    }, growUpSeconds * 1000)
  })
}
```
