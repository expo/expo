---
id: clipboard
title: Clipboard
---

`Clipboard` gives you an interface for setting and getting content from Clipboard on both Android and iOS

---

# Reference

## Methods

### `getString()`

```jsx

static getString()

```

Get content of string type, this method returns a `Promise`, so you can use following code to get clipboard content

```jsx

async _getContent() {
  var content = await Clipboard.getString();
}

```

---

### `setString()`

```jsx

static setString(content)

```

Set content of string type. You can use following code to set clipboard content

```jsx

_setContent() {
  Clipboard.setString('hello world');
}

```

**Parameters:**

| Name    | Type   | Required | Description                               |
| ------- | ------ | -------- | ----------------------------------------- |
| content | string | Yes      | The content to be stored in the clipboard |

_Notice_

Be careful when you're trying to copy to clipboard any data except `string` and `number`, some data need additional stringification. For example, if you will try to copy array - Android will raise an exception, but iOS will not.
