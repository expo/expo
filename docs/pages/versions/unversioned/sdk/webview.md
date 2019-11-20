---
title: WebView
---

`WebView` renders web content in a native view.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-webview`. In bare apps, also follow the [react-native-webview linking and configuration instructions](https://github.com/react-native-community/react-native-webview/blob/master/docs/Getting-Started.md#react-native-webview-getting-started-guide).

## Usage

You should refer to the [react-native-webview docs](https://github.com/react-native-community/react-native-webview/blob/master/docs/Guide.md#react-native-webview-guide) for more information on the API and its usage. But the following example (courtesy of that repo) is a quick way to get up and running!

```javascript
import * as React from 'react';
import { WebView } from 'react-native-webview';

export default class App extends React.Component {
  render() {
    return <WebView source={{ uri: 'https://expo.io' }} style={{ marginTop: 20 }} />;
  }
}
```

Minimal example with inline HTML:

```javascript
import * as React from 'react';
import { WebView } from 'react-native-webview';

export default class App extends React.Component {
  render() {
    return (
      <WebView
        originWhitelist={['*']}
        source={{ html: '<h1>Hello world</h1>' }}
        style={{ marginTop: 20 }}
      />
    );
  }
}
```
