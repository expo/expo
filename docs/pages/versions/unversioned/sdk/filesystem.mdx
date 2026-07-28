---
title: FileSystem
description: A library that provides access to the local file system on the device.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-file-system'
packageName: 'expo-file-system'
iconUrl: '/static/images/packages/expo-file-system.png'
platforms: ['android', 'ios', 'tvos', 'expo-go']
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';
import { Collapsible } from '~/ui/components/Collapsible';
import {
  ConfigReactNative,
  ConfigPluginExample,
  ConfigPluginProperties,
} from '~/ui/components/ConfigSection';
import { CODE } from '~/ui/components/Text';

`expo-file-system` provides access to files and directories stored on a device or bundled as assets into the native project. It also allows downloading files from the network.

## Installation

<APIInstallSection />

## Configuration in app config

You can configure `expo-file-system` using its built-in [config plugin](/config-plugins/introduction/) if you use config plugins in your project ([Continuous Native Generation (CNG)](/workflow/continuous-native-generation/)). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect. If your app does **not** use CNG, then you'll need to manually configure the library.

<ConfigPluginExample>

```json app.json
{
  "expo": {
    "plugins": [
      [
        "expo-file-system",
        {
          "supportsOpeningDocumentsInPlace": true,
          "enableFileSharing": true
        }
      ]
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties
  properties={[
    {
      name: 'supportsOpeningDocumentsInPlace',
      platform: 'ios',
      description:
        'A boolean to enable `LSSupportsOpeningDocumentsInPlace` in **Info.plist**. This allows the app to open documents in place.',
      default: 'false',
    },
    {
      name: 'enableFileSharing',
      platform: 'ios',
      description:
        "A boolean to enable `UIFileSharingEnabled` in **Info.plist**. This enables file sharing in the iOS Files app, making the app's Documents directory accessible to users through the Files app, iTunes File Sharing, and other file management tools.",
      default: 'false',
    },
  ]}
/>

<ConfigReactNative>

If you're not using Continuous Native Generation ([CNG](/workflow/continuous-native-generation/)) or you're using native **ios** project manually, then you need to add the `LSSupportsOpeningDocumentsInPlace` and `UIFileSharingEnabled` keys to your project's **ios/[app]/Info.plist**:

```xml
<key>LSSupportsOpeningDocumentsInPlace</key>
<true/>
<key>UIFileSharingEnabled</key>
<true/>
```

</ConfigReactNative>

## Usage

```js
import { File, Directory, Paths } from 'expo-file-system';
```

The `File` and `Directory` instances hold a reference to a file, content, or asset URI.

The file or directory does not need to exist — an error will be thrown from the constructor only if the wrong class is used to represent an existing path (so if you try to create a `File` instance passing a path to an already existing directory).

## Features

- Both synchronous and asynchronous, read and write access to file contents
- Creation, modification and deletion
- Available properties, such as `type`, `size`, `creationDate`, and more
- Ability to read and write files as streams or using the `FileHandle` class
- Easy file download/upload using `downloadFileAsync` or `expo/fetch`
- File previews using platform-native flows

## Examples

<Collapsible summary="Writing and reading text files">

```ts example.ts
import { File, Paths } from 'expo-file-system';

try {
  const file = new File(Paths.cache, 'example.txt');
  file.create(); // can throw an error if the file already exists or no permission to create it
  await file.write('Hello, world!'); // or `file.writeSync('Hello, world!');` for synchronous call
  console.log(file.textSync()); // Hello, world!
} catch (error) {
  console.error(error);
}
```

</Collapsible>

<Collapsible summary="Picking files using system pickers">

Usage with `expo-document-picker`:

```ts example.ts
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

try {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (!result.canceled) {
    const { uri } = result.assets[0];
    const file = new File(uri);
    console.log(file.textSync());
  }
} catch (error) {
  console.error(error);
}
```

Using the built-in `pickFileAsync` or `pickDirectoryAsync` method on Android:

```ts example.ts
import { File } from 'expo-file-system';

try {
  const file = new File.pickFileAsync();
  console.log(file.textSync());
} catch (error) {
  console.error(error);
}
```

</Collapsible>

<Collapsible summary="Downloading files">

Using `downloadFileAsync`:

```ts example.ts
import { Directory, File, Paths } from 'expo-file-system';

const url = 'https://pdfobject.com/pdf/sample.pdf';
const destination = new Directory(Paths.cache, 'pdfs');
try {
  destination.create();
  const output = await File.downloadFileAsync(url, destination);
  console.log(output.exists); // true
  console.log(output.uri); // path to the downloaded file, e.g., '${cacheDirectory}/pdfs/sample.pdf'
} catch (error) {
  console.error(error);
}
```

Or using `expo/fetch`:

```ts example.ts
import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';

const url = 'https://pdfobject.com/pdf/sample.pdf';
const response = await fetch(url);
const src = new File(Paths.cache, 'file.pdf');
await src.write(await response.bytes());
```

</Collapsible>

<Collapsible summary="Previewing files">

Use `File.preview()` to open a local file with the platform's file preview flow. File preview is currently supported on Android and iOS. On iOS, this presents Quick Look, which supports many common file types such as PDFs, images, text files, CSV files, and Office documents. On Android, this opens an `ACTION_VIEW` intent, so support depends on apps installed on the device that can handle the file's MIME type.

```ts example.ts
import { File, Paths } from 'expo-file-system';

const file = await File.downloadFileAsync(
  'https://pdfobject.com/pdf/sample.pdf',
  new File(Paths.cache, 'sample.pdf')
);

if (await file.canPreview()) {
  await file.preview({ title: 'Sample PDF' });
}
```

The `mimeType` option defaults to the file's `type` property. If the file extension does not identify the type correctly, pass `mimeType` explicitly, especially on Android where the MIME type is used to find compatible apps. When Android cannot resolve a MIME type, `canPreview()` resolves to `false` and `preview()` rejects.

`canPreview()` rejects if the file is invalid or cannot be read. It resolves to `false` when the file does not exist or when the platform cannot preview it.

`preview()` resolves once the native preview has been presented or handed off to another app. It rejects if the file does not exist, cannot be read, or no preview is available. It does not wait for the user to dismiss the viewer.

If a share sheet is useful in your app, you can compose this with [`expo-sharing`](./sharing/) when previewing fails:

```ts example.ts
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// This can be a file created, picked, or downloaded earlier.
const file = new File(Paths.cache, 'report.pdf');

try {
  await file.preview({ title: 'Report' });
} catch {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: 'Share report',
      mimeType: file.type || 'application/pdf',
    });
  }
}
```

</Collapsible>

<Collapsible summary={<>Uploading files using <CODE>expo/fetch</CODE></>}>

You can upload files as blobs directly with `fetch` built into the Expo package:

```ts example.ts
import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';

const file = new File(Paths.cache, 'file.txt');
await file.write('Hello, world!');

const response = await fetch('https://example.com', {
  method: 'POST',
  body: file,
});
```

Or using the `FormData` constructor:

```ts example.ts
import { fetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';

const file = new File(Paths.cache, 'file.txt');
await file.write('Hello, world!');
const formData = new FormData();
formData.append('data', file);
const response = await fetch('https://example.com', {
  method: 'POST',
  body: formData,
});
```

</Collapsible>

<Collapsible summary="Moving and copying files">

```ts example.ts
import { Directory, File, Paths } from 'expo-file-system';
try {
  const file = new File(Paths.document, 'example.txt');
  file.create();
  console.log(file.uri); // '${documentDirectory}/example.txt'
  const copiedFile = new File(Paths.cache, 'example-copy.txt');
  file.copy(copiedFile);
  console.log(copiedFile.uri); // '${cacheDirectory}/example-copy.txt'
  file.move(Paths.cache);
  console.log(file.uri); // '${cacheDirectory}/example.txt'
  file.move(new Directory(Paths.cache, 'newFolder'));
  console.log(file.uri); // '${cacheDirectory}/newFolder/example.txt'
} catch (error) {
  console.error(error);
}
```

</Collapsible>

<Collapsible summary="Random-access reads with FileHandle">

Use [`FileHandle`](#filehandle) for efficient, random-access reads of large files without loading the entire file into memory. Obtain a handle by calling `file.open()`, read or write at any position using the `offset` property, and always close the handle when finished.

```ts example.ts
import { File, Paths, FileMode } from 'expo-file-system';

const file = new File(Paths.document, 'recording.wav');
const handle = file.open(FileMode.ReadOnly);

// Read the WAV header (first 44 bytes)
const header = handle.readBytesSync(44);
const sampleRate = new DataView(header.buffer).getUint32(24, true);
console.log(`Sample rate: ${sampleRate} Hz`);

// Seek to a specific offset and read a chunk
handle.offset = 1024;
const chunk = await handle.readBytes(4096);
console.log(`Read ${chunk.length} bytes from offset 1024`);

// Read an entire file in 64 KB chunks
handle.offset = 0;
const CHUNK_SIZE = 64 * 1024;
while (handle.offset! < handle.size!) {
  const data = await handle.readBytes(CHUNK_SIZE);
  // Process data...
}

handle.close();
```

</Collapsible>

<Collapsible summary="Using legacy FileSystem API">

```ts example.ts
import * as FileSystem from 'expo-file-system/legacy';
import { File, Paths } from 'expo-file-system';

try {
  const file = new File(Paths.cache, 'example.txt');
  const content = await FileSystem.readAsStringAsync(file.uri);
  console.log(content);
} catch (error) {
  console.error(error);
}
```

</Collapsible>

<Collapsible summary="Listing directory contents recursively">

```ts example.ts
import { Directory, Paths } from 'expo-file-system';

function printDirectory(directory: Directory, indent: number = 0) {
  console.log(`${' '.repeat(indent)} + ${directory.name}`);
  const contents = directory.list();
  for (const item of contents) {
    if (item instanceof Directory) {
      printDirectory(item, indent + 2);
    } else {
      console.log(`${' '.repeat(indent + 2)} - ${item.name} (${item.size} bytes)`);
    }
  }
}

try {
  printDirectory(new Directory(Paths.cache));
} catch (error) {
  console.error(error);
}
```

</Collapsible>

## API

<APISection packageName="expo-file-system" apiName="FileSystem" />
