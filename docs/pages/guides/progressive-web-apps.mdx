---
title: Progressive web apps
description: Learn how to add progressive web app support to Expo websites.
---

import { FileTree } from '~/ui/components/FileTree';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';
import { Tab, Tabs, TabsGroup } from '~/ui/components/Tabs';

<TabsGroup>

A progressive web app (or PWA for short) is a website that can be installed on the user's device and used offline. We recommend building native apps whenever possible as they have the best offline support, but PWAs are a great option for desktop users.

## Favicons

Expo CLI automatically generates the **favicon.ico** file based on the `web.favicon` field in the **app.json**.

```json
{
  "web": {
    "favicon": "./assets/favicon.png"
  }
}
```

Alternatively, you can create a **favicon.ico** file in the **public** directory to manually specify the icon.

## Manifest file

PWAs can be [configured with a manifest file](https://developer.mozilla.org/en-US/docs/Web/Manifest) that describes the app's name, icon, and other metadata.

<Step label="1">

Create a PWA manifest in **public/manifest.json**:

```json
{
  "short_name": "Expo App",
  "name": "Expo Router Sample",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

</Step>

<Step label="2">

The files **logo192.png** and **logo512.png** are the icons that will be used when the app is installed on the user's device. These should be added to the **public** directory too.

<FileTree
  files={[
    ['public/manifest.json', 'PWA Manifest'],
    ['public/logo192.png', '192x192 icon'],
    ['public/logo512.png', '512x512 icon'],
  ]}
/>

</Step>

<Step label="3">

Now link the manifest in your HTML file. The method here depends on the output mode of your website (indicated in `web.output` in the **app.json**––defaults to `single`).

<Tabs>

<Tab label="single">

If you're using a single-page app, you can link the manifest in your HTML file by first creating a template HTML in **public/index.html**:

<Terminal
  cmd={['$ npx expo customize public/index.html']}
  cmdCopy="npx expo customize public/index.html"
/>

Then add the manifest to the `<head>` tag:

```html
<link rel="manifest" href="/manifest.json" />
```

</Tab>

<Tab label="static & server">

If you're using static or server rendering, the HTML entry can be dynamically created in **app/+html.tsx**. Here we'll link the manifest by adding a `<link>` tag to the `<head>` component:

```tsx app/+html.tsx
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Link the PWA manifest file. */}
        <link rel="manifest" href="/manifest.json" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

</Tab>

</Tabs>

</Step>

## Service workers

Service workers are primarily used to add offline support to websites. Google's Workbox is the best way to add service workers to a website. Follow the guide for [using Workbox CLI](https://developer.chrome.com/docs/workbox/modules/workbox-cli/), and wherever it refers to a "build script" use `npx expo export -p web` instead.

> **warning:** Be careful adding service workers as they are known to cause unexpected behavior on web. If you accidentally ship a service worker that aggressively caches your website, users cannot request updates easily. For the best offline mobile experience, create a native app with Expo. Unlike websites with service workers, native apps can be updated through the app store to clear the cached experience. This would be similar to resetting the user's native browser (which they may have to do if the service worker is aggressive enough). See [why service workers are suboptimal](https://github.com/facebook/create-react-app/issues/2398) for more information.

For example, here's a possible flow for setting up Workbox:

<Step label="1">

Create a new project with the following command:

<Terminal
  cmd={['$ npm create expo -t tabs my-app', '', '$ cd my-app']}
  cmdCopy="npm create expo -t tabs my-app && cd my-app"
/>

</Step>

<Step label="2">

Now register the service worker in the HTML file. The method here depends on the output mode of your website (indicated in `web.output` in the **app.json**––defaults to `single`).

<Tabs>

<Tab label="single">

Next add a service worker registration script to the root **index.html**.

First create a template HTML in **public/index.html** if one does not already exist:

<Terminal
  cmd={['$ npx expo customize public/index.html']}
  cmdCopy="npx expo customize public/index.html"
/>

Then create the service worker registration script in the `<head>` tag:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
</script>
```

</Tab>

<Tab label="static & server">

Next, create a root HTML file for the app and add the service worker registration script:

```tsx app/+html.tsx
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Bootstrap the service worker. */}
        <script dangerouslySetInnerHTML={{ __html: sw }} />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const sw = `
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    });
}
`;
```

</Tab>

</Tabs>

</Step>

<Step label="3">

Now build the website before running the wizard:

<Terminal cmd={['$ npx expo export -p web']} />

</Step>

<Step label="4">

Run the wizard command, selecting `dist` as the root of the app, and the defaults for everything else...

<Terminal
  cmd={[
    '$ npx workbox-cli wizard',
    '',
    '? What is the root of your web app (that is which directory do you deploy)? dist/',
    '? Which file types would you like to precache? js, html, ttf, ico, json',
    '? Where would you like your service worker file to be saved? dist/sw.js',
    '? Where would you like to save these configuration options? workbox-config.js',
    "? Does your web app manifest include search parameter(s) in the 'start_url', other than 'utm_' or 'fbclid' (like '?source=pwa')? No",
  ]}
/>

</Step>

<Step label="5">

Finally, run `npx workbox-cli generateSW workbox-config.js` to generate the service worker config.

Going forward, you can add a build script in **package.json** to run both scripts in the correct order:

```json package.json
{
  "scripts": {
    "build:web": "expo export -p web && npx workbox-cli generateSW workbox-config.js"
  }
}
```

</Step>

<Step label="6">

If you host your website and visit with Chrome, you can inspect the service worker by going to **Application > Service Workers** in the Chrome dev tools.

</Step>

</TabsGroup>
