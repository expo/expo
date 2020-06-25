---
title: Optimizing Updates
---

## Table of contents

- [Limits on Expo's Updates Service](#limits-on-expos-updates-service)
  - [Optimize Images](#optimize-images)
  - [Reduce Large Dependencies](#reduce-large-dependencies)
  - [Building Your App on Your Own Computer](#building-your-app-on-your-own-computer)
- [A Glimpse at the Future](#a-glimpse-at-the-future)

## Limits on Expo's Updates Service

The way to think about publishing an update to your Expo app is like publishing a new version of your website. In fact, when you publish an update to your Expo web app, you're publishing a new version of your site. Regardless of the underlying platform, Expo updates are downloaded by users running your app on Android, iOS, and the web and the smaller your update, the faster and more reliably your users will be able to download them and use up less of their data plans on cell connections.

Expo's current updates service is designed to accomodate updates, which comprise JS code and assets, around 50 MiB. Many well-engineered production apps use far less than this, which contributes to better user experiences.
Below are a couple of general techniques that help reduce the size of updates. Many of them are also techniques to optimize websites since both Expo updates and websites are served over the web.

### Optimize Images
Many images can be reduced by more than 30% in size if they haven't been previously optimized. One simple way to optimize images is to resize them to the dimensions your app actually uses; if your image dimensions are 4032x3024 but your app only needs to display a 400x300 image, downsizing your image with a good interpolation algorithm like bicubic sharpening will greatly reduce your image's size.

Another way to optimize images is to re-encode them using an optimizer like [expo-optimize](https://github.com/expo/expo-cli/tree/master/packages/expo-optimize#-welcome-to-expo-optimize), which optimizes all compatible images in you Expo project:

```
npm install -g sharp-cli
npx expo-optimize <project-directory> [options]
```

There are many other image optimizers you may like to use like [jpegoptim](https://github.com/tjko/jpegoptim), [guetzli](https://github.com/google/guetzli), [pngcrush](https://pmt.sourceforge.io/pngcrush/), or [optipng](http://optipng.sourceforge.net/). [imagemin](https://github.com/imagemin/imagemin) is another program and JS library that supports plugins for various optimizers. There are also many online services that can optimize your images for you.

Some image optimizers are lossless. This means they re-encode your image to be smaller without any change, or loss, in the pixels that are displayed. When you need each pixel to be untouched from the original image, a lossless optimizer and a lossless image format like PNG is a good choice.
Other image optimizers are lossy, which means the optimized image is different than the original image. Often, lossy optimizers are more efficient because they discard visual information that reduces file size while making the image look nearly the same to humans. Tools like `imagemagick` can use comparison algorithms like [SSIM](https://en.wikipedia.org/wiki/Structural_similarity) to give a sense of how similar two images look. It's quite common for an optimized image that is over 95% similar to the original image to be far less than 95% of the original file size!

### Reduce Large Dependencies

Large npm dependencies can contribute greatly to the size of your code in an update. While dependencies like `expo`, `react`, and several more packages are necessary and very useful, sometimes a dependency can be surprisingly large even if you use only one method from it, or you might have multiple versions of the same dependency in your JS bundle.

## Building Your App on Your Own Computer

If you need to build an app with large assets, such as large embedded videos, a simple and practical solution is to use the bare workflow and compile the app using Android Studio and Xcode. You can either use your own computer or provision Linux and macOS VMs with a cloud provider on which to run the standard build toolchains for Android and iOS.

With `expo-updates` you can also host updates on your own servers, which may support arbitrarily large files.

## A Glimpse at the Future

The next generation of services for Expo apps, Expo Application Services (EAS), will support higher limits and a scalable pricing model for startups and ohter businesses with those needs. This is a long-term engineering project and we hope to have more to share sometime in 2021.
