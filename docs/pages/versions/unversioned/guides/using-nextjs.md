---
title: Using Next.js with Expo for Web
---

[Next.js](https://nextjs.org/) is a React framework that provides page-based simple client-side routing as well as server-side rendering.

> Warning: Supports for Next.js is experimental.

## Using Next.js to your Expo for Web project

### Install and configure Next.js

- Follow the [Running in the Browser](../../introduction/running-in-the-browser) guide to add web support to your Expo project.
- In your project, install Next.js: `npm i next --save`. (You may also have to run `npm i @babel/plugin-proposal-decorators --save-dev` due to an incompatibility.)
- You will also need to add `expo-cli` as one of the `devDependencies` (`npm i expo-cli --save-dev`) if you want to build the project on a service such as [ZEIT Now](https://zeit.co/now).
- Open `app.json` and set `web.use` to `"nextjs"`:

```json
{
  "expo": {
    "web": {
      "use": "nextjs"
    }
  }
```

- Since Next.js use page-based routing, your homepage will be `pages/index.js`, which is different from Expo project's main file (which is by default `App.js`). To support both mobile and Next.js, you could set `App.js` to:

```javascript
import Index from './pages/index';
export default Index;
```

- You could also add more logic in `App.js` such as `createStackNavigator` that will only be used by the native app.

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

### Build and publish your website

To build your website, run:

```bash
expo build:web
```

If you with to use services such as [ZEIT Now](https://zeit.co/now) to host your website, you should ask the service to run `expo build:web`.

For [ZEIT Now](https://zeit.co/now) specifically, you could simply add `scripts.build` to your `package.json` file. Learn more [here](https://zeit.co/guides/upgrade-to-zero-configuration#frameworks-with-zero-configuration).

```json
{
  "scripts": {
    "build": "expo build:web"
  }
}
```

## Limitations comparing to the default Expo for Web config

- Unlike the default Expo for Web config, Workbox and PWA is not supported by default. Use Next.js plugins such as [next-offline](https://github.com/hanford/next-offline) instead. Learn more [here](https://nextjs.org/features/progressive-web-apps).
- In the production mode (`--no-dev`), reload is not supported. You have to restart (i.e., run `expo start --no-dev --web` again) to rebuild the page.
- You might need to use the [next-transpile-modules](https://github.com/martpie/next-transpile-modules) plugin to transpile certain third-party modules in order for them to work (such as Emotion).
- `next export` is not yet supported.
- Only default page-based routing is currently supported.

## Learn more about Next.js

Learn more about how to use Next.js from their [docs](https://nextjs.org/docs).
