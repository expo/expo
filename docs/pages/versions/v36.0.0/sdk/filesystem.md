---
title: FileSystem
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-file-system'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

**`expo-file-system`** provides access to a file system stored locally on the device. Within the Expo client, each app has a separate file system and has no access to the file system of other Expo apps.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-file-system" />

## Example Usage

```javascript
const callback = downloadProgress => {
  const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
  this.setState({
    downloadProgress: progress,
  });
};

const downloadResumable = FileSystem.createDownloadResumable(
  'http://techslides.com/demos/sample-videos/small.mp4',
  FileSystem.documentDirectory + 'small.mp4',
  {},
  callback
);

try {
  const { uri } = await downloadResumable.downloadAsync();
  console.log('Finished downloading to ', uri);
} catch (e) {
  console.error(e);
}

try {
  await downloadResumable.pauseAsync();
  console.log('Paused download operation, saving for future retrieval');
  AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadResumable.savable()));
} catch (e) {
  console.error(e);
}

try {
  const { uri } = await downloadResumable.resumeAsync();
  console.log('Finished downloading to ', uri);
} catch (e) {
  console.error(e);
}

//To resume a download across app restarts, assuming the the DownloadResumable.savable() object was stored:
const downloadSnapshotJson = await AsyncStorage.getItem('pausedDownload');
const downloadSnapshot = JSON.parse(downloadSnapshotJson);
const downloadResumable = new FileSystem.DownloadResumable(
  downloadSnapshot.url,
  downloadSnapshot.fileUri,
  downloadSnapshot.options,
  callback,
  downloadSnapshot.resumeData
);

try {
  const { uri } = await downloadResumable.resumeAsync();
  console.log('Finished downloading to ', uri);
} catch (e) {
  console.error(e);
}
```

## API

```js
import * as FileSystem from 'expo-file-system';
```

<TableOfContentSection title='Directories' contents={['FileSystem.documentDirectory', 'FileSystem.cacheDirectory']} />

<TableOfContentSection title='Constants' contents={['FileSystem.EncodingType']} />

<TableOfContentSection title='Methods' contents={['FileSystem.getInfoAsync(fileUri, options)', 'FileSystem.readAsStringAsync(fileUri, options)', 'FileSystem.writeAsStringAsync(fileUri, contents, options)', 'FileSystem.deleteAsync(fileUri, options)', 'FileSystem.moveAsync(options)', 'FileSystem.copyAsync(options)', 'FileSystem.makeDirectoryAsync(fileUri, options)', 'FileSystem.downloadAsync(uri, fileUri, options)', 'FileSystem.createDownloadResumable(uri, fileUri, options, callback, resumeData)', 'FileSystem.DownloadResumable.downloadAsync()', 'FileSystem.DownloadResumable.pauseAsync()', 'FileSystem.DownloadResumable.resumeAsync()', 'FileSystem.DownloadResumable.savable()', 'FileSystem.getContentUriAsync(fileUri)', 'FileSystem.getFreeDiskStorageAsync()', 'FileSystem.getTotalDiskCapacityAsync()']} />

## Directories

The API takes `file://` URIs pointing to local files on the device to identify files. Each app only has read and write access to locations under the following directories:

### `FileSystem.documentDirectory`

`file://` URI pointing to the directory where user documents for this app will be stored. Files stored here will remain until explicitly deleted by the app. Ends with a trailing `/`. Example uses are for files the user saves that they expect to see again.

### `FileSystem.cacheDirectory`

`file://` URI pointing to the directory where temporary files used by this app will be stored. Files stored here may be automatically deleted by the system when low on storage. Example uses are for downloaded or generated files that the app just needs for one-time usage.

---

So, for example, the URI to a file named `'myFile'` under `'myDirectory'` in the app's user documents directory would be `FileSystem.documentDirectory + 'myDirectory/myFile'`.

Expo APIs that create files generally operate within these directories. This includes `Audio` recordings, `Camera` photos, `ImagePicker` results, `SQLite` databases and `takeSnapShotAsync()` results. This allows their use with the `FileSystem` API.

Some `FileSystem` functions are able to read from (but not write to) other locations. Currently `FileSystem.getInfoAsync()` and `FileSystem.copyAsync()` are able to read from URIs returned by [`CameraRoll.getPhotos()`](https://facebook.github.io/react-native/docs/cameraroll.html#getphotos) from React Native.

## Constants

### `FileSystem.EncodingType`

These values can be used to define how data is read / written.

- **FileSystem.EncodingType.UTF8** -- Standard readable format.

- **FileSystem.EncodingType.Base64** -- Binary, radix-64 representation.

## Methods

### `FileSystem.getInfoAsync(fileUri, options)`

Get metadata information about a file or directory.

#### Arguments

- **fileUri (_string_)** -- `file://` URI to the file or directory, or a URI returned by [`CameraRoll.getPhotos()`](https://facebook.github.io/react-native/docs/cameraroll.html#getphotos).

- **options (_object_)** -- A map of options:

  - **md5 (_boolean_)** -- Whether to return the MD5 hash of the file. `false` by default.

  - **size (_boolean_)** -- Whether to include the size of the file if operating on a source from [`CameraRoll.getPhotos()`](https://facebook.github.io/react-native/docs/cameraroll.html#getphotos) (skipping this can prevent downloading the file if it's stored in iCloud, for example). The size is always returned for `file://` locations.

#### Returns

If no item exists at this URI, returns a Promise that resolves to `{ exists: false, isDirectory: false }`. Else returns a Promise that resolves to an object with the following fields:

- **exists (_boolean_)** -- `true`.

- **isDirectory (_boolean_)** -- `true` if this is a directory, `false` if it is a file

- **modificationTime (_number_)** -- The last modification time of the file expressed in seconds since epoch.

- **size (_number_)** -- The size of the file in bytes. If operating on a source from [`CameraRoll.getPhotos()`](https://facebook.github.io/react-native/docs/cameraroll.html#getphotos), only present if the `size` option was truthy.

- **uri (_string_)** -- A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.

- **md5 (_string_)** -- Present if the `md5` option was truthy. Contains the MD5 hash of the file.

### `FileSystem.readAsStringAsync(fileUri, options)`

Read the entire contents of a file as a string. Binary will be returned in raw format, you will need to append `data:image/png;base64,` to use it as Base64.

#### Arguments

- **fileUri (_string_)** -- `file://` URI to the file or directory.

- **options (_object_)** -- Optional props that define how a file must be read.

  - **encoding (_EncodingType_)** -- The encoding format to use when reading the file. Options: `FileSystem.EncodingType.UTF8`, `FileSystem.EncodingType.Base64`. Default is `FileSystem.EncodingType.UTF8`.

  - **length (_number_)** -- Optional number of bytes to read. This option is only used when `encoding: FileSystem.EncodingType.Base64` and `position` is defined.

  - **position (_number_)** -- Optional number of bytes to skip. This option is only used when `encoding: FileSystem.EncodingType.Base64` and `length` is defined.

#### Returns

A Promise that resolves to a string containing the entire contents of the file.

### `FileSystem.writeAsStringAsync(fileUri, contents, options)`

Write the entire contents of a file as a string.

#### Arguments

- **fileUri (_string_)** -- `file://` URI to the file or directory.

- **contents (_string_)** -- The string to replace the contents of the file with.

- **options (_object_)** -- Optional props that define how a file must be written.

  - **encoding (_string_)** -- The encoding format to use when writing the file. Options: `FileSystem.EncodingType.UTF8`, `FileSystem.EncodingType.Base64`. Default is `FileSystem.EncodingType.UTF8`

### `FileSystem.deleteAsync(fileUri, options)`

Delete a file or directory. If the URI points to a directory, the directory and all its contents are recursively deleted.

#### Arguments

- **fileUri (_string_)** -- `file://` URI to the file or directory.

- **options (_object_)** -- A map of options:

  - **idempotent (_boolean_)** -- If `true`, don't throw an error if there is no file or directory at this URI. `false` by default.

### `FileSystem.moveAsync(options)`

Move a file or directory to a new location.

#### Arguments

- **options (_object_)** -- A map of options:

  - **from (_string_)** -- `file://` URI to the file or directory at its original location.

  - **to (_string_)** -- `file://` URI to the file or directory at what should be its new location.

### `FileSystem.copyAsync(options)`

Create a copy of a file or directory. Directories are recursively copied with all of their contents.

#### Arguments

- **options (_object_)** -- A map of options:

  - **from (_string_)** -- `file://` URI to the file or directory to copy, or a URI returned by [`CameraRoll.getPhotos()`](https://facebook.github.io/react-native/docs/cameraroll.html#getphotos).

  - **to (_string_)** -- The `file://` URI to the new copy to create.

### `FileSystem.makeDirectoryAsync(fileUri, options)`

Create a new empty directory.

#### Arguments

- **fileUri (_string_)** -- `file://` URI to the new directory to create.

- **options (_object_)** -- A map of options:

  - **intermediates (_boolean_)** -- If `true`, create any non-existent parent directories when creating the directory at `fileUri`. If `false`, raises an error if any of the intermediate parent directories does not exist or if the child directory already exists. `false` by default.

### `FileSystem.readDirectoryAsync(fileUri)`

Enumerate the contents of a directory.

#### Arguments

- **fileUri (_string_)** -- `file://` URI to the directory.

#### Returns

A Promise that resolves to an array of strings, each containing the name of a file or directory contained in the directory at `fileUri`.

### `FileSystem.downloadAsync(uri, fileUri, options)`

Download the contents at a remote URI to a file in the app's file system. The directory for a local file uri must exist prior to calling this function.

#### Example

```javascript
FileSystem.downloadAsync(
  'http://techslides.com/demos/sample-videos/small.mp4',
  FileSystem.documentDirectory + 'small.mp4'
)
  .then(({ uri }) => {
    console.log('Finished downloading to ', uri);
  })
  .catch(error => {
    console.error(error);
  });
```

#### Arguments

- **url (_string_)** -- The remote URI to download from.

- **fileUri (_string_)** -- The local URI of the file to download to. If there is no file at this URI, a new one is created. If there is a file at this URI, its contents are replaced. The directory for the file must exist.

- **options (_object_)** -- A map of options:

  - **headers (_object_)** -- An object containing all the HTTP header fields and their values for the download network request. The keys and values of the object are the header names and values respectively.

  - **md5 (_boolean_)** -- If `true`, include the MD5 hash of the file in the returned object. `false` by default. Provided for convenience since it is common to check the integrity of a file immediately after downloading.

#### Returns

Returns a Promise that resolves to an object with the following fields:

- **uri (_string_)** -- A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.

- **status (_number_)** -- The HTTP status code for the download network request.

- **headers (_object_)** -- An object containing all the HTTP header fields and their values for the download network request. The keys and values of the object are the header names and values respectively.

- **md5 (_string_)** -- Present if the `md5` option was truthy. Contains the MD5 hash of the file.

### `FileSystem.createDownloadResumable(uri, fileUri, options, callback, resumeData)`

Create a `DownloadResumable` object which can start, pause, and resume a download of contents at a remote URI to a file in the app's file system. Please note: You need to call `downloadAsync()`, on a `DownloadResumable` instance to initiate the download. The `DownloadResumable` object has a callback that provides download progress updates. Downloads can be resumed across app restarts by using `AsyncStorage` to store the `DownloadResumable.savable()` object for later retrieval. The `savable` object contains the arguments required to initialize a new `DownloadResumable` object to resume the download after an app restart. The directory for a local file uri must exist prior to calling this function.

#### Arguments

- **url (_string_)** -- The remote URI to download from.

- **fileUri (_string_)** -- The local URI of the file to download to. If there is no file at this URI, a new one is created. If there is a file at this URI, its contents are replaced. The directory for the file must exist.

- **options (_object_)** -- A map of options:

  - **md5 (_boolean_)** -- If `true`, include the MD5 hash of the file in the returned object. `false` by default. Provided for convenience since it is common to check the integrity of a file immediately after downloading.

  - **headers (_object_)** -- An object containing any additional HTTP header fields required for the request. The keys and values of the object are the header names and values respectively.

- **callback (_function_)** --
  This function is called on each data write to update the download progress. An object with the following fields are passed:

  - **totalBytesWritten (_number_)** -- The total bytes written by the download operation.
  - **totalBytesExpectedToWrite (_number_)** -- The total bytes expected to be written by the download operation. A value of `-1` means that the server did not return the `Content-Length` header and the total size is unknown.

- **resumeData (_string_)** -- The string which allows the api to resume a paused download. This is set on the `DownloadResumable` object automatically when a download is paused. When initializing a new `DownloadResumable` this should be `null`.

### `FileSystem.DownloadResumable.downloadAsync()`

Download the contents at a remote URI to a file in the app's file system.

#### Returns

Returns a Promise that resolves to an object with the following fields:

- **uri (_string_)** -- A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.

- **status (_number_)** -- The HTTP status code for the download network request.

- **headers (_object_)** -- An object containing all the HTTP header fields and their values for the download network request. The keys and values of the object are the header names and values respectively.

- **md5 (_string_)** -- Present if the `md5` option was truthy. Contains the MD5 hash of the file.

### `FileSystem.DownloadResumable.pauseAsync()`

Pause the current download operation. `resumeData` is added to the `DownloadResumable` object after a successful pause operation. Returns an object that can be saved with `AsyncStorage` for future retrieval (the same object that is returned from calling `FileSystem.DownloadResumable.savable()`. Please see the example below.

#### Returns

Returns a Promise that resolves to an object with the following fields:

- **url (_string_)** -- The remote URI to download from.

- **fileUri (_string_)** -- The local URI of the file to download to. If there is no file at this URI, a new one is created. If there is a file at this URI, its contents are replaced.

- **options (_object_)** -- A map of options:

  - **md5 (_boolean_)** -- If `true`, include the MD5 hash of the file in the returned object. `false` by default. Provided for convenience since it is common to check the integrity of a file immediately after downloading.

- **resumeData (_string_)** -- The string which allows the API to resume a paused download.

### `FileSystem.DownloadResumable.resumeAsync()`

Resume a paused download operation.

#### Returns

Returns a Promise that resolves to an object with the following fields:

- **uri (_string_)** -- A `file://` URI pointing to the file. This is the same as the `fileUri` input parameter.

- **status (_number_)** -- The HTTP status code for the download network request.

- **headers (_object_)** -- An object containing all the HTTP header fields and their values for the download network request. The keys and values of the object are the header names and values respectively.

- **md5 (_string_)** -- Present if the `md5` option was truthy. Contains the MD5 hash of the file.

### `FileSystem.DownloadResumable.savable()`

Returns an object which can be saved with `AsyncStorage` for future retrieval.

#### Returns

Returns an object with the following fields:

- **url (_string_)** -- The remote URI to download from.

- **fileUri (_string_)** -- The local URI of the file to download to. If there is no file at this URI, a new one is created. If there is a file at this URI, its contents are replaced.

- **options (_object_)** -- A map of options:

  - **md5 (_boolean_)** -- If `true`, include the MD5 hash of the file in the returned object. `false` by default. Provided for convenience since it is common to check the integrity of a file immediately after downloading.

- **resumeData (_string_)** -- The string which allows the api to resume a paused download.

### `FileSystem.getContentUriAsync(fileUri)`

Take a `file://` URI and convert it into content URI (`content://`) so that it can be access by other applications outside of Expo.

#### Example

```javascript
FileSystem.getContentUriAsync(uri).then(cUri => {
  console.log(cUri);
  IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: cUri.uri,
    flags: 1,
  });
});
```

#### Arguments

- **fileUri (_string_)** -- The local URI of the file. If there is no file at this URI, an exception will be thrown.

#### Returns

Returns a Promise that resolves to an object with the following fields:

- **uri (_string_)** -- A `content://` URI pointing to the file. This is the same as the `fileUri` input parameter but in different format.

### `FileSystem.getFreeDiskStorageAsync()`

Gets the available internal disk storage size, in bytes. This returns the free space on the data partition that hosts all of the internal storage for all apps on the device.

#### Example

```javascript
FileSystem.getFreeDiskStorageAsync().then(freeDiskStorage => {
  // Android: 17179869184
  // iOS: 17179869184
});
```

#### Returns

Returns a Promise that resolves to the number of bytes available on the internal disk.

### `FileSystem.getTotalDiskCapacityAsync()`

Gets total internal disk storage size, in bytes. This is the total capacity of the data partition that hosts all the internal storage for all apps on the device, or Javascript's [`MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) if the capacity is greater than 2<sup>53</sup> - 1 bytes.

#### Example

```javascript
FileSystem.getTotalDiskCapacityAsync().then(totalDiskCapacity => {
  // Android: 17179869184
  // iOS: 17179869184
});
```

#### Returns

Returns a Promise that resolves to a number that specifies the total internal disk storage capacity in bytes, or Javascript's [`MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) if the capacity is greater than 2<sup>53</sup> - 1 bytes.

#
