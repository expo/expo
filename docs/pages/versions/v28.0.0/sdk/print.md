---
title: Print
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

An API for iOS (AirPrint) and Android printing functionality.

### `Expo.Print.printAsync(options)`

Prints a document or HTML.

#### Arguments

-   **options : `object`** -- A map defining what should be printed:
    -   **uri : `string`** -- URI of a PDF file to print. Remote, local (ex. selected via `DocumentPicker`) or base64 data URI starting with `data:application/pdf;base64,`. This only supports PDF, not other types of document (e.g. images).
    -   **html : `string`** -- HTML string to print.
    -   **width : `number`** -- Width of the single page in pixels. Defaults to `612` which is a width of US Letter paper format with 72 PPI. **Available only with `html` option.**
    -   **height : `number`** -- Height of the single page in pixels. Defaults to `792` which is a height of US Letter paper format with 72 PPI. **Available only with `html` option.**
    -   **markupFormatterIOS : `string`** -- **Available on iOS only.** Alternative to `html` option that uses [UIMarkupTextPrintFormatter](https://developer.apple.com/documentation/uikit/uimarkuptextprintformatter) instead of WebView. Might be removed in the future releases.
    -   **printerUrl : `string`** -- **Available on iOS only.** URL of the printer to use. Returned from `selectPrinterAsync`.
    -   **orientation : `string`** -- **Available on iOS only.** The orientation of the printed content, `Print.Orientation.portrait` or `Print.Orientation.landscape`.

#### Returns

-   Resolves to an empty promise if printing started.

### `Expo.Print.printToFileAsync(options)`

Prints HTML to PDF file and saves it to [app's cache directory](../filesystem/#expofilesystemcachedirectory).

#### Arguments

-   **options : `object`** -- A map of options:
    -   **html : `string`** -- HTML string to print into PDF file.
    -   **width : `number`** -- Width of the single page in pixels. Defaults to `612` which is a width of US Letter paper format with 72 PPI.
    -   **height : `number`** -- Height of the single page in pixels. Defaults to `792` which is a height of US Letter paper format with 72 PPI.
    -   **base64 : `boolean`** -- Whether to include base64 encoded string of the file in the returned object.

#### Returns

-   Resolves to an object with following keys:
    -   **uri : `string`** -- A URI to the printed PDF file.
    -   **numberOfPages : `number`** -- Number of pages that were needed to render given content.
    -   **base64 : `string`** -- Base64 encoded string containing the data of the PDF file. **Available only if `base64` option is truthy.** It doesn't include data URI prefix `data:application/pdf;base64,`.

### `Expo.Print.selectPrinterAsync()`

**Available on iOS only.** Chooses a printer that can be later used in `printAsync`.

#### Returns

-   Resolves to an object containing `name` and `url` of the selected printer.

## Page margins

If you're using `html` option in `printAsync` or `printToFileAsync`, the resulting print might contain page margins (it depends on WebView engine).
They are set by `@page` style block and you can override them in your HTML code:

```html
<style>
  @page {
    margin: 20px;
  }
</style>
```

See [@page docs on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@page) for more details.