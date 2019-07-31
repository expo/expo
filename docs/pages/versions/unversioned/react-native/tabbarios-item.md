---
id: tabbarios-item
title: TabBarIOS.Item
---

### Props

- [View props...](../view/#props)

* [`selected`](../tabbarios-item/#selected)
* [`badge`](../tabbarios-item/#badge)
* [`icon`](../tabbarios-item/#icon)
* [`onPress`](../tabbarios-item/#onpress)
* [`renderAsOriginal`](../tabbarios-item/#renderasoriginal)
* [`badgeColor`](../tabbarios-item/#badgecolor)
* [`selectedIcon`](../tabbarios-item/#selectedicon)
* [`style`](../tabbarios-item/#style)
* [`systemIcon`](../tabbarios-item/#systemicon)
* [`title`](../tabbarios-item/#title)
* [`isTVSelectable`](../tabbarios-item/#istvselectable)

---

# Reference

## Props

### `selected`

It specifies whether the children are visible or not. If you see a blank content, you probably forgot to add a selected one.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `badge`

Little red bubble that sits at the top right of the icon.

| Type            | Required |
| --------------- | -------- |
| string, ,number | No       |

---

### `icon`

A custom icon for the tab. It is ignored when a system icon is defined.

| Type                   | Required |
| ---------------------- | -------- |
| Image.propTypes.source | No       |

---

### `onPress`

Callback when this tab is being selected, you should change the state of your component to set selected={true}.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `renderAsOriginal`

If set to true it renders the image as original, it defaults to being displayed as a template

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `badgeColor`

Background color for the badge. Available since iOS 10.

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `selectedIcon`

A custom icon when the tab is selected. It is ignored when a system icon is defined. If left empty, the icon will be tinted in blue.

| Type                   | Required |
| ---------------------- | -------- |
| Image.propTypes.source | No       |

---

### `style`

React style object.

| Type       | Required |
| ---------- | -------- |
| View.style | No       |

---

### `systemIcon`

Items comes with a few predefined system icons. Note that if you are using them, the title and selectedIcon will be overridden with the system ones.

| Type                                                                                                                                                   | Required |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| enum('bookmarks', 'contacts', 'downloads', 'favorites', 'featured', 'history', 'more', 'most-recent', 'most-viewed', 'recents', 'search', 'top-rated') | No       |

---

### `title`

Text that appears under the icon. It is ignored when a system icon is defined.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `isTVSelectable`

(Apple TV only)\* When set to true, this view will be focusable and navigable using the Apple TV remote.

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | iOS      |
