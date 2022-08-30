---
title: Running in the Browser
---

import { Terminal } from '~/ui/components/Snippet';

You can use Expo to create web apps that run in the browser using the same code-base as your existing native app. These apps are rendered using the highly optimized `react-dom` reconciler via `react-native-web`, meaning there's no compromise on performance.

The underlying technology 'React Native for web' (RNW) was developed by Twitter and is used today on the [twitter.com](https://twitter.com/expo) website. RNW is also used by [Flipkart](https://twitter.com/naqvitalha/status/969577892991549440), [Uber](https://www.youtube.com/watch?v=RV9rxrNIxnY), [Major League Soccer](https://matchcenter.mlssoccer.com/), [BeatGig](https://beatgig.com/) and many others.

## Adding web support to Expo projects

Install the required packages in your project:

<Terminal cmd={["$ npx expo install react-native-web react-dom @expo/webpack-config"]} />

Then start the app with:

<Terminal cmd={["$ npx expo start --web"]} />

And that's it! Packages in the Expo SDK are optimized for web and SSR environments, your web-support millage may vary when using community packages.

<details>
<summary>
<h4>Legacy Guide</h4>
</summary>
<p>

To add web support to an existing app you can do the following:

- Ensure your project has at least `expo@^46.0.0` installed.
- Add web dependencies: `npx expo install react-native-web react-dom`
- Start your project with `npx expo start` then press `w` to start Webpack and open the project in the browser.

</p>
</details>

**Tips**

- Test protected APIs like the camera and user location by adding the `--https` flag to `npx expo start`. This will host your app from a secure origin like `https://localhost:19006`.

## Frameworks

The Expo modules and dev-tools are highly composable and can be used in _any_ React project. Here are a few popular integrations:

- [**Next.js:**](https://dev.to/evanbacon/next-js-expo-and-react-native-for-web-3kd9) Server Side Render your website and get incredible SEO.
- [**Gatsby:**](https://dev.to/evanbacon/gatsby-react-native-for-web-expo-2kgc) Prerender your static-site.
- [**Storybook:**](https://github.com/expo/examples/tree/master/with-storybook) Create and test beautiful design languages.

## Tree-Shaking

The package `babel-preset-expo` extends `@babel/preset-env` on web and is used to configure your project for universal modules. The core feature is that it won't compile your modules to **core.js** when targeting web, this means that you get optimal tree-shaking and dead-code-elimination.
This step is optional with the React Native CLI but you'll get a much smaller bundle size and faster website if you do choose to use it. This is because `module:metro-react-native-babel-preset` is made for usage with the Metro bundler and not Webpack.

> `babel-preset-expo` is required for usage with Create React App, optional but recommended for all React Native projects using Unimodules.

- Install: `yarn add -D babel-preset-expo`
- Change the babel preset in **babel.config.js**. If your project has a `.babelrc` then you should upgrade to **Babel 7+** first.
  ```diff
  module.exports = {
  -   presets: ['module:metro-react-native-babel-preset']
  +   presets: ['babel-preset-expo']
  };
  ```

## App Entry

The initial file of your web app. Be sure to use `registerRootComponent` from `expo` to ensure web the root DOM element is added to the HTML.

If your root project file is `node_modules/expo/AppEntry` or you have a root `App.js`, then the entry component will setup automatically.

### Manual App Entry

In your project's main entry file (presumably `index.js`), add:

```tsx
import { registerRootComponent } from 'expo';

// Assuming `App.js` is the root component.
import App from './App';

// Tells Expo to install the root React component in your `index.html` document body.
// This runs `AppRegistry.registerComponent()` -> `ReactDOM.render()`
// behind a web-only flag.
registerRootComponent(App);
```

### Alternative Rendering Patterns

> **Example:** The website [beatgig.com][beatgig] uses Expo web + Next.js to achieve SSR in the browser.

By default, Expo is rendering your web app as a "single page application" or SPA. This rendering pattern is the closest to how native rendering works. If you'd like to render your Expo web using "server-side rendering" (SSR) or "static site generation" (SSG) then you should try using the Expo SDK with another tool like Gatsby, Next.js, Remix, etc. The caveat is that these tools are less universal and require a bit more effort to share code across platforms.

The ability to use Expo web with these other React frameworks is what makes it the most powerful way to build a universal app. The possibilities are endless and you won't hit a theoretic performance wall in the future.

[rnw]: https://github.com/necolas/react-native-web/
[forums]: https://forums.expo.dev/
[canny]: https://expo.canny.io/feature-requests
[beatgig]: https://beatgig.com/
