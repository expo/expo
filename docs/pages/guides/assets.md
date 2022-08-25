---
title: Assets
---

Images, fonts, videos, sounds, any other file that your app depends on that is not JavaScript is considered to be an _asset_.

## Local assets

Assets stored on your file system can be imported like JavaScript modules, using `require` or `import`. For example, from **App.js**, to render an image called **example.png** that is stored within the project's **assets/images** directory: `<Image source={require('./assets/images/example.png')} />`. The bundler will automatically provide a width and height for images imported this way. Learn more in the React Native [Static Image Resources](https://reactnative.dev/docs/images#static-image-resources) documentation. Libraries like [expo-av](/versions/latest/sdk/video/) and [expo-file-system](/versions/latest/sdk/filesystem/) work just like `Image` with local assets.

Local assets this way will be served over HTTP in development, and they will be automatically bundled into your app binary at build time.

When you publish an update your app with [EAS Update](/eas-update/introduction/), your assets will be uploaded and served from a CDN. Any asset that is not already included in the build that receives the update will be downloaded before launching the update. When previewing an app in Expo Go, assets will be downloaded as the project is running. You can load these before your app starts with the [`useAssets`](/versions/latest/sdk/asset/) hook.

## Remote assets

To render a remote image, pass the URL to the image to the `Image` component: `<Image source={{uri: 'https://example.com/logo.png'}} />`.

No guarantee can be made about the availability of the images that you refer to with a web URL because an internet connection may not be available or the asset may have been removed. Additionally, we don't have the same amount of information about arbitrary web URL: when your assets are available on the local filesystem, the bundler is able to read some metadata (width, height, for example) and pass that through to your app, so you actually don't need to specify a width and height, for example. When specifying a remote web URL, you will need to explicitly specify a width and height, or it will default to 0x0. Lastly, as you will see later, caching behavior is different in both cases.

Libraries like [expo-av](/versions/latest/sdk/video/) and [expo-file-system](/versions/latest/sdk/filesystem/) work just like `Image` with remote assets.

Remote assets are not bundled into binaries at build time. They are also not considered part of an [EAS Update](/eas-update/introduction/) bundle.

## Customizing supported asset extensions

If you need to import a file type that is not recognized by Metro by default, you can modify the Metro configuration. For example, you may want to use the `.db` to import a database into your app. Read more about how to customize the asset extensions supported by Metro for iOS and Android in [Customizing Metro](../guides/customizing-metro.md) and learn about how you can customize Webpack for Web in [Customizing Webpack](../guides/customizing-webpack.md).

## Optimization

### Images

You can compress images using tools such as [guetzli](https://github.com/google/guetzli), [pngcrush](https://pmt.sourceforge.io/pngcrush/), or [optipng](http://optipng.sourceforge.net/). [imagemin](https://github.com/imagemin/imagemin) is another program and JS library that supports plugins for various optimizers. There are also many online services that can optimize your images for you.

Some image optimizers are lossless. This means they re-encode your image to be smaller without any change, or loss, in the pixels that are displayed. When you need each pixel to be untouched from the original image, a lossless optimizer and a lossless image format like PNG is a good choice.

Other image optimizers are lossy, which means the optimized image is different than the original image. Often, lossy optimizers are more efficient because they discard visual information that reduces file size while making the image look nearly the same to humans. Tools like `imagemagick` can use comparison algorithms like [SSIM](https://en.wikipedia.org/wiki/Structural_similarity) to give a sense of how similar two images look. It's quite common for an optimized image that is over 95% similar to the original image to be far less than 95% of the original file size!

### Fonts

As explained above, in production builds, your local assets will all be bundled and loaded from disk rather than over the network as expected for native apps, but they must be loaded over the network when previewing in Expo Go or development builds. On the web the font loading problem is known by several acronyms: FOUT, FOIT, and FOFT, which stand for Flash of Unstyled Text, Flash of Invisible Text, and Flash of Faux Text ([read more here](https://css-tricks.com/fout-foit-foft/)). The default behavior with [@expo/vector-icons](icons.md#icons) icons is a FOIT on first load, and on subsequent loads the font will be automatically cached. You may want to preload fonts during the initial loading screen with [`useFonts`](/versions/latest/sdk/font/#usefontsmap). For example: `useFonts([require('./assets/fonts/ComicSans.ttf', FontAwesome.font)])`.