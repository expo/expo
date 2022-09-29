---
id: virtualizedlist
title: VirtualizedList
---

Base implementation for the more convenient [`<FlatList>`](flatlist.md) and [`<SectionList>`](sectionlist.md) components, which are also better documented. In general, this should only really be used if you need more flexibility than [`FlatList`](flatlist.md) provides, e.g. for use with immutable data instead of plain arrays.

Virtualization massively improves memory consumption and performance of large lists by maintaining a finite render window of active items and replacing all items outside of the render window with appropriately sized blank space. The window adapts to scrolling behavior, and items are rendered incrementally with low-pri (after any running interactions) if they are far from the visible area, or with hi-pri otherwise to minimize the potential of seeing blank space.

## Example

```js
import React from 'react';
import { SafeAreaView, View, VirtualizedList, StyleSheet, Text, StatusBar } from 'react-native';

const DATA = [];

const getItem = (data, index) => ({
  id: Math.random().toString(12).substring(0),
  title: `Item ${index + 1}`,
});

const getItemCount = data => 50;

const Item = ({ title }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <VirtualizedList
        data={DATA}
        initialNumToRender={4}
        renderItem={({ item }) => <Item title={item.title} />}
        keyExtractor={item => item.key}
        getItemCount={getItemCount}
        getItem={getItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight,
  },
  item: {
    backgroundColor: '#f9c2ff',
    height: 150,
    justifyContent: 'center',
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 20,
  },
  title: {
    fontSize: 32,
  },
});

export default App;
```

---

Some caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` are shallow-equal. Make sure that everything your `renderItem` function depends on is passed as a prop (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate and momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key. Alternatively, you can provide a custom `keyExtractor` prop.

---

# Reference

## Props

### [ScrollView Props](scrollview.md#props)

Inherits [ScrollView Props](scrollview.md#props).

---

### `data`

**Required** The default accessor functions assume this is an array of objects with shape `{key: string}` but you can override `getItem`, `getItemCount`, and `keyExtractor` to handle any type of index-based data.

| Type |
| ---- |
| any  |

---

### `getItem`

```js
(data: any, index: number) => object;
```

**Required** A generic accessor for extracting an item from any sort of data blob.

| Type     |
| -------- |
| function |

---

### `getItemCount`

```js
(data: any) => number;
```

**Required** Determines how many items are in the data blob.

| Type     |
| -------- |
| function |

---

### `renderItem`

```js
(info: any) => ?React.Element<any>
```

**Required** Takes an item from `data` and renders it into the list

| Type     |
| -------- |
| function |

---

### `CellRendererComponent`

Each cell is rendered using this element. Can be a React Component Class, or a render function. Defaults to using [`View`](view.md).

| Type                |
| ------------------- |
| component, function |

---

### `ItemSeparatorComponent`

Rendered in between each item, but not at the top or bottom. By default, `highlighted` and `leadingItem` props are provided. `renderItem` provides `separators.highlight`/`unhighlight` which will update the `highlighted` prop, but you can also add custom props with `separators.updateProps`.

| Type                |
| ------------------- |
| component, function |

---

### `ListEmptyComponent`

Rendered when the list is empty. Can be a React Component (e.g. `SomeComponent`), or a React element (e.g. `<SomeComponent />`).

| Type               |
| ------------------ |
| component, element |

---

### `ListItemComponent`

Each data item is rendered using this element. Can be a React Component Class, or a render function.

| Type                |
| ------------------- |
| component, function |

---

### `ListFooterComponent`

Rendered at the bottom of all the items. Can be a React Component (e.g. `SomeComponent`), or a React element (e.g. `<SomeComponent />`).

| Type               |
| ------------------ |
| component, element |

---

### `ListFooterComponentStyle`

Styling for internal View for `ListFooterComponent`.

| Type          | Required |
| ------------- | -------- |
| ViewStyleProp | No       |

---

### `ListHeaderComponent`

Rendered at the top of all the items. Can be a React Component (e.g. `SomeComponent`), or a React element (e.g. `<SomeComponent />`).

| Type               |
| ------------------ |
| component, element |

---

### `ListHeaderComponentStyle`

Styling for internal View for `ListHeaderComponent`.

| Type                              |
| --------------------------------- |
| [View Style](view-style-props.md) |

---

### `debug`

`debug` will turn on extra logging and visual overlays to aid with debugging both usage and implementation, but with a significant perf hit.

| Type    |
| ------- |
| boolean |

---

### `disableVirtualization`

> **Deprecated.** Virtualization provides significant performance and memory optimizations, but fully unmounts react instances that are outside of the render window. You should only need to disable this for debugging purposes.

| Type    |
| ------- |
| boolean |

---

### `extraData`

A marker property for telling the list to re-render (since it implements `PureComponent`). If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop, stick it here and treat it immutably.

| Type |
| ---- |
| any  |

---

### `getItemLayout`

```js
(
  data: any,
  index: number,
) => {length: number, offset: number, index: number}
```

| Type     |
| -------- |
| function |

---

### `horizontal`

If `true`, renders items next to each other horizontally instead of stacked vertically.

| Type    |
| ------- |
| boolean |

---

### `initialNumToRender`

How many items to render in the initial batch. This should be enough to fill the screen but not much more. Note these items will never be unmounted as part of the windowed rendering in order to improve perceived performance of scroll-to-top actions.

| Type   | Default |
| ------ | ------- |
| number | `10`    |

---

### `initialScrollIndex`

Instead of starting at the top with the first item, start at `initialScrollIndex`. This disables the "scroll to top" optimization that keeps the first `initialNumToRender` items always rendered and immediately renders the items starting at this initial index. Requires `getItemLayout` to be implemented.

| Type   |
| ------ |
| number |

---

### `inverted`

Reverses the direction of scroll. Uses scale transforms of `-1`.

| Type    |
| ------- |
| boolean |

---

### `listKey`

A unique identifier for this list. If there are multiple VirtualizedLists at the same level of nesting within another VirtualizedList, this key is necessary for virtualization to work properly.

| Type   | Required |
| ------ | -------- |
| string | True     |

---

### `keyExtractor`

```js
(item: object, index: number) => string;
```

Used to extract a unique key for a given item at the specified index. Key is used for caching and as the react key to track item re-ordering. The default extractor checks `item.key`, then `item.id`, and then falls back to using the index, like React does.

| Type     |
| -------- |
| function |

---

### `maxToRenderPerBatch`

The maximum number of items to render in each incremental render batch. The more rendered at once, the better the fill rate, but responsiveness may suffer because rendering content may interfere with responding to button taps or other interactions.

| Type   |
| ------ |
| number |

---

### `onEndReached`

```js
(info: {distanceFromEnd: number}) => void
```

Called once when the scroll position gets within `onEndReachedThreshold` of the rendered content.

| Type     |
| -------- |
| function |

---

### `onEndReachedThreshold`

How far from the end (in units of visible length of the list) the bottom edge of the list must be from the end of the content to trigger the `onEndReached` callback. Thus a value of 0.5 will trigger `onEndReached` when the end of the content is within half the visible length of the list.

| Type   |
| ------ |
| number |

---

### `onRefresh`

```js
() => void
```

If provided, a standard `RefreshControl` will be added for "Pull to Refresh" functionality. Make sure to also set the `refreshing` prop correctly.

| Type     |
| -------- |
| function |

---

### `onScrollToIndexFailed`

```js
(info: {
  index: number,
  highestMeasuredFrameIndex: number,
  averageItemLength: number,
}) => void
```

Used to handle failures when scrolling to an index that has not been measured yet. Recommended action is to either compute your own offset and `scrollTo` it, or scroll as far as possible and then try again after more items have been rendered.

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

### `persistentScrollbar`

| Type |
| ---- |
| bool |

---

### `progressViewOffset` **(Android)**

Set this when offset is needed for the loading indicator to show correctly.

| Type   |
| ------ |
| number |

---

### `refreshControl`

A custom refresh control element. When set, it overrides the default `<RefreshControl>` component built internally. The onRefresh and refreshing props are also ignored. Only works for vertical VirtualizedList.

| Type    |
| ------- |
| element |

---

### `refreshing`

Set this true while waiting for new data from a refresh.

| Type    |
| ------- |
| boolean |

---

### `removeClippedSubviews`

This may improve scroll performance for large lists.

> Note: May have bugs (missing content) in some circumstances - use at your own risk.

| Type    |
| ------- |
| boolean |

---

### `renderScrollComponent`

```js
(props: object) => element;
```

Render a custom scroll component, e.g. with a differently styled `RefreshControl`.

| Type     |
| -------- |
| function |

---

### `viewabilityConfig`

See **ViewabilityHelper.js** for flow type and further documentation.

| Type              |
| ----------------- |
| ViewabilityConfig |

---

### `viewabilityConfigCallbackPairs`

List of `ViewabilityConfig`/`onViewableItemsChanged` pairs. A specific `onViewableItemsChanged` will be called when its corresponding `ViewabilityConfig`'s conditions are met. See **ViewabilityHelper.js** for flow type and further documentation.

| Type                                   |
| -------------------------------------- |
| array of ViewabilityConfigCallbackPair |

---

### `updateCellsBatchingPeriod`

Amount of time between low-pri item render batches, e.g. for rendering items quite a ways off screen. Similar fill rate/responsiveness tradeoff as `maxToRenderPerBatch`.

| Type   |
| ------ |
| number |

---

### `windowSize`

Determines the maximum number of items rendered outside of the visible area, in units of visible lengths. So if your list fills the screen, then `windowSize={21}` (the default) will render the visible screen area plus up to 10 screens above and 10 below the viewport. Reducing this number will reduce memory consumption and may improve performance, but will increase the chance that fast scrolling may reveal momentary blank areas of unrendered content.

| Type   |
| ------ |
| number |

## Methods

### `flashScrollIndicators()`

```js
flashScrollIndicators();
```

---

### `getChildContext()`

```js
getChildContext () => Object;
```

The `Object` returned consist of:

- 'virtualizedList' (Object). This object consist of the following
- getScrollMetrics' (Function). Returns an object with following properties: `{ contentLength: number, dOffset: number, dt: number, offset: number, timestamp: number, velocity: number, visibleLength: number }`.
- 'horizontal' (boolean) - Optional.
- 'getOutermostParentListRef' (Function).
- 'getNestedChildState' (Function) - Returns ChildListState .
- 'registerAsNestedChild' (Function). This accept an object with following properties `{ cellKey: string, key: string, ref: VirtualizedList, parentDebugInfo: ListDebugInfo }`. It returns a ChildListState
- 'unregisterAsNestedChild' (Function). This takes an object with following properties, `{ key: string, state: ChildListState }`
- 'debugInfo' (ListDebugInfo).

---

### `getScrollableNode()`

```js
getScrollableNode () => ?number;
```

---

### `getScrollRef()`

```js
getScrollRef () => |
| ?React.ElementRef<typeof ScrollView>
| ?React.ElementRef<typeof View>;
```

---

### `getScrollResponder()`

```js
getScrollResponder () => ?ScrollResponderType;
```

Provides a handle to the underlying scroll responder. Note that `this._scrollRef` might not be a `ScrollView`, so we need to check that it responds to `getScrollResponder` before calling it.

---

### `hasMore()`

```js
hasMore () => boolean;
```

---

### `scrollToEnd()`

```js
scrollToEnd((params: object));
```

Valid `params` consist of:

- 'animated' (boolean). Optional default is true.

---

### `scrollToIndex()`

```js
scrollToIndex((params: object));
```

Valid `params` consist of:

- 'animated' (boolean). Optional.
- 'index' (number). Required.
- 'viewOffset' (number). Optional.
- 'viewPosition' (number). Optional.

---

### `scrollToItem()`

```js
scrollToItem((params: object));
```

Valid `params` consist of:

- 'animated' (boolean). Optional.
- 'item' (Item). Required.
- 'viewPosition' (number). Optional.

---

### `scrollToOffset()`

```js
scrollToOffset((params: object));
```

Scroll to a specific content pixel offset in the list.

Param `offset` expects the offset to scroll to. In case of `horizontal` is true, the offset is the x-value, in any other case the offset is the y-value.

Param `animated` (`true` by default) defines whether the list should do an animation while scrolling.

---

### `recordInteraction()`

```js
recordInteraction();
```

---

### `setNativeProps()`

```js
setNativeProps((props: Object));
```
