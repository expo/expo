---
title: Static Rendering
description: Learn how to render routes to static HTML and CSS files with Expo Router.
---

import { APIBox } from '~/components/plugins/APIBox';
import { FileTree } from '~/ui/components/FileTree';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';
import { Tabs, Tab } from '~/ui/components/Tabs';

To enable Search Engine Optimization (SEO) on the web you must statically render your app. This guide will walk you through the process of statically rendering your Expo Router app.

## Setup

<Step label="1">

Enable metro bundler and static rendering in the project's [app config](/versions/latest/config/app/):

```json app.json
{
  "expo": {
    /* @hide ... */
    /* @end */
    "web": {
      /* @info Static rendering is only supported with Metro bundler and Expo Router */
      "bundler": "metro",
      /* @end */
      "output": "static"
    }
  }
}
```

</Step>

<Step label="2">

If you have a **metro.config.js** file in your project, ensure it extends **expo/metro-config** as shown below:

```js metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Additional features...
});

module.exports = config;
```

You can also learn more about [customizing Metro](/guides/customizing-metro/) .

</Step>

<Step label="3">
Ensure Fast Refresh is configured.

<Tabs>

<Tab label="Expo Router v3">

Expo Router requires at least `react-refresh@0.14.0`. This is available in SDK 50 and above. Ensure you **do not** have any overrides or resolutions for `react-refresh` in your **package.json**.

</Tab>

<Tab label="Expo Router v2">

Expo Router requires at least `react-refresh@0.14.0`. React Native hasn't upgraded as of SDK 49 and Expo Router v2, so you need to force upgrade your `react-refresh` version by setting a Yarn resolution or npm override.

<Tabs>

<Tab label="npm">

```json package.json
{
  /* @hide ... */
  /* @end */
  "overrides": {
    "react-refresh": "~0.14.0"
  }
}
```

</Tab>

<Tab label="Yarn">

```json package.json
{
  /* @hide ... */
  /* @end */
  "resolutions": {
    "react-refresh": "~0.14.0"
  }
}
```

</Tab>

</Tabs>

</Tab>

</Tabs>

</Step>

<Step label="4">

Start the development server:

<Terminal cmd={['$ npx expo start']} />

</Step>

## Production

To bundle your static website for production, run the universal export command:

<Terminal cmd={['$ npx expo export --platform web']} />

This will create a **dist** directory with your statically rendered website. If you have files in a local **public** directory, these will be copied over as well.
You can test the production build locally by running the following command and opening the linked URL in your browser:

<Terminal cmd={['$ npx serve dist']} />

This project can be deployed to almost every hosting service. Note that this is not a single-page application, nor does it contain a custom server API. This means dynamic routes (**app/[id].tsx**) will not arbitrarily work. You may need to build a serverless function to handle dynamic routes.

## Dynamic Routes

The `static` output will generate HTML files for each route. This means dynamic routes (**app/[id].tsx**) will not work out of the box. You can generate known routes ahead of time using the `generateStaticParams` function.

```tsx app/blog/[id].tsx
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

/* @info This method is run in a Node.js environment at build-time. */
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  /* @end */
  const posts = await getPosts();
  // Return an array of params to generate static HTML files for.
  // Each entry in the array will be a new page.
  return posts.map(post => ({ id: post.id }));
}

export default function Page() {
  const { id } = useLocalSearchParams();

  return <Text>Post {id}</Text>;
}
```

This will output a file for each post in the **dist** directory. For example, if the `generateStaticParams` method returned `[{ id: "alpha" }, { id: "beta" }]`, the following files would be generated:

<FileTree files={['dist/blog/alpha.html', 'dist/blog/beta.html']} />

<APIBox header="generateStaticParams">

A server-only function evaluated at build-time in a Node.js environment by Expo CLI. This means it has access to `__dirname`, `process.cwd()`, `process.env`, and more. It also has access to every environment variable that's available in the process. However, the values prefixed with `EXPO_PUBLIC_.generateStaticParams` do not run in a browser environment, so it cannot access browser APIs such as `localStorage` or `document`. It also cannot access native Expo APIs such as `expo-camera` or `expo-location`.

```tsx app/[id].tsx
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  /* @info Prints the current working directory */
  console.log(process.cwd());
  /* @end */

  return [];
}
```

`generateStaticParams` cascades from nested parents down to children. The cascading parameters are passed to every dynamic child route that exports **generateStaticParams**.

```tsx app/[id]/_layout.tsx
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  /* @info Any dynamic children that export <CODE>generateStaticParams</CODE> will be invoked once for every entry in the array. */
  return [{ id: 'one' }, { id: 'two' }];
  /* @end */
}
```

Now the dynamic child routes will be invoked twice, once with `{ id: 'one' }` and once with `{ id: 'two' }`. All variations must be accounted for.

```tsx app/[id]/[comment].tsx
export async function generateStaticParams(params: {
  id: 'one' | 'two';
}): Promise<Record<string, string>[]> {
  const comments = await getComments(params.id);
  return comments.map(comment => ({
    /* @info Ensure the parent properties are passed down too. */
    ...params,
    /* @end */
    comment: comment.id,
  }));
}
```

</APIBox>

### Read files using `process.cwd()`

Since Expo Router compiles your code into a separate directory you cannot use `__dirname` to form a path as its value will be different than expected.

Instead, use `process.cwd()`, which gives you the directory where the project is being compiled.

```tsx app/[category].tsx
import fs from 'fs/promises';
import path from 'path';

export async function generateStaticParams(params: {
  id: string;
}): Promise<Record<string, string>[]> {
  const directory = await fs.readdir(path.join(process.cwd(), './posts/', category));
  const posts = directory.filter(fileOrSubDirectory => return path.extname(fileOrSubDirectory) === '.md')

  return {
    id,
    posts,
  };
}
```

## Root HTML

By default, every page is wrapped with some small HTML boilerplate, this is known as the **root HTML**.

You can customize the root HTML file by creating an **app/+html.tsx** file in your project. This file exports a React component that only ever runs in Node.js, which means global CSS cannot be imported inside of it. The component will wrap all routes in the **app** directory. This is useful for adding global `<head>` elements or disabling body scrolling.

> **Note**: Global context providers should go in the [Root Layout](/router/advanced/root-layout) component, not the Root HTML component.

```tsx app/+html.tsx
import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

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

- The `children` prop comes with the root `<div id="root" />` tag included inside.
- The JavaScript scripts are appended after the static render.
- React Native web styles are statically injected automatically.
- Global CSS should not be imported into this file. Instead, use the [Root Layout](/router/advanced/root-layout) component.
- Browser APIs like `window.location` are unavailable in this component as it only runs in Node.js during static rendering.

### `expo-router/html`

The exports from `expo-router/html` are related to the Root HTML component.

- `ScrollViewStyleReset`: Root style-reset for full-screen [React Native web apps](https://necolas.github.io/react-native-web/docs/setup/#root-element) with a root `<ScrollView />` should use the following styles to ensure native parity.

## Meta tags

You can add meta tags to your pages with the `<Head />` module from `expo-router`:

```tsx app/about.tsx
import Head from 'expo-router/head';
import { Text } from 'react-native';

export default function Page() {
  return (
    <>
      <Head>
        <title>My Blog Website</title>
        <meta name="description" content="This is my blog." />
      </Head>
      <Text>About my blog</Text>
    </>
  );
}
```

The head elements can be updated dynamically using the same API. However, it's useful for SEO to have static head elements rendered ahead of time.

## Static Files

Expo CLI supports a root **public** directory that gets copied to the **dist** folder during static rendering. This is useful for adding static files like images, fonts, and other assets.

<FileTree
  files={['public/favicon.ico', 'public/logo.png', 'public/.well-known/apple-app-site-association']}
/>

These files will be copied to the **dist** folder during static rendering:

<FileTree
  files={[
    'dist/index.html',
    'dist/favicon.ico',
    'dist/logo.png',
    'dist/.well-known/apple-app-site-association',
    'dist/_expo/static/js/index-xxx.js',
    'dist/_expo/static/css/index-xxx.css',
  ]}
/>

> **info** **Web only**: Static assets can be accessed in runtime code using relative paths. For example, the **logo.png** can be accessed at `/logo.png`:

```tsx app/index.tsx
import { Image } from 'react-native';

export default function Page() {
  return <Image source={{ uri: '/logo.png' }} />;
}
```

## Fonts

> Font optimization is available in SDK 50 and above.

Expo Font has automatic static optimization for font loading in Expo Router. When you load a font with `expo-font`, Expo CLI will automatically extract the font resource and embed it in the page's HTML, enabling preloading, faster hydration, and reduced layout shift.

The following snippet will load Inter into the namespace and statically optimize on web:

```tsx app/home.tsx
import { Text } from 'react-native';
import { useFonts } from 'expo-font';

export default function App() {
  /* @info Expo CLI automatically finds and extracts this font during compilation. */
  const [isLoaded] = useFonts({
    /* @end */
    inter: require('@/assets/inter.ttf'),
  });

  /* @info Always true on web with static rendering enabled. */
  if (!isLoaded) {
    /* @end */
    return null;
  }

  return <Text style={{ fontFamily: 'inter' }}>Hello Universe</Text>;
}
```

This generates the following static HTML:

```html dist/home.html
/* @info preload the font before the JavaScript loads. */
<link rel="preload" href="/assets/inter.ttf" as="font" crossorigin />
/* @end */
<style id="expo-generated-fonts" type="text/css">
  @font-face {
    font-family: inter;
    src: url(/assets/inter.ttf);
    font-display: auto;
  }
</style>
```

- Static font optimization requires the font to be loaded synchronously. If the font isn't statically optimized, it could be because it was loaded inside a `useEffect`, deferred component, or async function.
- Static optimization is only supported with `Font.loadAsync` and `Font.useFonts` from `expo-font`. Wrapper functions are supported as long as the wrappers are synchronous.

## FAQ

### How do I add a custom server?

There is no prescriptive way to add a custom server. You can use any server you want. However, you will need to handle dynamic routes yourself. You can use the `generateStaticParams` function to generate static HTML files for known routes.

In the future, there will be a server API, and a new `web.output` mode which will generate a project that will (amongst other things) support dynamic routes.

## Server-side Rendering

Rendering at request-time (SSR) is not supported in `web.output: 'static'`. This will likely be added in a future version of Expo Router.

### Where can I deploy statically rendered websites?

You can deploy your statically rendered website to any static hosting service. Here are some popular options:

- [Netlify](https://www.netlify.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [AWS Amplify](https://aws.amazon.com/amplify/)
- [Vercel](https://vercel.com/)
- [GitHub Pages](https://pages.github.com/)
- [Render](https://render.com/)
- [Surge](https://surge.sh/)

> **Note:** You don't need to add Single-Page Application styled redirects to your static hosting service. The static website is not a single-page application. It is a collection of static HTML files.
