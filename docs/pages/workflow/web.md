---
title: Developing for Web
sidebar_title: Developing for Web
---

import { H2 } from '~/components/plugins/Headings';

If you build your native mobile app with Expo then you can also run it directly in the browser with the CLI and universal Expo SDK. The web part of your app runs with [React Native for web](https://github.com/necolas/react-native-web) which powers massive websites and progressive web apps like [Twitter](https://mobile.twitter.com/), and [Major League Soccer](https://matchcenter.mlssoccer.com/). The Expo SDK also utilizes native browser functionality like Video, Camera, and Gestures without the need for a custom native browser.

> 🚨 Web support has been available in beta since SDK 33, if you find a bug please [report it here](https://github.com/expo/expo/issues) with the `[web]` tag in the title.

## 🔎 How does it work

You get a highly performant React website with progressive web app features enabled from the start. Because there is no "magical" canvas work going on in the background, you get a fully accessible website with a great lighthouse score right from the start.

<H2 sidebarTitle="📱 Progressive Web Apps">
📱 
<a href="https://developers.google.com/web/progressive-web-apps/">
Progressive Web Apps
</a>
</H2>

Expo makes it easy to create PWAs by generating web app data from your app config. You can customize your offline support to fully enable PWA features in your website. Run your app on a variety of different devices and reach a much wider user-base with a feature-filled PWA.

- ⭐️ **Share Icons:** Automatically reuse the App Icon and Splash Screens from your mobile app!
- 💬 **Native Features:** Use secure features like the Sharing API in your PWA.
- 🌗 **Dark Mode:** Make your site accessible with the appearance API.

[Read more about building a Progressive Web App with Expo Web](../guides/progressive-web-apps.md).

<!-- - Password Sharing: Expo can automatically link your native app to your website with tools like Apple App-site Association which means your users can sign-in on one platform and auto-fill on another. -->

## 🎨 Highly Customizable

You can use Expo for web with any of your favorite frameworks to create whatever experience your project calls for!

- [**Next.js:**](https://dev.to/evanbacon/next-js-expo-and-react-native-for-web-3kd9) Server Side Render your website and get incredible SEO.
- [**Gatsby:**](https://dev.to/evanbacon/gatsby-react-native-for-web-expo-2kgc) Prerender your static-site.
- [**Storybook:**](https://github.com/expo/examples/tree/master/with-storybook) Create and test beautiful design languages.

## 🏁 Up Next

- Check out how to [Add Web Support to Your Project](../guides/running-in-the-browser.md#adding-web-support-to-expo-projects).
- Learn about creating [Responsive web apps with Expo](https://blog.expo.io/media-queries-with-react-native-for-ios-android-and-web-e0b73ed5777b).
- Find out how to [Publish your website Anywhere!](../distribution/publishing-websites.md).
- Look at some [Examples and Recipes for Building Universal Websites!](https://github.com/expo/examples).
- Learn about building a [Progressive Web App](../guides/progressive-web-apps.md).
- Found an issue with web support? [Report it here](https://github.com/expo/expo/issues)
- Have a question? [Ask on our forums web](https://forums.expo.io/c/expo-web)
