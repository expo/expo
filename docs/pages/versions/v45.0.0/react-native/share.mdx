---
id: share
title: Share
---

## Example

```js
import React from 'react';
import { Share, View, Button } from 'react-native';

const ShareExample = () => {
  const onShare = async () => {
    try {
      const result = await Share.share({
        message: 'React Native | A framework for building native apps using React',
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      alert(error.message);
    }
  };
  return (
    <View style={{ marginTop: 50 }}>
      <Button onPress={onShare} title="Share" />
    </View>
  );
};

export default ShareExample;
```

# Reference

## Methods

### `share()`

```js
static share(content, options)
```

Open a dialog to share text content.

In iOS, returns a Promise which will be invoked with an object containing `action` and `activityType`. If the user dismissed the dialog, the Promise will still be resolved with action being `Share.dismissedAction` and all the other keys being undefined. Note that some share options will not appear or work on the iOS simulator.

In Android, returns a Promise which will always be resolved with action being `Share.sharedAction`.

**Properties:**

| Name                   | Type   | Description                                                                                                                                                               |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| content **(Required)** | object | `message` - a message to share<br/>`url` - a URL to share **(iOS)**<br/>`title` - title of the message **(Android)**<hr/>At least one of `url` and `message` is required. |
| options                | object | `dialogTitle` **(Android)**<br/>`excludedActivityTypes` **(iOS)**<br/>`subject` - a subject to share via email **(iOS)**<br/>`tintColor` **(iOS)**                        |

---

## Properties

### `sharedAction`

```js
static sharedAction
```

The content was successfully shared.

---

### `dismissedAction` **(iOS)**

```js
static dismissedAction
```

The dialog has been dismissed.
