---
title: Using Next.js with Expo for Web
sidebar_title: Using Next.js
---

import { Collapsible } from '~/ui/components/Collapsible';

> Please open any issues related to Next.js with Expo at [expo-cli/issues](https://github.com/expo/expo-cli/issues).

[Next.js][nextjs] is a React framework that provides simple page-based routing as well as server-side rendering. To use Next.js with Expo for web we recommend that you use a library called [`@expo/next-adapter`][next-adapter] to handle the configuration and integration of the tools.

Using Expo with Next.js means you can share all of your existing components and APIs across your mobile and web. Next.js has its own Webpack config so **you'll need to start your web projects with the Next.js CLI and not with `npx expo start`.**

> Next.js can only be used with Expo for web, this doesn't provide Server-Side Rendering (SSR) for native apps.

## TL;DR:

- Init: `npx create-react-native-app -t with-nextjs` (or `npx create-next-app -e with-expo`)
- Start: `yarn next dev`
- Open: `http://localhost:3000/`

## Setup

To get started, create a new project with [the template](https://github.com/expo/examples/tree/master/with-nextjs):

```sh
npx create-react-native-app -t with-nextjs
```

- **Web**: `yarn next dev` -- start the Next.js project
- **Native**: `npx expo start` -- start the Expo project

### Add Next.js to Expo projects

> This is for already existing Expo projects.

In this approach you would be using SSR for web in your universal project. This is the recommended path because it gives you full access to the features of Expo and Next.js.

<Collapsible summary="Instructions">

- Install the adapter:
  - **yarn:** `yarn add -D @expo/next-adapter`
  - npm: `npm i --save-dev @expo/next-adapter`
- Add Next.js support: `yarn next-expo`
  - Always commit your changes first!
  - You can optionally choose which customizations you want to do with `--customize or -c`
  - Force reload changes with `--force or -f`
- Start the project with `yarn next dev`
  - Go to `http://localhost:3000/` to see your project!

</Collapsible>

### Add Expo to Next.js projects

> This is for already existing Next.js projects.

This approach is useful if you only want to use Expo components in your web-only project.

<Collapsible summary="Instructions">

- Install the adapter:
  - **yarn:** `yarn add -D @expo/next-adapter`
  - npm: `npm i --save-dev @expo/next-adapter`
- Add Next.js support: `yarn next-expo`
  - Always commit your changes first!
  - You can optionally choose which customizations you want to do with `--customize or -c`
  - Force reload changes with `--force or -f`
- Start the project with `yarn next dev`
  - Go to `http://localhost:3000/` to see your project!

</Collapsible>

### Manual setup

Optionally you can set the project up manually (not recommended).

<Collapsible summary="Instructions">

- Re-export the custom `Document` component in the **pages/\_document.js** file of your Next.js project.

  - This will ensure `react-native-web` styling works.
  - You can run `yarn next-expo -c` then select **pages/\_document.js**
  - Or you can create the file - `mkdir pages; touch pages/_document.js`

  **pages/\_document.js**

  ```js
  export { default } from '@expo/next-adapter/document';
  ```

- Create a **babel.config.js** and use [`babel-preset-expo`](https://github.com/expo/expo/tree/main/packages/babel-preset-expo).

  - You can run `yarn next-expo -c` then select **babel.config.js**
  - Or you can You may have installed this earlier with `yarn add -D babel-preset-expo`

  **babel.config.js**

  ```js
  module.exports = {
    presets: ['@expo/next-adapter/babel'],
  };
  ```

- Update the Next.js **next.config.js** file to support loading React Native and Expo packages:

  - yarn add -D next-compose-plugins next-transpile-modules

  - `touch next.config.js`

  **next.config.js**

  ```js
  const { withExpo } = require('@expo/next-adapter');
  const withPlugins = require('next-compose-plugins');
  const withTM = require('next-transpile-modules')(['react-native-web']);

  const nextConfig = {};

  module.exports = withPlugins([withTM, [withExpo, { projectRoot: __dirname }]], nextConfig);
  ```

- You can now start your Expo web + Next.js project with `yarn next dev` 🎉

</Collapsible>

## Guides

### Deploy to Vercel

(Formerly ZEIT Now)

This is Vercel's preferred method for deploying Next.js projects to production.

- Add a **build** script to your **package.json**
  ```json
  {
    "scripts": {
      "build": "next build"
    }
  }
  ```
- Install the Vercel CLI: `npm i -g vercel`
- Deploy to Vercel: `vercel`

### Polyfill setImmediate

> Fixes `setImmediate is not defined` error.

A lot of libraries in the React ecosystem use the `setImmediate()` API (like `react-native-reanimated`), which Next.js doesn't polyfill by default. To fix this you can polyfill it yourself.

- Install: `yarn add setimmediate`
- Import in **pages/\_app.js**, at the top of the file:
  ```js
  import 'setimmediate';
  ```

If you restart the server this error should go away.

- [Related issue and solution](https://github.com/expo/expo/issues/7996).

### Image support

By default Next.js won't load your statically imported images (images that you include in your project with `require('./path/to/image.png')`) like an Expo project will. If you want to load static images into your `<Image />` components or use `react-native-svg` then you can do the following:

- Install the plugin - `yarn add next-images`
  - [`next-images`][next-images] injects a Webpack loader to handle images.
  - [`next-optimized-images`][next-optimized-images] is another good solution that you could check out.
- Wrap your Next.js configuration object with the image method and the Expo method in your **next.config.js**:

  ```js
  const { withExpo } = require('@expo/next-adapter');
  const withImages = require('next-images');

  module.exports = withExpo(
    withImages({
      projectRoot: __dirname,
    })
  );
  ```

- Now restart your project and you should be able to load images!

You can test your config with the following example:

<Collapsible summary="Show Example">

```js
import React from 'react';
import { Image } from 'react-native';

export default function ImageDemo() {
  return <Image source={require('./assets/image.png')} style={{ flex: 1 }} />;
}
```

</Collapsible>

[next-images]: https://github.com/twopluszero/next-images
[next-optimized-images]: https://github.com/cyrilwanner/next-optimized-images

### Font support

By default Next.js doesn't support static assets like an Expo project. Because this is the intended functionality of Next.js, `@expo/next-adapter` doesn't add font support by default. If you want to use libraries like `expo-font`, `@expo/vector-icons`, or `react-native-vector-icons` you'll need to change a few things.

- Install the plugin - `yarn add next-fonts`
  - [`next-fonts`][next-fonts] injects a Webpack loader to handle fonts.
- Wrap the font method with the Expo method in your **next.config.js**:

  - The order is important because Expo can mix in the location of vector icons to the existing font loader.

  ```js
  const { withExpo } = require('@expo/next-adapter');
  const withFonts = require('next-fonts');

  module.exports = withExpo(
    withFonts({
      projectRoot: __dirname,
    })
  );
  ```

- Now restart your project and you should be able to load fonts!

You can test your config with the following example:

<Collapsible summary="Show Example">

```js
import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { Text } from 'react-native';

export default function FontDemo() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          // You can get this font on GitHub: https://shorturl.at/chEHS
          'space-mono': require('./assets/SpaceMono-Regular.ttf'),
        });
      } catch ({ message }) {
        // This will be called if something is broken
        console.log(`Error loading font: ${message}`);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  if (!loaded) return <Text>Loading fonts...</Text>;

  return <Text style={{ fontFamily: 'space-mono' }}>Hello from Space Mono</Text>;
}
```

</Collapsible>

[next-fonts]: https://github.com/rohanray/next-fonts

## API

### CLI

Generate static Next.js files into your project.

#### CLI Options

For more information run `yarn next-expo --help` (or `-h`)

| Shortcut | Flag          | Description                                           |
| -------- | ------------- | ----------------------------------------------------- |
| `-f`     | `--force`     | Allows replacing existing files                       |
| `-c`     | `--customize` | Select template files you want to add to your project |
| `-V`     | `--version`   | output the version number                             |

### Babel

The adapter provides a Babel config [`@expo/next-adapter/babel`](https://github.com/expo/expo-cli/blob/master/packages/next-adapter/src/babel.ts) to simplify setup.

- Always use the universal [`babel-preset-expo`](https://github.com/expo/expo/tree/main/packages/babel-preset-expo)
  - Provides React Native support for all platforms that Expo supports (web, iOS, Android)
- When running in the browser, also use `next/babel` preset.

### Config

#### `withExpo`

Wraps your [**next.config.js**](https://nextjs.org/docs#custom-configuration) and adds universal platform support.

- Defines a custom `pageExtensions` which makes Webpack resolve **.web.js** before **.js**, we call this feature "platform extensions".
- Wraps the Webpack config in `withUnimodules` from `@expo/webpack-config`
  - Makes Babel target all Expo, and React Native packages that you've installed
  - Aliases `react-native` to `react-native-web` in the browser
  - Defines the platform constants you get in React Native like `__DEV__`

```js
const { withExpo } = require('@expo/next-adapter');

module.exports = withExpo({
  /* next.config.js code */
});
```

### Document

Next.js uses the **pages/\_document.js** file to augment your app's `<html>` and `<body>` tags. Learn more [here](https://nextjs.org/docs#custom-document).

This adapter provides a default `Document` (extended from Next.js's Document) that you can use to skip all of the React Native setup.

- Registers your app with `AppRegistry` from `react-native-web` to start your project.
- Implements the `react-native-web` CSS reset.

```js
import Document, { style, getInitialProps } from '@expo/next-adapter/document';
```

#### Customizing the Document

If you need more control you can import then recompose the `Document` how you like. This is good for augmenting the `<head />` element or mixing your own styles.

```tsx
import { getInitialProps } from '@expo/next-adapter/document';
import Document, { Head, Main, NextScript } from 'next/document';
import React from 'react';

class CustomDocument extends Document {
  render() {
    return (
      <html>
        <Head>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}

// Import the getInitialProps method and assign it to your component to ensure the react-native-web styles are used.
CustomDocument.getInitialProps = getInitialProps;

// OR...

CustomDocument.getInitialProps = async props => {
  const result = await getInitialProps(props);
  // Mutate result...
  return result;
};

export default CustomDocument;
```

## Limitations or differences comparing to the default Expo for Web

- To get PWA support, use Next.js plugins such as [next-offline][next-offline] instead. Learn more [here][next-pwa].
- You might need to use the [next-transpile-modules](https://github.com/martpie/next-transpile-modules) plugin to transpile certain third-party modules in order for them to work (such as Emotion).
- Only the Next.js default page-based routing is supported. You'll need to use a completely different routing solution to do native navigation. We strongly recommend [react-navigation](https://reactnavigation.org/) for this.

## Contributing

If you would like to help make Next.js support in Expo better, please feel free to open a PR or submit an issue:

- [@expo/next-adapter][next-adapter]

If you have any problems rendering a certain component with SSR then you can submit fixes to the expo/expo repo:

- [Expo SDK packages][expo-packages]

{/* Footer */}

[expo-packages]: https://github.com/expo/expo/tree/main/packages
[nextjs]: https://nextjs.org/
[next-adapter]: https://github.com/expo/expo-cli/tree/main/packages/next-adapter
[next-docs]: https://nextjs.org/docs
[custom-document]: https://nextjs.org/docs#custom-document
[next-offline]: https://github.com/hanford/next-offline
[next-pwa]: https://nextjs.org/features/progressive-web-apps
[next-transpile-modules]: https://github.com/martpie/next-transpile-modules
