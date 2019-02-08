---
title: Updates
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

API for controlling and responding to over-the-air updates to your app.

### `Expo.Updates.reload()`

Reloads the current experience. This will use your app.json `updates` configuration to fetch and load the newest available JS supported by the device's Expo environment. This is useful for triggering an update of your experience if you have published a new version.

### `Expo.Updates.checkForUpdateAsync()`

Check if a new published version of your project is available. Does not actually download the update. Rejects if `updates.enabled` is `false` in app.json.

#### Returns

An object with the following keys:

-   **isAvailable : `boolean`** -- True if an update is available, false if you're already running the most up-to-date JS bundle.
-   **manifest : `object`** -- If `isAvailable` is true, the manifest of the available update. Undefined otherwise.

### `Expo.Updates.fetchUpdateAsync(params?)`

Downloads the most recent published version of your experience to the device's local cache. Rejects if `updates.enabled` is `false` in app.json.

#### Arguments

An optional `params` object with the following keys:

-   **eventListener : `function`** -- A callback to receive updates events. Will be called with the same events as a function passed into [`Updates.addListener`](#expoupdatesaddlistenereventlistener) but will be subscribed and unsubscribed from events automatically.

#### Returns

An object with the following keys:

-   **isNew : `boolean`** -- True if the fetched bundle is new (i.e. a different version that the what's currently running).
-   **manifest : `object`** -- Manifest of the fetched update.

### `Expo.Updates.addListener(eventListener)`

Invokes a callback when updates-related events occur, either on the initial app load or as a result of a call to `Expo.Updates.fetchUpdateAsync`.

#### Arguments

-   **eventListener : `function`** -- A callback that is invoked with an updates event.

#### Returns

An [EventSubscription](#eventsubscription) object that you can call `remove()` on when you would like to unsubscribe from the listener.

### Related types

### `EventSubscription`

Returned from `addListener`.

-   **remove() : `function`** -- Unsubscribe the listener from future updates.

### `Event`

An object that is passed into each event listener when a new version is available.

-   **type : `string`** -- Type of the event (see [EventType](#eventtype)).
-   **manifest : `object`** -- If `type === Expo.Updates.EventType.DOWNLOAD_FINISHED`, the manifest of the newly downloaded update. Undefined otherwise.
-   **message : `string`** -- If `type === Expo.Updates.EventType.ERROR`, the error message. Undefined otherwise.

### `EventType`

-   **`Expo.Updates.EventType.DOWNLOAD_STARTED`** -- A new update is available and has started downloading.
-   **`Expo.Updates.EventType.DOWNLOAD_FINISHED`** -- A new update has finished downloading and is now stored in the device's cache.
-   **`Expo.Updates.EventType.NO_UPDATE_AVAILABLE`** -- No updates are available, and the most up-to-date bundle of this experience is already running.
-   **`Expo.Updates.EventType.ERROR`** -- An error occurred trying to fetch the latest update.
