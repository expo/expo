---
title: Configuration with exp.json
old_permalink: /versions/v7.0.0/guides/configuration.html
previous___FILE: ./up-and-running.md
next___FILE: ./logging.md

---

`exp.json` is your go-to place for configuring parts of your app that don't belong in code. It's more difficult to explain than it is to show, so let's have a look at a basic example that includes only a few properties.

```javascript
{
  // This is the name of your app in all senses of the word: it appears below
  // the icon on the home screen, in push notifications, etc.
  name: "My New Project",

  // The url-name of the app: https://exp.host/@your-username/slug
  slug: "my-new-project",

  // The target Exponent SDK version. This must line up with the react-native
  // version in package.json
  sdkVersion: "7.0.0",

  // Allowed orientations: default is locked to portrait.
  orientation: "portrait",

  // The icon image to use on your home screen.
  iconUrl: "https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png",

  loading: {
    // The image to display in the center of the splash screen while loading the app.
    iconUrl: "https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png",
  },
}
```

> **Note:** If you've written a lot of JavaScript, the first thing you may notice is that we have comments inside our JSON. We think comments are pretty useful, both for us to be able to annotate properties when we generate a new project for you, and for you to be able to comment out properties to temporarily swap them with other values. So we use [JSON5](http://json5.org/) to parse this file. If you prefer to just use plain JSON, go ahead, it's a subset of JSON5.
