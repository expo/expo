---
title: MediaLibrary
---

Provides access to user's media library.

Requires `Permissions.CAMERA_ROLL` permissions.

## Methods

### `Expo.MediaLibrary.createAssetAsync(localUri)`

Creates an asset from existing file. The most common use case is to save a picture taken by [Camera](./camera.html).

```
const { uri } = await camera.takePictureAsync();
const asset = await MediaLibrary.createAssetAsync(uri);
```

#### Arguments

-   **localUri (_string_)** -- A URI to the image or video file. On Android it must be a local path, so it must start with `file:///`.

#### Returns

An object representing an [asset](#asset).

### `Expo.MediaLibrary.getAssetsAsync(options)`

Fetches a page of assets matching the provided criteria.

#### Arguments
-   **options (_object_)**

    -   **first (_number_)** -- The maximum number of items on a single page.
    -   **after (_string_)** -- Asset ID of the last item returned on the previous page.
    -   **album (_string_ | _Album_)** -- [Album](#album) or its ID to get assets from specific album.
    -   **sortBy (_array_)** -- An array of [SortBy](#expomedialibrarysortby) keys. By default, all keys are sorted in descending order, however you can also pass a pair `[key, ascending]` where the second item is a `boolean` value that means whether to use ascending order.
    Earlier items have higher priority when sorting out the results.
    If empty, this method will use the default sorting that is provided by the platform.
    -   **mediaType (_array_)** -- An array of [MediaType](#expomedialibrarymediatype) types.

#### Returns

A promise that resolves to an object that contains following keys:

-   **assets (_array_)** -- A page of [assets](#asset) fetched by the query.
-   **endCursor (_string_)** -- ID of the last fetched asset. It should be passed as `after` option in order to get the next page.
-   **hasNextPage (_boolean_)** -- Whether there are more assets to fetch.
-   **totalCount (_number_)** -- Estimated total number of assets that match the query.

### `Expo.MediaLibrary.getAssetInfoAsync(asset)`

Provides more informations about an asset, including GPS location, local URI and EXIF metadata.

#### Arguments

-   **asset (_string_ | _Asset_)** -- [Asset](#asset) or its ID.

#### Returns

Asset object extended by additional fields listed [in the table](#asset).

### `Expo.MediaLibrary.deleteAssetsAsync(assets)`

Deletes assets from the library.
On iOS it deletes assets from all albums they belong to, while on Android it keeps all copies of them (album is strictly connected to the asset).
Also, there is additional dialog on iOS that requires user to confirm this action.

#### Arguments

-   **assets (_array_)** -- An array of [assets](#asset) or their IDs.

#### Returns

Returns `true` if the assets were successfully deleted.

### `Expo.MediaLibrary.getAlbumsAsync()`

Queries for user-created albums in media gallery.

#### Returns

An array of [albums](#album).

### `Expo.MediaLibrary.getAlbumAsync(albumName)`

Queries for an album with a specific name.

#### Arguments

-   **albumName (_string_)** -- Name of the album to look for.

#### Returns

An object representing an [album](#album) if album with given name exists, otherwise returns `null`.

### `Expo.MediaLibrary.createAlbumAsync(albumName, asset)`

Creates an album with given name and initial asset.
The asset parameter is required on Android, since it's not possible to create empty album on this platform.

#### Arguments

-   **albumName (_string_)** -- Name of the album to create.
-   **asset (_string_ | _Asset_)** -- [Asset](#asset) or its ID. Required on Android.

#### Returns

Newly created [album](#album).

### `Expo.MediaLibrary.addAssetsToAlbumAsync(assets, album, copyAssets)`

Adds array of assets to the album.

On Android, by default it copies assets from the current album to provided one, however it's also possible to move them by passing `false` as `copyAssets` argument.
In case they're copied you should keep in mind that `getAssetsAsync` will return duplicated assets.

#### Arguments

-   **assets (_array_)** -- Array of [assets](#assets) to add.
-   **album (_string_ | _Album_)** -- [Album](#album) or its ID, to which the assets will be added.
-   **copyAssets (_boolean_)** -- Whether to copy assets to the new album instead of move them. Defaults to `true`. (**Android only**)

#### Returns

Resolves to `true` if the assets were successfully added to the album.

### `Expo.MediaLibrary.removeAssetsFromAlbumAsync(assets, album)`

Removes given assets from album.

On Android, album will be automatically deleted if there are no more assets inside.

#### Arguments

-   **assets (_array_)** -- Array of [assets](#assets) to remove from album.
-   **album (_string_ | _Album_)** -- [Album](#album) or its ID, from which the assets will be removed.

#### Returns

Returns `true` if the assets were successfully removed from the album.

### `Expo.MediaLibrary.getMomentsAsync()`

**Available on iOS only.** Fetches a list of moments, which is a group of assets taken around the same place and time.

#### Returns

An array of [albums](#album) whose type is `moment`.


### `Expo.MediaLibrary.addListener(listener)`

Subscribes for updates in user's media library.

#### Arguments

-   **listener (_function_)** -- A callback that is called when any assets have been inserted or deleted from the library. **On Android** it's invoked with an empty object. **On iOS** it's invoked with an object that contains following keys:
    -   **insertedAssets (_array_)** -- Array of [assets](#assets) that have been inserted to the library.
    -   **deletedAssets (_array_)** -- Array of [assets](#assets) that have been deleted from the library.

#### Returns

An EventSubscription object that you can call `remove()` on when you would like to unsubscribe the listener.

### `Expo.MediaLibrary.removeAllListeners()`

Removes all listeners.

## Types

### `Asset`

| Field name | Type | Platforms | Description | Possible values |
| ---------------- | -------- | --------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| id               | _string_ | both      | Internal ID that represents an asset     |                                                                                                     |
| filename         | _string_ | both      | Filename of the asset                    |                                                                                                     |
| uri              | _string_ | both      | URI that points to the asset             | `assets://*` (iOS), `file://*` (Android)                                                            |
| mediaType        | _string_ | both      | Media type                               | `MediaType.audio`, `MediaType.photo`, `MediaType.video`, `MediaType.unknown`                        |
| width            | _number_ | both      | Width of the image or video              |                                                                                                     |
| height           | _number_ | both      | Height of the image or video             |                                                                                                     |
| creationTime     | _number_ | both      | File creation timestamp                  |                                                                                                     |
| modificationTime | _number_ | both      | Last modification timestamp              |                                                                                                     |
| duration         | _number_ | both      | Duration of the video or audio asset     |                                                                                                     |
| mediaSubtypes    | _array_  | iOS       | An array of media subtypes               | `hdr`, `panorama`, `stream`, `timelapse`, `screenshot`, `highFrameRate`, `livePhoto`, `depthEffect` |
| albumId          | _string_ | Android   | Album ID that the asset belongs to       |                                                                                                     |
| localUri *       | _string_ | both      | Local URI for the asset                  |                                                                                                     |
| location *       | _object_ | both      | GPS location if available                | `latitude: number, longitude: number` or `null`                                                 |
| exif *           | _object_ | both      | EXIF metadata associated with the image  |                                                                                                     |
| orientation *    | _number_ | iOS       | Display orientation of the image         | Numbers 1-8, see [EXIF orientation specification](http://sylvana.net/jpegcrop/exif_orientation.html)|
| isFavorite *     | _boolean_| iOS       | Whether the asset is marked as favorite  | `true`, `false`                                                                                     |

> &ast; These fields can be obtained only by calling `getAssetInfoAsync` method

### `Album`

| Field name | Type | Platforms | Description | Possible values |
| -------------------   | -------- | --------- | ------------------------------------------------------- | --------------------------------------------------- |
| id                    | _string_ | both      |                                                         |                                                     |
| title                 | _string_ | both      |                                                         |                                                     |
| assetCount            | _number_ | both      | Estimated number of assets in the album                 |                                                     |
| type                  | _string_ | iOS       | The type of the assets album                            | `album`, `moment`, `smartAlbum`                     |
| startTime *           | _number_ | iOS       | Earliest creation timestamp of all assets in the moment |                                                     |
| endTime *             | _number_ | iOS       | Latest creation timestamp of all assets in the moment   |                                                     |
| approximateLocation * | _object_ | iOS       | Approximated location of all assets in the moment       | `latitude: number, longitude: number` or `null` |
| locationNames *       | _array_  | iOS       | Names of locations grouped in the moment                |                                                     |

> &ast; These fields apply only to albums whose type is `moment`

## Constants

### `Expo.MediaLibrary.MediaType`

Possible media types:
- `MediaType.photo`
- `MediaType.video`
- `MediaType.audio`
- `MediaType.unknown`

### `Expo.MediaLibrary.SortBy`

Supported keys that can be used to sort `getAssetsAsync` results:
- `SortBy.default`
- `SortBy.id`
- `SortBy.creationTime`
- `SortBy.modificationTime`
- `SortBy.mediaType`
- `SortBy.width`
- `SortBy.height`
- `SortBy.duration`
