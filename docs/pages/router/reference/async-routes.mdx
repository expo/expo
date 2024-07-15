---
title: Async routes
description: Learn how to speed up development with async bundling in Expo Router.
---

import { ContentSpotlight } from '~/ui/components/ContentSpotlight';
import { Terminal } from '~/ui/components/Snippet';
import { Tabs, Tab } from '~/ui/components/Tabs';

> **warning** Async routes is an experimental feature.

<ContentSpotlight file="expo-router/async-routes.mp4" loop={false} />

Expo Router can automatically split your JavaScript bundle based on the route files using [React Suspense](https://react.dev/reference/react/Suspense). This enables faster development as only the routes you navigate to will be bundled or loaded into memory. This can also be useful for reducing the initial bundle size for your application.

Apps using the Hermes Engine will not benefit as much from bundle splitting as the bytecode is already memory mapped ahead of time. However, it will improve your over-the-air updates, React Server Components, and web support.

> When bundling for production **on native platforms**, all suspense boundaries **will be disabled** and there will be no loading states.

## How it works

All Routes are wrapped inside a suspense boundary and are loaded asynchronously. This means that the first time you navigate to a route, it will take a little longer to load. However, once it is loaded, it will be cached and subsequent visits will be instant.

{/* The [Suspense fallback](https://react.dev/reference/react/Suspense#displaying-a-fallback-while-content-is-loading) or loading state **cannot be customized** at this time. We plan to add support in the future via a **route+loading.js** file. */}

Loading errors are handled in the parent route, via the [`ErrorBoundary`](/router/error-handling/#errorboundary) export.

Async routes cannot be statically analyzed during development, so all files will be treated as routes even if they don't export a default component. After the component is bundled and loaded, any invalid route will use a fallback warning screen.

For those familiar with advanced bundling techniques, the async routes feature is composed of [React Suspense](https://react.dev/docs/concurrent-mode-suspense), [route-based bundle splitting](https://legacy.reactjs.org/docs/code-splitting.html#route-based-code-splitting) and [lazy bundling](https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0605-lazy-bundling.md) (in development).

## Setup

Enable the feature by setting the `asyncRoutes` option in the Expo Router config plugin of your [app config](/versions/latest/config/app/):

<Tabs>

<Tab label="SDK 50 and above">

    > SDK 50 and above supports production bundle splitting. Set `asyncRoutes` to `true` to enable it.

    ```json app.json
    {
      "expo": {
        "plugins": [
          [
            "expo-router",
            {
              "origin": "https://acme.com",
              "asyncRoutes": {
                "web": true,
                "default": "development"
              }
            }
          ]
        ]
      }
    }
    ```

</Tab>

<Tab label="SDK 49">

    ```json app.json
    {
      "expo": {
        "plugins": [
          [
            "expo-router",
            {
              "origin": "https://acme.com",
              "asyncRoutes": "development"
            }
          ]
        ]
      }
    }
    ```

</Tab>

</Tabs>

You can set platform-specific settings (`default`, `android`, `ios` or `web`) for `asyncRoutes` using an object:

```json app.json
{
  "expo": {
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://acme.com",
          "asyncRoutes": {
            "web": true,
            "android": false,
            "default": "development"
          }
        }
      ]
    ]
  }
}
```

Then, when you are about to start your project, you can use the `--clear` flag to clear the Metro cache. This will ensure that the routes are loaded asynchronously:

<Terminal
  cmd={['$ npx expo start --clear', '', '# Or when exporting', '$ npx expo export --clear']}
/>

## Static rendering

> Bundle splitting with static rendering is only supported in SDK 50 and above.

Static rendering is supported in production web apps by rendering all Suspense boundaries synchronously in Node.js, then linking all of async chunks together in the HTML based on all the selected routes for a given HTML file. This ensures you don't encounter a waterfall of loading states on server navigations. Subsequent navigations will recursively load any missing chunks.

To ensure a consistent first render, all layout routes leading up to the leaf route for a URL will be included in the initial server response.

All initial routes, defined with `unstable_settings = { initialRouteName: '...' }` will be included in the initial HTML file as they are required for the first render. For example, if the server request is for a modal, the screen rendered under the modal will also be included to ensure the modal is rendered correctly.

## Caveats

Async Routes represents an early preview of how we plan to support [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components) in the future. As such, there are some caveats to be aware of:

- Async Routes do not support native production apps yet.
- In development, the runtime JavaScript is lazily bundled so you may encounter cases where the HTML doesn't match the available JavaScript.
- The loading state cannot be customized at this time.
