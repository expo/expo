---
title: WebBrowser
---

import SnackEmbed from '~/components/plugins/SnackEmbed';

Provides access to the system's web browser and supports handling redirects. On iOS, it uses `SFSafariViewController` or `SFAuthenticationSession`, depending on the method you call, and on Android it uses `ChromeCustomTabs`. As of iOS 11, `SFSafariViewController` no longer shares cookies with the Safari, so if you are using `WebBrowser` for authentication you will want to use `WebBrowser.openAuthSessionAsync`, and if you just want to open a webpage (such as your app privacy policy), then use `WebBrowser.openBrowserAsync`.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-web-browser).

## Usage

<SnackEmbed snackId="r116LYJne" />
<br />

### Handling deep links from the WebBrowser

If you are using the `WebBrowser` window for authentication or another use case where you would like to pass information back into your app through a deep link, be sure to add a handler with `Linking.addEventListener` before opening the browser. When the listener fires, you should call `WebBrowser.dismissBrowser()` -- it will not automatically dismiss when a deep link is handled. Aside from that, redirects from `WebBrowser` work the same as other deep links. [Read more about it in the Linking guide](../../workflow/linking/#handling-links-into-your-app).

## API

```js
// in managed apps:
import { WebBrowser } from 'expo';

// in bare apps:
import * as WebBrowser from 'expo-web-browser';
```

### `WebBrowser.openBrowserAsync(url)`

Opens the url with Safari in a modal on iOS using `SFSafariViewController`, and Chrome in a new [custom tab](https://developer.chrome.com/multidevice/android/customtabs) on Android. On iOS, the modal Safari will not share cookies with the system Safari. If you need this, use `WebBrowser.openAuthSessionAsync`.

#### Arguments

- **url (_string_)** -- The url to open in the web browser.
- **options (_object_)** (_optional_) --
  A dictionaty with following key-value pairs:

  - **toolbarColor (_optional_) (_string_)** -- color of the toolbar in either `#AARRGGBB` or `#RRGGBB` format.
  - **controlsColor (_optional_) (_string_)** -- _iOS Only_ tint color for controls in SKSafariViewController in `#AARRGGBB` or `#RRGGBB` format.
  - **collapseToolbar (_optional_) (_boolean_)** : a boolean determining whether the toolbar should be hiding when a user scrolls the website
  - **showTitle (_optional_) (_boolean_)** : (_Android only_) a boolean determining whether the browser should show the title of website on the toolbar
  - **package (_optional_) (_string_)** -- _Android only_. Package name of a browser to be used to handle Custom Tabs. List of available packages is to be queried by [getCustomTabsSupportingBrowsers](#WebBrowser.getCustomTabsSupportingBrowsers) method.

  Note that behavior customization options depend on the actual browser and its version. Some or all of the arguments may be ignored.

#### Returns

Returns a Promise:

- If the user closed the web browser, the Promise resolves with `{ type: 'cancel' }`.
- If the browser is closed using `WebBrowser.dismissBrowser()`, the Promise resolves with `{ type: 'dismiss' }`.

### `WebBrowser.openAuthSessionAsync(url, redirectUrl)`

Opens the url with Safari in a modal on iOS using `SFAuthenticationSession`. The user will be asked whether to allow the app to authenticate using the given url. Unavailable on Android.

#### Arguments

- **url (_string_)** -- The url to open in the web browser. This should be a login page.
- **redirectUrl (_string_)** -- **Optional**: the url to deep link back into your app. By default, this will be [Constants.linkingUrl](../constants/#expoconstantslinkinguri)

Returns a Promise:

- If the user does not permit the application to authenticate with the given url, the Promise resolved with `{ type: 'cancel' }`.
- If the user closed the web browser, the Promise resolves with `{ type: 'cancel' }`.
- If the browser is closed using `WebBrowser.dismissBrowser()`, the Promise resolves with `{ type: 'dismiss' }`.

### `WebBrowser.warmUp(package)`

_Android Only_

This method calls warmUp method on [CustomTabsClient](<https://developer.android.com/reference/android/support/customtabs/CustomTabsClient.html#warmup(long)>) for specified package.

#### Arguments

- **package (_string_)** -- **Optional** -- package of browser to be warmed up. If not set, preferred browser will be warmed.

#### Returns

The promise resolves with `{ type: warming, package: string }`

### `WebBrowser.mayInitWithUrl(url, package)`

_Andrdoi Only_

This mathod initiates (if needed) [CustomTabsSession](https://developer.android.com/reference/android/support/customtabs/CustomTabsSession.html#maylaunchurl) and calls its `mayLaunchUrl` method for browser specified by the package.

#### Arguments

- **url (_string_)** -- url of page that usert is expected to load
- **package (_string_)** -- **Optional** -- package of browser to be informed. If not set, preferred browser will be used.

#### Returns

### `WebBrowser.coolDown(package)`

_Andrdoi Only_

This methods removes all bindings to services created by warmUp or mayInitWithUrl. You should call this method once you don't need them to avoid potential memory leaks. However, those binding would be cleared once your application is destroyed, which might be sufficient in most cases.

#### Arguments

- **package (_string_)** -- **Optional** -- package of browser to be cooled. If not set, preferred browser will be used.

#### Returns

The promise resolves with `{ type: cooled }` when cooling is performed, or `{ type: Nothing to cool down }` when there was no connection to be dismissed.

### `WebBrowser.dismissBrowser()`

_iOS Only_

Dismisses the system's presented web browser.

#### Returns

The promise resolves with `{ type: 'dismiss' }`.

### `WebBrowser.getCustomTabsSupportingBrowsers`

_Android only_

Returns list of applications package names supporting Custom Tabs, Custom Tabs service, user chosen and preffered one. This may not be fully reliable, because ot follows `PackageManager.getResolvingActivities` behavior with its flaws. For example, some browsers might not be visible on packages list after other browser is set to dafult.

#### Returns

The promise resolves with `{ packages: string[], default: string, service: string[], preferred: string }`

- **packages (_string[]_)** : All packages recognized by PackageManager as capable of handling Custom Tabs. Empty array means there is no supporting browsers on device.
- **default (_string_)** : Default package chosen by user. Null if there is no such packages. Null usually means, that user will be prompted to choose from available packages.
- **services (_string[]_)** : All packages recognized by PackageManager as capable of handling Custom Tabs Service. This service is used by [warmUp](#WebBrowser.warmUp), [mayInitWithUrl](#WebBrowser.mayInitWithUrl() and [coolDown](#WebBrowser.coolDown).
- **preferred (_string_)** : Package preferred by CustomTabsClient to be used to handle Custom Tabs.

#
