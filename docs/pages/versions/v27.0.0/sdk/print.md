---
title: Print
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

An API for iOS (AirPrint) and Android printing functionality.

This API is available under the `DangerZone` namespace for the time being.

### `Expo.DangerZone.Print.printAsync(options)`

Print a document or HTML.

#### Arguments

-   **options : `object`** -- A map defining what should be printed:
    
    -   **uri : `string`** -- URI of a PDF file to print. Remote or local (ex. selected via `DocumentPicker`). This only supports PDF, not other types of document (e.g. images).
    
    -   **html : `string`** -- HTML string to print.
    
    -   **printerUrl : `string`** -- iOS only. URL of the printer to use. Returned from `selectPrinterAsync`.

#### Returns

-   Resolves to an empty promise if printing started.

### `Expo.DangerZone.Print.selectPrinterAsync()`

iOS only. Choose a printer that can be later use in `printAsync`.

#### Returns

-   Resolvses to an object containing `name` and `url` of the selected printer.