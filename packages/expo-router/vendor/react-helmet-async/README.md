# react-helmet-async

[![CircleCI](https://circleci.com/gh/staylor/react-helmet-async.svg?style=svg)](https://circleci.com/gh/staylor/react-helmet-async)

[Announcement post on Times Open blog](https://open.nytimes.com/the-future-of-meta-tag-management-for-modern-react-development-ec26a7dc9183)

This package is a fork of [React Helmet Async](https://github.com/staylor/react-helmet-async), which is a fork of [React Helmet](https://github.com/nfl/react-helmet).
It's a version of React Helmet Async without the peer dependency to `react-dom`, [see this issue](https://github.com/staylor/react-helmet-async/pull/224).
`<Helmet>` usage is synonymous, but server and client now requires `<HelmetProvider>` to encapsulate state per request.

`react-helmet` relies on `react-side-effect`, which is not thread-safe. If you are doing anything asynchronous on the server, you need Helmet to encapsulate data on a per-request basis, this package does just that.

## Usage

**New is 1.0.0:** No more default export! `import { Helmet } from 'react-helmet-async'`

The main way that this package differs from `react-helmet` is that it requires using a Provider to encapsulate Helmet state for your React tree. If you use libraries like Redux or Apollo, you are already familiar with this paradigm:

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const app = (
  <HelmetProvider>
    <App>
      <Helmet>
        <title>Hello World</title>
        <link rel="canonical" href="https://www.tacobell.com/" />
      </Helmet>
      <h1>Hello World</h1>
    </App>
  </HelmetProvider>
);

ReactDOM.hydrate(
  app,
  document.getElementById(‘app’)
);
```

On the server, we will no longer use static methods to extract state. `react-side-effect`
exposed a `.rewind()` method, which Helmet used when calling `Helmet.renderStatic()`. Instead, we are going
to pass a `context` prop to `HelmetProvider`, which will hold our state specific to each request.

```javascript
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const helmetContext = {};

const app = (
  <HelmetProvider context={helmetContext}>
    <App>
      <Helmet>
        <title>Hello World</title>
        <link rel="canonical" href="https://www.tacobell.com/" />
      </Helmet>
      <h1>Hello World</h1>
    </App>
  </HelmetProvider>
);

const html = renderToString(app);

const { helmet } = helmetContext;

// helmet.title.toString() etc…
```

## Streams

This package only works with streaming if your `<head>` data is output outside of `renderToNodeStream()`.
This is possible if your data hydration method already parses your React tree. Example:

```javascript
import through from 'through';
import { renderToNodeStream } from 'react-dom/server';
import { getDataFromTree } from 'react-apollo';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import template from 'server/template';

const helmetContext = {};

const app = (
  <HelmetProvider context={helmetContext}>
    <App>
      <Helmet>
        <title>Hello World</title>
        <link rel="canonical" href="https://www.tacobell.com/" />
      </Helmet>
      <h1>Hello World</h1>
    </App>
  </HelmetProvider>
);

await getDataFromTree(app);

const [header, footer] = template({
  helmet: helmetContext.helmet,
});

res.status(200);
res.write(header);
renderToNodeStream(app)
  .pipe(
    through(
      function write(data) {
        this.queue(data);
      },
      function end() {
        this.queue(footer);
        this.queue(null);
      }
    )
  )
  .pipe(res);
```

## Usage in Jest
While testing in using jest, if there is a need to emulate SSR, the following string is required to have the test behave the way they are expected to.

```javascript
import { HelmetProvider } from 'react-helmet-async';

HelmetProvider.canUseDOM = false;
```

## Prioritizing tags for SEO

It is understood that in some cases for SEO, certain tags should appear earlier in the HEAD. Using the `prioritizeSeoTags` flag on any `<Helmet>` component allows the server render of react-helmet-async to expose a method for prioritizing relevant SEO tags.

In the component:
```javascript
<Helmet prioritizeSeoTags>
  <title>A fancy webpage</title>
  <link rel="notImportant" href="https://www.chipotle.com" />
  <meta name="whatever" value="notImportant" />
  <link rel="canonical" href="https://www.tacobell.com" />
  <meta property="og:title" content="A very important title"/>
</Helmet>
```

In your server template:

```javascript
<html>
  <head>
    ${helmet.title.toString()}
    ${helmet.priority.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.script.toString()}
  </head>
  ...
</html>
```

Will result in:

```html
<html>
  <head>
    <title>A fancy webpage</title>
    <meta property="og:title" content="A very important title"/>
    <link rel="canonical" href="https://www.tacobell.com" />
    <meta name="whatever" value="notImportant" />
    <link rel="notImportant" href="https://www.chipotle.com" />
  </head>
  ...
</html>
```

A list of prioritized tags and attributes can be found in [constants.js](./src/constants.js).

## Usage without Context
You can optionally use `<Helmet>` outside a context by manually creating a stateful `HelmetData` instance, and passing that stateful object to each `<Helmet>` instance:


```js
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Helmet, HelmetProvider, HelmetData } from 'react-helmet-async';

const helmetData = new HelmetData({});

const app = (
    <App>
      <Helmet helmetData={helmetData}>
        <title>Hello World</title>
        <link rel="canonical" href="https://www.tacobell.com/" />
      </Helmet>
      <h1>Hello World</h1>
    </App>
);

const html = renderToString(app);

const { helmet } = helmetData.context;
```

## License

Licensed under the Apache 2.0 License, Copyright © 2018 Scott Taylor
