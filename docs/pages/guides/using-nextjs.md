---
title: Using Next.js with Expo for Web
---

> Warning: Support for Next.js is experimental. Please open an issue at [expo-cli/issues](https://github.com/expo/expo-cli/issues) if you encountered any problems.

[Next.js](https://nextjs.org/) is a React framework that provides simple page-based routing as well as server-side rendering. To use Next.js with Expo for web we recommend that you use a library called [`@expo/next-adapter`][next-adapter] to handle the configuration and integration of the tools.

Using Expo with Next.js means you can share all of your existing components and APIs across your mobile and web. Next.js has it's own Webpack config so **you'll need to start your web projects with the `next-cli` and not with `expo start:web`.**

> 💡 Next.js can only be used with Expo for web, this doesn't provide Server-Side Rendering (SSR) for native apps.

## TL;DR:

- Init: `npx create-react-native-app -t with-nextjs` (or `npx create-next-app -e with-expo`)
- Start: `yarn next dev`
- Open: `http://localhost:3000/`

- [🏁 Setup](#-setup)
  - [Add Next.js to Expo projects](#add-nextjs-to-expo-projects)
  - [Add Expo to Next.js projects](#add-expo-to-nextjs-projects)
  - [Manual setup](#manual-setup)
- [Guides](#guides)
  - [Deploy to Vercel](#deploy-to-vercel)
  - [Image support](#image-support)
  - [Font support](#font-support)
  - [Offline support](#offline-support)
  - [Using a custom server](#using-a-custom-server)
  - [Handle server requests](#handle-server-requests)
  - [Web push notifications support](#web-push-notifications-support)
- [API](#api)
  - [CLI](#cli)
    - [⚙️ CLI Options](#️-cli-options)
  - [Babel](#babel)
  - [Config](#config)
    - [`withExpo`](#withexpo)
  - [Document](#document)
    - [Customizing the Document](#customizing-the-document)
  - [Server](#server)
    - [`startServerAsync`](#startserverasync)
    - [`createServerAsync`](#createserverasync)
    - [`handleRequest`](#handlerequest)
- [Limitations](#limitations-or-differences-comparing-to-the-default-expo-for-web)
- [Contributing](#contributing)

## 🏁 Setup

To get started, create a new project with [the template](https://github.com/expo/examples/tree/master/with-nextjs):

```sh
npx create-react-native-app -t with-nextjs
```

- **Web**: `yarn next dev` -- start the Next.js project
- **Native**: `expo start` -- start the Expo project

### Add Next.js to Expo projects

> This is for already existing Expo projects.

In this approach you would be using SSR for web in your universal project. This is the recommended path because it gives you full access to the features of Expo and Next.js.

<details><summary>Instructions</summary>
<p>

- Install the adapter:
  - **yarn:** `yarn add -D @expo/next-adapter`
  - npm: `npm i --save-dev @expo/next-adapter`
- Add Next.js support: `yarn next-expo`
  - Always commit your changes first!
  - You can optionally choose which customizations you want to do with `--customize or -c`
  - Force reload changes with `--force or -f`
- Start the project with `yarn next dev`
  - Go to `http://localhost:3000/` to see your project!

</p>
</details>

### Add Expo to Next.js projects

> This is for already existing Next.js projects.

This approach is useful if you only want to use Expo components in your web-only project.

<details><summary>Instructions</summary>
<p>

- Install the adapter:
  - **yarn:** `yarn add -D @expo/next-adapter`
  - npm: `npm i --save-dev @expo/next-adapter`
- Add Next.js support: `yarn next-expo`
  - Always commit your changes first!
  - You can optionally choose which customizations you want to do with `--customize or -c`
  - Force reload changes with `--force or -f`
- Start the project with `yarn next dev`
  - Go to `http://localhost:3000/` to see your project!

</p>
</details>

### Manual setup

Optionally you can set the project up manually (not recommended).

<details><summary>Instructions</summary>
<p>

- Re-export the custom `Document` component in the `pages/_document.js` file of your Next.js project.

  - This will ensure `react-native-web` styling works.
  - You can run `yarn next-expo -c` then select `pages/_document.js`
  - Or you can create the file - `mkdir pages; touch pages/_document.js`

  `pages/_document.js`

  ```js
  export { default } from '@expo/next-adapter/document';
  ```

- Create a `babel.config.js` and use [`babel-preset-expo`](https://github.com/expo/expo/tree/master/packages/babel-preset-expo).

  - You can run `yarn next-expo -c` then select `babel.config.js`
  - Or you can You may have installed this earlier with `yarn add -D babel-preset-expo`

  `babel.config.js`

  ```js
  module.exports = {
    presets: ['@expo/next-adapter/babel'],
  };
  ```

- Update the Next.js `next.config.js` file to support loading React Native and Expo packages:

  - `touch next.config.js`

  `next.config.js`

  ```js
  const { withExpo } = require('@expo/next-adapter');

  module.exports = withExpo({
    projectRoot: __dirname,
  });
  ```

- You can now start your Expo web + Next.js project with `yarn next dev` 🎉

</p>
</details>

## Guides

### Deploy to Vercel

(Formerly ZEIT Now)

This is Vercel's preferred method for deploying Next.js projects to production.

- Add a **build** script to your `package.json`
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

> 💡 Fixes `setImmediate is not defined` error.

A lot of libraries in the React ecosystem use the `setImmediate()` API (like `react-native-reanimated`), which Next.js doesn't polyfill by default. To fix this you can polyfill it yourself.

- Install: `yarn add setimmediate`
- Import in `pages/_app.js`, at the top of the file:
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
- Wrap your Next.js configuration object with the the image method and the Expo method in your `next.config.js`:

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

<details><summary>Show Example</summary>
<p>

```js
import React from 'react';
import { Image } from 'react-native';

export default function ImageDemo() {
  return <Image source={require('./assets/image.png')} style={{ flex: 1 }} />;
}
```

</p>
</details>

[next-images]: https://github.com/twopluszero/next-images
[next-optimized-images]: https://github.com/cyrilwanner/next-optimized-images

### Font support

By default Next.js doesn't support static assets like an Expo project. Because this is the intended functionality of Next.js, `@expo/next-adapter` doesn't add font support by default. If you want to use libraries like `expo-font`, `@expo/vector-icons`, or `react-native-vector-icons` you'll need to change a few things.

- Install the plugin - `yarn add next-fonts`
  - [`next-fonts`][next-fonts] injects a Webpack loader to handle fonts.
- Wrap the font method with the Expo method in your `next.config.js`:

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

<details><summary>Show Example</summary>
<p>

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
          // You can get this font on Github: https://shorturl.at/chEHS
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

</p>
</details>

[next-fonts]: https://github.com/rohanray/next-fonts

### Offline support

Unlike the default Expo for web workflow, Workbox and PWA are not supported out of the box. Here you can learn how to use the plugin [next-offline][next-offline] to get offline support in your Next.js + Expo app.

<details><summary>Instructions</summary>
<p>

- Install `next-offline` to emulate Expo PWA features: `yarn add next-offline`
- Configure your Next.js project to use `expo-notifications` in the browser:

  - We inject a custom service worker so we'll need to change what Workbox names their service worker (it must be `workbox-service-worker.js`).

  `next.config.js`

  ```js
  const withOffline = require('next-offline');
  const { withExpo } = require('@expo/next-adapter');

  // If you didn't install next-offline, then simply delete this method and the import.
  module.exports = withOffline({
    workboxOpts: {
      swDest: 'workbox-service-worker.js',

      /* changing any value means you'll have to copy over all the defaults  */
      /* next-offline */
      globPatterns: ['static/**/*'],
      globDirectory: '.',
      runtimeCaching: [
        {
          urlPattern: /^https?.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'offlineCache',
            expiration: {
              maxEntries: 200,
            },
          },
        },
      ],
    },
    ...withExpo({
      projectRoot: __dirname,
    }),
  });
  ```

- Copy the Expo service worker into your project's public folder: `mkdir public; cp node_modules/\@expo/next-adapter/service-worker.js public/service-worker.js`
- You can now test your project in production mode using the following: `yarn next build && yarn next export && serve -p 3000 ./out`

</p>
</details>

### Using a custom server

If you have a complex project that requires custom server control then you can extend the default server to control hosting.

<details><summary>Instructions</summary>
<p>

- Create a custom server to host your service worker:
  `server.js`

  ```js
  const { startServerAsync } = require('@expo/next-adapter');

  startServerAsync(__dirname, {
    /* port: 3000 */
  });
  ```

- Start your project with `node server.js`

### Handle server requests

You may want to intercept server requests, this will allow for that:

`server.js`

```js
const { createServerAsync } = require('@expo/next-adapter');
const { parse } = require('url');

createServerAsync(projectRoot, {
  handleRequest(req, res) {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // handle GET request to /cool-file.png
    if (pathname === '/cool-file.png') {
      const filePath = join(__dirname, '.next', pathname);

      app.serveStatic(req, res, filePath);
      // Return true to prevent the default handler
      return true;
    }
  },
}).then(({ server, app }) => {
  const port = 3000;

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

</p>
</details>

### Web push notifications support

With the regular `expo start:web` or `expo start --web` commands [web push notifications](../push-notifications/overview.md) are supported without any additional configuration. To get this same functionality working with Next.js you'll need to configure a few things.

<details><summary>Instructions</summary>
<p>

To use it with other services such as Vercel, you would need appropriate configuration to

- let `/service-worker.js` serve the file content of `/public/service-worker.js`, and
- let `/workbox-service-worker.js` serve the file content of a service worker, which be:
  - `/public/workbox-service-worker.js` (which will by default be a blank file) if you do not want to use any other service worker, or
  - `/_next/public/workbox-service-worker.js` if you are using [next-offline](https://github.com/hanford/next-offline), or
  - your own service worker file.

Here is an example `vercel.json` configuration file:

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/service-worker.js",
      "dest": "/public/service-worker.js",
      "headers": {
        "cache-control": "public, max-age=43200, immutable",
        "Service-Worker-Allowed": "/"
      }
    },
    // If you are using next-offline, change the object below according to their guide.
    {
      "src": "/workbox-service-worker.js",
      "dest": "/public/workbox-service-worker.js",
      "headers": {
        "cache-control": "public, max-age=43200, immutable",
        "Service-Worker-Allowed": "/"
      }
    }
  ]
}
```

</p>
</details>

## API

### CLI

Generate static Next.js files into your project.

#### ⚙️ CLI Options

For more information run `yarn next-expo --help` (or `-h`)

| Shortcut | Flag          | Description                                           |
| -------- | ------------- | ----------------------------------------------------- |
| `-f`     | `--force`     | Allows replacing existing files                       |
| `-c`     | `--customize` | Select template files you want to add to your project |
| `-V`     | `--version`   | output the version number                             |

### Babel

The adapter provides a Babel config [`@expo/next-adapter/babel`](https://github.com/expo/expo-cli/blob/master/packages/next-adapter/src/babel.ts) to simplify setup.

- Always use the universal [`babel-preset-expo`](https://github.com/expo/expo/tree/master/packages/babel-preset-expo)
  - Provides React Native support for all platforms that Expo supports (web, iOS, Android)
- When running in the browser, also use `next/babel` preset.

### Config

#### `withExpo`

Wraps your [`next.config.js`](https://nextjs.org/docs#custom-configuration) and adds universal platform support.

- Defines a custom `pageExtensions` which makes Webpack resolve `.web.js` before `.js`, we call this feature "platform extensions".
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

Next.js uses the `pages/_document.js` file to augment your app's `<html>` and `<body>` tags. Learn more [here](https://nextjs.org/docs#custom-document).

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

### Server

`@expo/next-adapter` provides you with a light-weight and easy to use `http` server for controlling how your project is hosted. The main reason for using this is to forward the requests for service workers to the static folder where Next.js expects them to be.

```js
import { createServerAsync, startServerAsync, handleRequest } from '@expo/next-adapter';
```

#### `startServerAsync`

- The easiest method for starting an HTTP server with Next.js support.
- Invokes `createServerAsync` with all of the defaults provided and starts listening.
  - `port: 3000`
- Returns all of the results `createServerAsync` (Next app, handle, and HTTP server)

```ts
function startServerAsync(
  projectRoot: string,
  {
    port,
  }?: {
    port?: number;
  }
): Promise<{
  app: App;
  handle: Function;
  server: Server;
}>;
```

#### `createServerAsync`

- Create an HTTP server and possibly a Next app, unless one is provided.
- Handle all requests internally, unless the `handleRequest` option is provided.
- Returns the Next.js app, handle (created with `app.getRequestHandler()`) and HTTP server.

```ts
function createServerAsync(
  projectRoot: string,
  {
    app,
    handleRequest,
  }: {
    app?: App;
    handleRequest?: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;
  }
): Promise<{
  app: App;
  handle: Function;
  server: Server;
}>;
```

#### `handleRequest`

- Use this if you want to completely skip Expo's server but still ensure that the service-workers are hosted in the Next.js static folder.

```ts
handleRequest(
  { projectRoot, app, handle }: {
    projectRoot: string;
    app: App;
    handle: Function;
}, req: IncomingMessage, res: ServerResponse): void;
```

## Limitations or differences comparing to the default Expo for Web

- Unlike the default Expo for Web, Workbox and PWA are not supported by default. Use Next.js plugins such as [next-offline](https://github.com/hanford/next-offline) instead. Learn more [here](https://nextjs.org/features/progressive-web-apps).
- You might need to use the [next-transpile-modules](https://github.com/martpie/next-transpile-modules) plugin to transpile certain third-party modules in order for them to work (such as Emotion). An easy but fragile way to do this is by defining the package name in your `app.json` under `expo.web.build.babel.include` (it's experimental because that's a really deeply nested object).
- Only the Next.js default page-based routing is supported. You'll need to use a completely different routing solution to do native navigation. We strongly recommend [react-navigation](https://reactnavigation.org/) for this.

## Contributing

If you would like to help make Next.js support in Expo better, please feel free to open a PR or submit an issue:

- [@expo/next-adapter][next-adapter]

If you have any problems rendering a certain component with SSR then you can submit fixes to the expo/expo repo:

- [Expo SDK packages][expo-packages]

Thanks so much 👋

<!-- Footer -->

## Learn more about Next.js

Learn more about how to use Next.js from their [docs](https://nextjs.org/docs).

[expo-packages]: https://github.com/expo/expo/tree/master/packages
[nextjs]: https://nextjs.org/
[next-adapter]: https://github.com/expo/expo-cli/tree/master/packages/next-adapter
[next-docs]: https://nextjs.org/docs
[custom-document]: https://nextjs.org/docs#custom-document
[next-offline]: https://github.com/hanford/next-offline
[next-pwa]: https://nextjs.org/features/progressive-web-apps
[next-transpile-modules]: https://github.com/martpie/next-transpile-modules
