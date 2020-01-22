---
id: refreshcontrol
title: RefreshControl
---

This component is used inside a ScrollView or ListView to add pull to refresh functionality. When the ScrollView is at `scrollY: 0`, swiping down triggers an `onRefresh` event.

### Usage example

```javascript

import { ScrollView, RefreshControl } from 'react-native';

class RefreshableList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }

  _onRefresh = () => {
    this.setState({refreshing: true});
    fetchData().then(() => {
      this.setState({refreshing: false});
    });
  }

  render() {
    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._onRefresh}
          />
        }
        ...
      />
    );
  }
  ...
}

```

**Note:** `refreshing` is a controlled prop, this is why it needs to be set to true in the `onRefresh` function otherwise the refresh indicator will stop immediately.

### Props

- [View props...](../view/#props)

* [`refreshing`](../refreshcontrol/#refreshing)
* [`onRefresh`](../refreshcontrol/#onrefresh)
* [`colors`](../refreshcontrol/#colors)
* [`enabled`](../refreshcontrol/#enabled)
* [`progressBackgroundColor`](../refreshcontrol/#progressbackgroundcolor)
* [`progressViewOffset`](../refreshcontrol/#progressviewoffset)
* [`size`](../refreshcontrol/#size)
* [`tintColor`](../refreshcontrol/#tintcolor)
* [`title`](../refreshcontrol/#title)
* [`titleColor`](../refreshcontrol/#titlecolor)

---

# Reference

## Props

### `refreshing`

Whether the view should be indicating an active refresh.

| Type | Required |
| ---- | -------- |
| bool | Yes      |

---

### `onRefresh`

Called when the view starts refreshing.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `colors`

The colors (at least one) that will be used to draw the refresh indicator.

| Type                         | Required | Platform |
| ---------------------------- | -------- | -------- |
| array of [color](../colors/) | No       | Android  |

---

### `enabled`

Whether the pull to refresh functionality is enabled.

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `progressBackgroundColor`

The background color of the refresh indicator.

| Type                | Required | Platform |
| ------------------- | -------- | -------- |
| [color](../colors/) | No       | Android  |

---

### `progressViewOffset`

Progress view top offset

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `size`

Size of the refresh indicator, see RefreshControl.SIZE.

| Type                                                                   | Required | Platform |
| ---------------------------------------------------------------------- | -------- | -------- |
| enum(RefreshLayoutConsts.SIZE.DEFAULT, RefreshLayoutConsts.SIZE.LARGE) | No       | Android  |

---

### `tintColor`

The color of the refresh indicator.

| Type                | Required | Platform |
| ------------------- | -------- | -------- |
| [color](../colors/) | No       | iOS      |

---

### `title`

The title displayed under the refresh indicator.

| Type   | Required | Platform |
| ------ | -------- | -------- |
| string | No       | iOS      |

---

### `titleColor`

Title color.

| Type                | Required | Platform |
| ------------------- | -------- | -------- |
| [color](../colors/) | No       | iOS      |
