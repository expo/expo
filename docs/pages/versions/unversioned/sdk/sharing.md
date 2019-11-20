---
title: Sharing
---

This module allows sharing files.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-sharing`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-sharing).

## API

```js
import * as Sharing from 'expo-sharing';
```

### `Sharing.shareAsync(url, options)`

Opens action sheet to share file to different applications which can handle this type of file.

#### Arguments

- **url (_string_)** -- Local file URL to share.
- **options (_object_)** --

  A map of options:

  - **mimeType (_string_)** -- sets `mimeType` for `Intent` (**Android only**)
  - **dialogTitle (_string_)** -- sets share dialog title (**Android and Web only**)
  - **UTI (_string_)** -- ([Uniform Type Identifier](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/understanding_utis/understand_utis_conc/understand_utis_conc.html)) the type of the target file (**iOS only**)
