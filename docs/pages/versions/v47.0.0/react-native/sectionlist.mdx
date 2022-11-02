---
id: sectionlist
title: SectionList
---

A performant interface for rendering sectioned lists, supporting the most handy features:

- Fully cross-platform.
- Configurable viewability callbacks.
- List header support.
- List footer support.
- Item separator support.
- Section header support.
- Section separator support.
- Heterogeneous data and item rendering support.
- Pull to Refresh.
- Scroll loading.

If you don't need section support and want a simpler interface, use [`<FlatList>`](flatlist.md).

## Example

```js
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, SectionList, StatusBar } from 'react-native';

const DATA = [
  {
    title: 'Main dishes',
    data: ['Pizza', 'Burger', 'Risotto'],
  },
  {
    title: 'Sides',
    data: ['French Fries', 'Onion Rings', 'Fried Shrimps'],
  },
  {
    title: 'Drinks',
    data: ['Water', 'Coke', 'Beer'],
  },
  {
    title: 'Desserts',
    data: ['Cheese Cake', 'Ice Cream'],
  },
];

const Item = ({ title }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const App = () => (
  <SafeAreaView style={styles.container}>
    <SectionList
      sections={DATA}
      keyExtractor={(item, index) => item + index}
      renderItem={({ item }) => <Item title={item} />}
      renderSectionHeader={({ section: { title } }) => <Text style={styles.header}>{title}</Text>}
    />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    marginHorizontal: 16,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
});

export default App;
```

This is a convenience wrapper around [`<VirtualizedList>`](virtualizedlist.md), and thus inherits its props (as well as those of [`<ScrollView>`](scrollview.md)) that aren't explicitly listed here, along with the following caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` remain shallow-equal. Make sure that everything your `renderItem` function depends on is passed as a prop (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate and momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key. Alternatively, you can provide a custom `keyExtractor` prop.

---

# Reference

## Props

### [ScrollView Props](scrollview.md#props)

Inherits [ScrollView Props](scrollview.md#props).

---

### `renderItem`

**Required** Default renderer for every item in every section. Can be over-ridden on a per-section basis. Should return a React element.

| Type     |
| -------- |
| function |

The render function will be passed an object with the following keys:

- 'item' (object) - the item object as specified in this section's `data` key
- 'index' (number) - Item's index within the section.
- 'section' (object) - The full section object as specified in `sections`.
- 'separators' (object) - An object with the following keys:
  - 'highlight' (function) - `() => void`
  - 'unhighlight' (function) - `() => void`
  - 'updateProps' (function) - `(select, newProps) => void`
    - 'select' (enum) - possible values are 'leading', 'trailing'
    - 'newProps' (object)

---

### `sections`

**Required** The actual data to render, akin to the `data` prop in [`FlatList`](flatlist.md).

| Type                                        |
| ------------------------------------------- |
| array of [Section](sectionlist.md#section)s |

---

### `extraData`

A marker property for telling the list to re-render (since it implements `PureComponent`). If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop, stick it here and treat it immutably.

| Type |
| ---- |
| any  |

---

### `initialNumToRender`

How many items to render in the initial batch. This should be enough to fill the screen but not much more. Note these items will never be unmounted as part of the windowed rendering in order to improve perceived performance of scroll-to-top actions.

| Type   | Default |
| ------ | ------- |
| number | `10`    |

---

### `inverted`

Reverses the direction of scroll. Uses scale transforms of -1.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

---

### `ItemSeparatorComponent`

Rendered in between each item, but not at the top or bottom. By default, `highlighted`, `section`, and `[leading/trailing][Item/Section]` props are provided. `renderItem` provides `separators.highlight`/`unhighlight` which will update the `highlighted` prop, but you can also add custom props with `separators.updateProps`.

| Type               |
| ------------------ |
| component, element |

---

### `keyExtractor`

Used to extract a unique key for a given item at the specified index. Key is used for caching and as the React key to track item re-ordering. The default extractor checks `item.key`, then falls back to using the index, like React does. Note that this sets keys for each item, but each overall section still needs its own key.

| Type                                    |
| --------------------------------------- |
| (item: object, index: number) => string |

---

### `ListEmptyComponent`

Rendered when the list is empty. Can be a React Component (e.g. `SomeComponent`), or a React element (e.g. `<SomeComponent />`).

| Type               |
| ------------------ |
| component, element |

---

### `ListFooterComponent`

Rendered at the very end of the list. Can be a React Component (e.g. `SomeComponent`), or a React element (e.g. `<SomeComponent />`).

| Type               |
| ------------------ |
| component, element |

---

### `ListHeaderComponent`

Rendered at the very beginning of the list. Can be a React Component (e.g. `SomeComponent`), or a React element (e.g. `<SomeComponent />`).

| Type               |
| ------------------ |
| component, element |

---

### `onEndReached`

Called once when the scroll position gets within `onEndReachedThreshold` of the rendered content.

| Type                                                      |
|-----------------------------------------------------------|
| (info: &lbrace; distanceFromEnd: number &rbrace;) => void |

---

### `onEndReachedThreshold`

How far from the end (in units of visible length of the list) the bottom edge of the list must be from the end of the content to trigger the `onEndReached` callback. Thus a value of 0.5 will trigger `onEndReached` when the end of the content is within half the visible length of the list.

| Type   | Default |
| ------ | ------- |
| number | `2`     |

---

### `onRefresh`

If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make sure to also set the `refreshing` prop correctly. To offset the RefreshControl from the top (e.g. by 100 pts), use `progressViewOffset={100}`.

| Type     |
| -------- |
| function |

---

### `onViewableItemsChanged`

Called when the viewability of rows changes, as defined by the `viewabilityConfig` prop.

| Type                                                                                                                                   |
|----------------------------------------------------------------------------------------------------------------------------------------|
| (callback: &lbrace; changed: array of [ViewToken](viewtoken.md)s, viewableItems: array of [ViewToken](viewtoken.md)s &rbrace;) => void |

---

### `refreshing`

Set this true while waiting for new data from a refresh.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

---

### `removeClippedSubviews`

> Note: may have bugs (missing content) in some circumstances - use at your own risk.

This may improve scroll performance for large lists.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

---

### `renderSectionFooter`

Rendered at the bottom of each section.

| Type                                                                      |
|---------------------------------------------------------------------------|
| (info: &lbrace; section: [Section](#section) &rbrace;) => element, `null` |

---

### `renderSectionHeader`

Rendered at the top of each section. These stick to the top of the `ScrollView` by default on iOS. See `stickySectionHeadersEnabled`.

| Type                                                                      |
|---------------------------------------------------------------------------|
| (info: &lbrace; section: [Section](#section) &rbrace;) => element, `null` |

---

### `SectionSeparatorComponent`

Rendered at the top and bottom of each section (note this is different from `ItemSeparatorComponent` which is only rendered between items). These are intended to separate sections from the headers above and below and typically have the same highlight response as `ItemSeparatorComponent`. Also receives `highlighted`, `[leading/trailing][Item/Section]`, and any custom props from `separators.updateProps`.

| Type               |
| ------------------ |
| component, element |

---

### `stickySectionHeadersEnabled`

Makes section headers stick to the top of the screen until the next one pushes it off. Only enabled by default on iOS because that is the platform standard there.

| Type    | Default                                    |
| ------- | ------------------------------------------ |
| boolean | `false` **(Android)**<hr/>`true` **(iOS)** |

## Methods

### `flashScrollIndicators()` **(iOS)**

```js
flashScrollIndicators();
```

Displays the scroll indicators momentarily.

---

### `recordInteraction()`

```js
recordInteraction();
```

Tells the list an interaction has occurred, which should trigger viewability calculations, e.g. if `waitForInteractions` is true and the user has not scrolled. This is typically called by taps on items or by navigation actions.

---

### `scrollToLocation()`

```js
scrollToLocation(params);
```

Scrolls to the item at the specified `sectionIndex` and `itemIndex` (within the section) positioned in the viewable area such that `viewPosition` 0 places it at the top (and may be covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle.

> Note: Cannot scroll to locations outside the render window without specifying the `getItemLayout` or `onScrollToIndexFailed` prop.

**Parameters:**

| Name                  | Type   |
| --------------------- | ------ |
| params **(Required)** | object |

Valid `params` keys are:

- 'animated' (boolean) - Whether the list should do an animation while scrolling. Defaults to `true`.
- 'itemIndex' (number) - Index within section for the item to scroll to. Required.
- 'sectionIndex' (number) - Index for section that contains the item to scroll to. Required.
- 'viewOffset' (number) - A fixed number of pixels to offset the final target position, e.g. to compensate for sticky headers.
- 'viewPosition' (number) - A value of `0` places the item specified by index at the top, `1` at the bottom, and `0.5` centered in the middle.

## Type Definitions

### Section

An object that identifies the data to be rendered for a given section.

| Type |
| ---- |
| any  |

**Properties:**

| Name                   | Type               | Description                                                                                                                                              |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data **(Required)**    | array              | The data for rendering items in this section. Array of objects, much like [`FlatList`'s data prop](flatlist.md#data).                                    |
| key                    | string             | Optional key to keep track of section re-ordering. If you don't plan on re-ordering sections, the array index will be used by default.                   |
| renderItem             | function           | Optionally define an arbitrary item renderer for this section, overriding the default [`renderItem`](#renderitem) for the list.                          |
| ItemSeparatorComponent | component, element | Optionally define an arbitrary item separator for this section, overriding the default [`ItemSeparatorComponent`](#itemseparatorcomponent) for the list. |
| keyExtractor           | function           | Optionally define an arbitrary key extractor for this section, overriding the default [`keyExtractor`](#keyextractor).                                   |
