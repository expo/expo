---
title: WebBrowser
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';
import SnackEmbed from '~/components/plugins/SnackEmbed';

export default withDocumentationElements(meta);

Provides access to the system's web browser and supports handling redirects. On iOS, it uses `SFSafariViewController` or `SFAuthenticationSession`, depending on the method you call, and on Android it uses `ChromeCustomTabs`. As of iOS 11, `SFSafariViewController` no longer shares cookies with the Safari, so if you are using `WebBrowser` for authentication you will want to use `WebBrowser.openAuthSessionAsync`, and if you just want to open a webpage (such as your app privacy policy), then use `WebBrowser.openBrowserAsync`.

<SnackEmbed snackId="r116LYJne" />
<br />

#### Handling deep links from the WebBrowser

If you are using the `WebBrowser` window for authentication or another use case where you would like to pass information back into your app through a deep link, be sure to add a handler with `Linking.addEventListener` before opening the browser. When the listener fires, you should call `WebBrowser.dismissBrowser()` -- it will not automatically dismiss when a deep link is handled. Aside from that, redirects from `WebBrowser` work the same as other deep links. [Read more about it in the Linking guide](../../workflow/linking/#handling-links-into-your-app).

## `Expo.WebBrowser`

### `Expo.WebBrowser.openBrowserAsync(url)`

Opens the url with Safari in a modal on iOS using `SFSafariViewController`, and Chrome in a new [custom tab](https://developer.chrome.com/multidevice/android/customtabs) on Android. On iOS, the modal Safari will not share cookies with the system Safari. If you need this, use `WebBrowser.openAuthSessionAsync`.

#### Arguments

- **url : `string`** -- The url to open in the web browser.

#### Returns

Returns a Promise:

- If the user closed the web browser, the Promise resolves with `{ type: 'cancel' }`.
- If the browser is closed using `Expo.WebBrowser.dismissBrowser()`, the Promise resolves with `{ type: 'dismiss' }`.

### `Expo.WebBrowser.openAuthSessionAsync(url, redirectUrl)`

Opens the url with Safari in a modal on iOS using `SFAuthenticationSession`, and Chrome in a new [custom tab](https://developer.chrome.com/multidevice/android/customtabs) on Android. On iOS, the user will be asked whether to allow the app to authenticate using
the given url.

#### Arguments

- **url : `string`** -- The url to open in the web browser. This should be a login page.
- **redirectUrl : `string`** -- **Optional**: the url to deep link back into your app. By default, this will be [Expo.Constants.linkingUrl](../constants/#expoconstantslinkinguri)

Returns a Promise:

- If the user does not permit the application to authenticate with the given url, the Promise resolved with `{ type: 'cancel' }`.
- If the user closed the web browser, the Promise resolves with `{ type: 'cancel' }`.
- If the browser is closed using `Expo.WebBrowser.dismissBrowser()`, the Promise resolves with `{ type: 'dismiss' }`.

### `Expo.WebBrowser.dismissBrowser()`

Dismisses the system's presented web browser.

#### Returns

The promise resolves with `{ type: 'dismiss' }`.
