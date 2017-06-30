---
title: FileSystem
---

Provides access to a file system stored locally on the device. Changes to the file system are persisted across restarts of your app. Each Expo app has a separate file system root and has no access to the file system of other Expo apps. The path `'/'` refers to the root of the app's file system.

### `Expo.FileSystem.getInfoAsync(path, options)`

Get metadata information about a file or directory.

#### Arguments

-   **path (_string_)** --

  The path to the file or directory.

-   **options (_object_)** --

  A map of options:

    -   **md5 (_boolean_)** -- Whether to return the MD5 hash of the file. `false` by default.

#### Returns

If no item exists at this path, returns `{ exists: false, isDirectory: false }`. Else returns an object with the following fields:

-   **exists (_boolean_)** -- `true`.

-   **uri (_string_)** -- A `file://` URI pointing to the file. Can be used by any API call that takes a URI.

-   **size (_number_)** -- The size of the file in bytes.

-   **modificationTime (_number_)** -- The last modification time of the file expressed in seconds since epoch.

-   **md5 (_string_)** -- Present if the `md5` option was truthy. Contains the MD5 hash of the file.


### `Expo.FileSystem.readAsStringAsync(path, options)`

Read the entire contents of a file as a string.

#### Arguments

-   **path (_string_)** --

  The path to the file or directory.

#### Returns

A string containing the entire contents of the file.

### `Expo.FileSystem.writeAsStringAsync(path, options)`

Write the entire contents of a file as a string.

#### Arguments

-   **path (_string_)** --

  The path to the file or directory.

-   **contents (_string_)** --

  The string to replace the contents of the file with.

### `Expo.FileSystem.deleteAsync(path, options)`

Delete a file or directory. If the path points to a directory, the directory and all its contents are recursively deleted.

#### Arguments

-   **path (_string_)** --

  The path to the file or directory.

-   **options (_object_)** --

  A map of options:

    -   **idempotent (_boolean_)** -- If `true`, don't throw an error if there is no file or directory at this path. `false` by default.

### `Expo.FileSystem.moveAsync(options)`

Move a file or directory to a new location.

#### Arguments

-   **options (_object_)** --

  A map of options:

    -   **from (_string_)** -- The path to the file or directory at its original location.

    -   **to (_string_)** -- The path to the new intended location of the file or directory, including its name.

### `Expo.FileSystem.copyAsync(options)`

Create a copy of a file or directory. Directories are recursively copied with all of their contents.

#### Arguments

-   **options (_object_)** --

  A map of options:

    -   **from (_string_)** -- The path to the file or directory to copy.

    -   **to (_string_)** -- The path of the new copy to create, including its name.

### `Expo.FileSystem.makeDirectoryAsync(path, options)`

Create a new empty directory.

#### Arguments

-   **path (_string_)** --

  The path to the new directory to create.

-   **options (_object_)** --

  A map of options:

    -   **intermediates (_boolean_)** -- If `true`, create any non-existent parent directories when creating the directory at `path`. If `false`, raises an error if any of the intermediate parent directories does not exist. `false` by default.

### `Expo.FileSystem.readDirectoryAsync(path, options)`

Enumerate the contents of a directory.

#### Arguments

-   **path (_string_)** --

  The path to the directory.

#### Returns

An array of strings, each containing the name of a file or directory contained in the directory at `path`.

### `Expo.FileSystem.downloadAsync(uri, path, options)`

Download the contents at a remote URI to a file in the app's file system.

#### Arguments

-   **url (_string_)** --

  The remote URI to download from.

-   **path (_string_)** --

  The local path of the file to download to. If there is no file at this path, a new one is created. If there is a file at this path, its contents are replaced.

-   **options (_object_)** --

  A map of options:

    -   **md5 (_boolean_)** -- If `true`, include the MD5 hash of the file in the returned object. `false` by default. Provided for convenience since it is common to check the integrity of a file immediately after downloading.

#### Returns

Returns an object with the following fields:

-   **uri (_string_)** -- A `file://` URI pointing to the file. Can be used by any API call that takes a URI.

-   **md5 (_string_)** -- Present if the `md5` option was truthy. Contains the MD5 hash of the file.
