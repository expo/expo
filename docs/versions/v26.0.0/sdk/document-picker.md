---
title: DocumentPicker
---

Provides access to the system's UI for selecting documents from the available providers on the user's device.

On iOS, for [standalone apps](../../distribution/building-standalone-apps/) and [ExpoKit](../../expokit/) projects, the DocumentPicker module requires the iCloud entitlement to work properly. You need to set the `usesIcloudStorage` key to `true` in your `app.json` file as specified [here](../../workflow/configuration/#ios).

In addition, for ExpoKit apps, you need to open the project in Xcode and follow the [Using DocumentPicker instructions](../../expokit/advanced-expokit-topics/#using-documentpicker) in the Advanced ExpoKit Topics guide.

### `Expo.DocumentPicker.getDocumentAsync(options)`

Display the system UI for choosing a document.

#### Arguments

-   **options (_object_)** --

      A map of options:

    -   **type (_string_)** -- The [MIME type](https://en.wikipedia.org/wiki/Media_type) of the documents that are available to be picked. Is also supports wildcards like `image/*` to choose any image. To allow any type of document you can use `*/*`. Defaults to `*/*`.

#### Returns

If the user cancelled the document picking, returns `{ type: 'cancel' }`.

Otherwise, returns `{ type: 'success', uri, name, size }` where `uri` is a URI to the local document file, `name` is its name and `size` is its size in bytes.
