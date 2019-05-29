---
title: Assets
---

Images, fonts, videos, sounds, any other file that your app depends on that is not JavaScript is considered to be an _asset_. Just as on the web, assets are fetched or streamed over HTTP on demand. This is different from your typical mobile app, where assets are bundled with your application binary.

However, there is a distinction in Expo between an asset that you use with the `require` syntax because they are available at build time on your local filesystem, eg: `<Image source={require('./assets/images/example.png')} />`, and web images that you refer to by a web URL, eg: `<Image source={{uri: 'http://yourwebsite.com/logo.png'}} />`. We can make no guarantees about the availability of the images that you refer to with a web URI because we don't manage those assets. Additionally, we don't have the same amount of information about arbitrary web URIs: when your assets are available on the local filesystem, the packager is able to read some metadata (width, height, for example) and pass that through to your app, so you actually don't need to specify a width and height, for example. When specifying a remote web URL, you will need to explicitly specify a width and height, or it will default to 0x0. Lastly, as you will see later, caching behaviour is different in both cases.

The following is an explanation of the former type of assets: those that you have on your filesystem at build time. In the latter case, it is assumed that you are familiar with how to upload an image to somewhere on the web where it can be accessed by any web or mobile app.

## Where assets live

### In development

While you're working on a local copy of your project, assets are served from your local filesystem and are integrated with the JavaScript module system. So if I want to include an image I can `require` it, like I would if it were JavaScript code: `require('./assets/images/example.png')`. The only difference here is that we need to specify an extension -- without an extension, the module system will assume it is a JavaScript file. This statement evaluates at compile time to an object that includes metadata about the asset that can be consumed by the `Image` component to fetch it and render it: `<Image source={require('./assets/images/example.png')} />`

### In production

Each time you publish your app, Expo will upload your assets to Amazon CloudFront, a blazing fast CDN. It does this in an intelligent way to ensure your deploys remain fast: if an asset has not changed since your previous deploy, it is skipped. You don't have to do anything for this to work, it is all automatically handled by Expo.

## Optimization

### Images

Images often take up the most space out of the assets in an Expo project. Optimizing your images will make them take up less space on end users' devices and reduce the time and bandwidth needed to download before they are ready to display. To compress the images (PNGs and JPEGs) in your project, you can run `expo optimize`. You can also pass in the following options:

* `--save`: Backup a copy of each file with a `.orig` extension.
* `--quality=N`: Compress the images to a certain integer quality N between 1 and 100 inclusive (defaults to 60).
* `--include="[pattern]"`: Only optimize assets that match this glob pattern (defaults to `assetBundlePatterns` field in `app.json`)
* `--exclude="[pattern]"`: Exclude assets that match this glob pattern.

Note: glob patterns are always relative to the project root regardless of where the command is called from.

### Fonts

Some assets are too important to start your app without. Fonts often fall into this category. On the web the font loading problem is known by several acronyms: FOUT, FOIT, and FOFT, which stand for Flash of Unstyled Text, Flash of Invisible Text, and Flash of Faux Text ([read more here](https://css-tricks.com/fout-foit-foft/)). The default behaviour with the icon-font-powered [@expo/vector-icons](../icons/#icons) icons is a FOIT on first load, and on subsequent loads the font will be automatically cached. Users have higher standards for mobile than web, so you might want to take it a step further by preloading and caching the font and important images during the initial loading screen.
