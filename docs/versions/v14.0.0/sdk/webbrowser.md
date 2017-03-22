---
title: WebBrowser
---

Provides access to the system's web browser for redirections.

### `Exponent.WebBrowser.openBrowserAsync(url)`

Opens the url with the system's web browser.

#### Arguments

-   **url (_string_)** --

#### Returns

If the user closed the web browser, the promise resolves with `{ type: cancelled }`.
If the browser is closed using `Exponent.WebBrowser.dismissBrowser()`, the promise resolves with `{ type: dismissed }`.

### `Exponent.WebBrowser.dismissBrowser()`

Dismisses the system's presented web browser.

#### Returns
The promise resolves with `{ type: dismissed }`.
## Examples
###### Twitter login flow + Simple WebBrowser presentation
https://github.com/AppAndFlow/exponent-twitter-login-example

###### Auth0 login
https://github.com/AppAndFlow/exponent-auth0-example
