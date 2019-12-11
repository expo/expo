---
id: actionsheetios
title: ActionSheetIOS
---

### Methods

- [`showActionSheetWithOptions`](../actionsheetios/#showactionsheetwithoptions)
- [`showShareActionSheetWithOptions`](../actionsheetios/#showshareactionsheetwithoptions)

---

# Reference

## Methods

### `showActionSheetWithOptions()`

```javascript

static showActionSheetWithOptions(options, callback)

```

Display an iOS action sheet. The `options` object must contain one or more of:

- `options` (array of strings) - a list of button titles (required)
- `cancelButtonIndex` (int) - index of cancel button in `options`
- `destructiveButtonIndex` (int) - index of destructive button in `options`
- `title` (string) - a title to show above the action sheet
- `message` (string) - a message to show below the title
- `anchor` (number) - the node to which the action sheet should be anchored (used for iPad)
- `tintColor` (string) - the [color](../colors/) used for non-destructive button titles

The 'callback' function takes one parameter, the zero-based index of the selected item.

Minimal example:

```javascript
ActionSheetIOS.showActionSheetWithOptions(
  {
    options: ['Cancel', 'Remove'],
    destructiveButtonIndex: 1,
    cancelButtonIndex: 0,
  },
  buttonIndex => {
    if (buttonIndex === 1) {
      /* destructive action */
    }
  }
);
```

---

### `showShareActionSheetWithOptions()`

```javascript

static showShareActionSheetWithOptions(options, failureCallback, successCallback)

```

Display the iOS share sheet. The `options` object should contain one or both of `message` and `url` and can additionally have a `subject` or `excludedActivityTypes`:

- `url` (string) - a URL to share
- `message` (string) - a message to share
- `subject` (string) - a subject for the message
- `excludedActivityTypes` (array) - the activities to exclude from the ActionSheet

NOTE: if `url` points to a local file, or is a base64-encoded uri, the file it points to will be loaded and shared directly. In this way, you can share images, videos, PDF files, etc.

The 'failureCallback' function takes one parameter, an error object. The only property defined on this object is an optional `stack` property of type `string`.

The 'successCallback' function takes two parameters:

- a boolean value signifying success or failure
- a string that, in the case of success, indicates the method of sharing
