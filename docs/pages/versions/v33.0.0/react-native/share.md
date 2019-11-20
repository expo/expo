---
id: share
title: Share
---

### Methods

- [`share`](../share/#share)
- [`sharedAction`](../share/#sharedaction)
- [`dismissedAction`](../share/#dismissedaction)

---

# Reference

## Methods

### `share()`

```javascript

static share(content, options)

```

Open a dialog to share text content.

In iOS, Returns a Promise which will be invoked an object containing `action`, `activityType`. If the user dismissed the dialog, the Promise will still be resolved with action being `Share.dismissedAction` and all the other keys being undefined.

In Android, Returns a Promise which always be resolved with action being `Share.sharedAction`.

### Content

- `message` - a message to share
- `title` - title of the message

#### iOS

- `url` - an URL to share

At least one of URL and message is required.

### Options

#### iOS

- `subject` - a subject to share via email
- `excludedActivityTypes`
- `tintColor`

#### Android

- `dialogTitle`

---

### `sharedAction()`

```javascript

static sharedAction()

```

The content was successfully shared.

---

### `dismissedAction()`

```javascript

static dismissedAction()

```

_iOS Only_. The dialog has been dismissed.

## Basic Example

```javascript
import React, { Component } from 'react';
import { Share, Button } from 'react-native';

class ShareExample extends Component {
  onShare = async () => {
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

  render() {
    return <Button onPress={this.onShare} title="Share" />;
  }
}
```
