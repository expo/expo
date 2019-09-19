---
title: Using Next.js with Expo for Web
---

[Next.js](https://nextjs.org/) is a React framework that provides simple page-based routing as well as server-side rendering.

> Warning: Support for Next.js is experimental. Please open an issue at https://github.com/expo/expo-cli/ if you encountered any problem.

## Using Next.js to your Expo for Web project

### Install and configure Next.js

- Follow the [Running in the Browser](../../guides/running-in-the-browser) guide to add web support to your Expo project.
- In your project, install Next.js: `npm i next --save`. (You may also have to run `npm i @babel/plugin-proposal-decorators --save-dev` due to an incompatibility.)
- You will also need to add `expo-cli` as one of the `devDependencies` (`npm i expo-cli --save-dev`) if you want to build the project on a service such as [ZEIT Now](https://zeit.co/now).
- Open `app.json` and set `expo.web.use` to `"nextjs"`:

```json
{
  "expo": {
    "web": {
      "use": "nextjs"
    }
  }
}
```

- Since Next.js use page-based routing, your homepage will be `pages/index.js`, which is different from Expo project's main file (which is by default `App.js`). To support both native (mobile) app and Next.js, you could set `App.js` to:

```javascript
import Index from './pages/index';
export default Index;
```

- You could also add more logic in `App.js` such as `createStackNavigator`. Note that it will only be used by your native app since Next.js directly uses files under the `pages/` folder.

```javascript
import index from './pages/index';
import about from './pages/about';
import { createStackNavigator, createAppContainer } from 'react-navigation';
const AppNavigator = createStackNavigator(
  {
    index,
    about,
  },
  {
    initialRouteName: 'index',
  }
);

const AppContainer = createAppContainer(AppNavigator);
export default AppContainer;
```

- To start your project, run `expo start --web`.

### Build and publish your website

To build your website, run:

```bash
expo build:web
```

If you wish to use services such as [ZEIT Now](https://zeit.co/now) to host your website, you should ask the service to run `expo build:web`.

For [ZEIT Now](https://zeit.co/now) specifically, you could simply set `scripts.build` and `scripts.now-build` to `"expo build:web"` in your `package.json` file. Then run `now` to publish. Learn more [here](https://zeit.co/guides/upgrade-to-zero-configuration#frameworks-with-zero-configuration).

```json
{
  "scripts": {
    "build": "expo build:web",
    "now-build": "expo build:web"
  }
}
```

You also export the website as static files by running the following commands. Learn more [here](https://nextjs.org/features/static-exporting).

```
expo build:web
yarn next export
```

### Web push notifications support

With `expo start`, [web push notifications](../../guides/push-notifications) are supported without any additional configuration.

To use it with other services such as ZEIT Now, you would need appropriate configuration to
- let `/expo-service-worker.js` serve the file content of `/static/expo-service-worker.js`, and
- let `/service-worker.js` serve the file content of a service worker, which be:
  - `/static/service-worker.js` (which will by default be a blank file) if you do not want to use any other service worker, or
  - `/_next/static/service-worker.js` if you are using [next-offline](https://github.com/hanford/next-offline), or
  - your own service worker file.

Here is an example `now.json` configuration file:

```jsonc
{
  "version": 2,
  "routes": [
    {
      "src": "/expo-service-worker.js",
      "dest": "/static/expo-service-worker.js",
      "headers": {
        "cache-control": "public, max-age=43200, immutable",
        "Service-Worker-Allowed": "/"
      }
    },
    // If you are using next-offline, change the object below according to their guide.
    {
      "src": "/service-worker.js",
      "dest": "/static/service-worker.js",
      "headers": {
        "cache-control": "public, max-age=43200, immutable",
        "Service-Worker-Allowed": "/"
      }
    }
  ]
}
```

If you are using next-offline, you should also set `dontAutoRegisterSw` to `true` (`withOffline({ dontAutoRegisterSw: true })`) since Expo is handling the service worker registration.

### Customizing `pages/_document.js`

Next.js uses the `pages/_document.js` file to augment your app's `<html>` and `<body>` tags. Learn more [here](https://nextjs.org/docs#custom-document).

By default, Expo creates a `pages/_document.js` file for you (which `import` the `.expo/next_document.js` file controlled by Expo) that contains proper layout for your app (and possibility more features such as web push notifications in the future). If you choose to customize the `_document.js` file, we encourage you to copy `.expo/next_document.js` as a starter and check if `.expo/next_document.js` has any update periodically. (You could also try to `export default class MyDocument extends ExpoDocument`, but we do not promise that this will work for every case.)

## Limitations or differences comparing to the default Expo for Web

- Unlike the default Expo for Web, Workbox and PWA are not supported by default. Use Next.js plugins such as [next-offline](https://github.com/hanford/next-offline) instead. Learn more [here](https://nextjs.org/features/progressive-web-apps).
- In the production mode (`--no-dev`), reload is not supported. You have to restart (i.e., run `expo start --no-dev --web` again) to rebuild the page.
- You might need to use the [next-transpile-modules](https://github.com/martpie/next-transpile-modules) plugin to transpile certain third-party modules in order for them to work (such as Emotion).
- Only the Next.js default page-based routing is supported.

## Learn more about Next.js

Learn more about how to use Next.js from their [docs](https://nextjs.org/docs).
