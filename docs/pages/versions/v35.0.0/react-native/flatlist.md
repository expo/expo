---
id: flatlist
title: FlatList
---

A performant interface for rendering simple, flat lists, supporting the most handy features:

  - Fully cross-platform.
  - Optional horizontal mode.
  - Configurable viewability callbacks.
  - Header support.
  - Footer support.
  - Separator support.
  - Pull to Refresh.
  - Scroll loading.
  - ScrollToIndex support.
  - Multiple column support.

If you need section support, use [`<SectionList>`](../sectionlist/).

Minimal Example:

```javascript
<FlatList
  data={[{key: 'a'}, {key: 'b'}]}
  renderItem={({item}) => <Text>{item.key}</Text>}
/>
```

To render multiple columns, use the [`numColumns`](../flatlist/#numcolumns) prop. Using this approach instead of a `flexWrap` layout can prevent conflicts with the item height logic.

More complex, multi-select example demonstrating `PureComponent` usage for perf optimization and avoiding bugs.

  - By binding the `onPressItem` handler, the props will remain `===` and `PureComponent` will prevent wasteful re-renders unless the actual `id`, `selected`, or `title` props change, even if the components rendered in `MyListItem` did not have such optimizations.
  - By passing `extraData={this.state}` to `FlatList` we make sure `FlatList` itself will re-render when the `state.selected` changes. Without setting this prop, `FlatList` would not know it needs to re-render any items because it is also a `PureComponent` and the prop comparison will not show any changes.
  - `keyExtractor` tells the list to use the `id`s for the react keys instead of the default `key` property.


```javascript
class MyListItem extends React.PureComponent {
  _onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    const textColor = this.props.selected ? 'red' : 'black';
    return (
      <TouchableOpacity onPress={this._onPress}>
        <View>
          <Text style={{color: textColor}}>{this.props.title}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class MultiSelectList extends React.PureComponent {
  state = {selected: (new Map(): Map<string, boolean>)};

  _keyExtractor = (item, index) => item.id;

  _onPressItem = (id: string) => {
    // updater functions are preferred for transactional updates
    this.setState((state) => {
      // copy the map rather than modifying state.
      const selected = new Map(state.selected);
      selected.set(id, !selected.get(id)); // toggle
      return {selected};
    });
  };

  _renderItem = ({item}) => (
    <MyListItem
      id={item.id}
      onPressItem={this._onPressItem}
      selected={!!this.state.selected.get(item.id)}
      title={item.title}
    />
  );

  render() {
    return (
      <FlatList
        data={this.props.data}
        extraData={this.state}
        keyExtractor={this._keyExtractor}
        renderItem={this._renderItem}
      />
    );
  }
}
````


This is a convenience wrapper around [`<VirtualizedList>`](../virtualizedlist/), and thus inherits its props (as well as those of [`<ScrollView>`](../scrollview/)) that aren't explicitly listed here, along with the following caveats:

  - Internal state is not preserved when content scrolls out of the render window. Make sure all your data is captured in the item data or external stores like Flux, Redux, or Relay.
  - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-equal. Make sure that everything your `renderItem` function depends on is passed as a prop (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state.
  - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate and momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.
  - By default, the list looks for a `key` prop on each item and uses that for the React key. Alternatively, you can provide a custom `keyExtractor` prop.

Also inherits [ScrollView Props](../scrollview/#props), unless it is nested in another FlatList of same orientation.

### Props

  - [`columnWrapperStyle`](../flatlist/#columnwrapperstyle)
  - [`data`](../flatlist/#data)
  - [`extraData`](../flatlist/#extradata)
  - [`getItemLayout`](../flatlist/#getitemlayout)
  - [`horizontal`](../flatlist/#horizontal)
  - [`initialNumToRender`](../flatlist/#initialnumtorender)
  - [`initialScrollIndex`](../flatlist/#initialscrollindex)
  - [`inverted`](../flatlist/#inverted)
  - [`ItemSeparatorComponent`](../flatlist/#itemseparatorcomponent)
  - [`keyExtractor`](../flatlist/#keyextractor)
  - [`legacyImplementation`](../flatlist/#legacyimplementation)
  - [`ListEmptyComponent`](../flatlist/#listemptycomponent)
  - [`ListFooterComponent`](../flatlist/#listfootercomponent)
  - [`ListFooterComponentStyle`](../flatlist/#listfootercomponentstyle)
  - [`ListHeaderComponent`](../flatlist/#listheadercomponent)
  - [`ListHeaderComponentStyle`](../flatlist/#listheadercomponentstyle)
  - [`numColumns`](../flatlist/#numcolumns)
  - [`onEndReached`](../flatlist/#onendreached)
  - [`onEndReachedThreshold`](../flatlist/#onendreachedthreshold)
  - [`onRefresh`](../flatlist/#onrefresh)
  - [`onViewableItemsChanged`](../flatlist/#onviewableitemschanged)
  - [`progressViewOffset`](../flatlist/#progressviewoffset)
  - [`refreshing`](../flatlist/#refreshing)
  - [`renderItem`](../flatlist/#renderitem)
  - [`removeClippedSubviews`](../flatlist/#removeclippedsubviews)
  - [`ScrollView` props...](../scrollview/#props)
  - [`viewabilityConfig`](../flatlist/#viewabilityconfig)
  - [`viewabilityConfigCallbackPairs`](../flatlist/#viewabilityconfigcallbackpairs)
  - [`VirtualizedList` props...](../virtualizedlist/#props)

### Methods

  - [`flashScrollIndicators`](../flatlist/#flashscrollindicators)
  - [`getScrollResponder`](../flatlist/#getScrollResponder)
  - [`getScrollableNode`](../flatlist/#getScrollableNode)
  - [`scrollToEnd`](../flatlist/#scrolltoend)
  - [`scrollToIndex`](../flatlist/#scrolltoindex)
  - [`scrollToItem`](../flatlist/#scrolltoitem)
  - [`scrollToOffset`](../flatlist/#scrolltooffset)
  - [`recordInteraction`](../flatlist/#recordinteraction)

---

# Reference

## Props

### `renderItem`


```javascript
renderItem({item, index, separators});
````

Takes an item from `data` and renders it into the list.

Provides additional metadata like `index` if you need it, as well as a more generic `separators.updateProps` function which let you set whatever props you want to change the rendering of either the leading separator or trailing separator in case the more common `highlight` and `unhighlight` (which set the `highlighted: boolean` prop) are insufficient for your use case.

| Type     | Required |
| -------- | -------- |
| function | Yes      |

  - `item` (Object): The item from `data` being rendered.
  - `index` (number): The index corresponding to this item in the `data` array.
  - `separators` (Object)
    - `highlight` (Function)
    - `unhighlight` (Function)
    - `updateProps` (Function)
      - `select` (enum('leading', 'trailing'))
      - `newProps` (Object)

Example usage:

```javascript
<FlatList
  ItemSeparatorComponent={Platform.OS !== 'android' && ({highlighted}) => (
    <View style={[style.separator, highlighted && {marginLeft: 0}]} />
  )}
  data={[{title: 'Title Text', key: 'item1'}]}
  renderItem={({item, index, separators}) => (
    <TouchableHighlight
      onPress={() => this._onPress(item)}
      onShowUnderlay={separators.highlight}
      onHideUnderlay={separators.unhighlight}>
      <View style={{backgroundColor: 'white'}}>
        <Text>{item.title}</Text>
      </View>
    </TouchableHighlight>
  )}
/>
```

---

### `data`

For simplicity, data is just a plain array. If you want to use something else, like an immutable list, use the underlying [`VirtualizedList`](../virtualizedlist/) directly.

| Type  | Required |
| ----- | -------- |
| array | Yes      |

---

### `ItemSeparatorComponent`

Rendered in between each item, but not at the top or bottom. By default, `highlighted` and `leadingItem` props are provided. `renderItem` provides `separators.highlight`/`unhighlight` which will update the `highlighted` prop, but you can also add custom props with `separators.updateProps`.

| Type      | Required |
| --------- | -------- |
| component | No       |

---

### `ListEmptyComponent`

Rendered when the list is empty. Can be a React Component Class, a render function, or a rendered element.

| Type                         | Required |
| ---------------------------- | -------- |
| component, function, element | No       |

---

### `ListFooterComponent`

Rendered at the bottom of all the items. Can be a React Component Class, a render function, or a rendered element.

| Type                         | Required |
| ---------------------------- | -------- |
| component, function, element | No       |

---

### `ListFooterComponentStyle`

Styling for internal View for ListFooterComponent

| Type         | Required |
| ------------ | -------- |
| style object | No       |

---

### `ListHeaderComponent`

Rendered at the top of all the items. Can be a React Component Class, a render function, or a rendered element.

| Type                         | Required |
| ---------------------------- | -------- |
| component, function, element | No       |

---

### `ListHeaderComponentStyle`

Styling for internal View for ListHeaderComponent

| Type         | Required |
| ------------ | -------- |
| style object | No       |

---

### `columnWrapperStyle`

Optional custom style for multi-item rows generated when `numColumns > 1`.

| Type         | Required |
| ------------ | -------- |
| style object | No       |

---

### `extraData`

A marker property for telling the list to re-render (since it implements `PureComponent`). If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop, stick it here and treat it immutably.

| Type | Required |
| ---- | -------- |
| any  | No       |

---

### `getItemLayout`

```javascript
(data, index) => {length: number, offset: number, index: number}
```

`getItemLayout` is an optional optimization that allows skipping the measurement of dynamic content if you know the size (height or width) of items ahead of time. `getItemLayout` is both efficient and easy to use if you have fixed size items, for example:

```javascript
  getItemLayout={(data, index) => (
    {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
  )}
```

Adding `getItemLayout` can be a great performance boost for lists of several hundred items. Remember to include separator length (height or width) in your offset calculation if you specify `ItemSeparatorComponent`.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `horizontal`

If true, renders items next to each other horizontally instead of stacked vertically.

| Type    | Required |
| ------- | -------- |
| boolean | No       |

---

### `initialNumToRender`

How many items to render in the initial batch. This should be enough to fill the screen but not much more. Note these items will never be unmounted as part of the windowed rendering in order to improve perceived performance of scroll-to-top actions.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `initialScrollIndex`

Instead of starting at the top with the first item, start at `initialScrollIndex`. This disables the "scroll to top" optimization that keeps the first `initialNumToRender` items always rendered and immediately renders the items starting at this initial index. Requires `getItemLayout` to be implemented.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `inverted`

Reverses the direction of scroll. Uses scale transforms of `-1`.

| Type    | Required |
| ------- | -------- |
| boolean | No       |

---

### `keyExtractor`

```javascript
(item: object, index: number) => string;
```

Used to extract a unique key for a given item at the specified index. Key is used for caching and as the react key to track item re-ordering. The default extractor checks `item.key`, then falls back to using the index, like React does.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `numColumns`

Multiple columns can only be rendered with `horizontal={false}` and will zig-zag like a `flexWrap` layout. Items should all be the same height - masonry layouts are not supported.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `onEndReached`

```javascript
(info: {distanceFromEnd: number}) => void
```

Called once when the scroll position gets within `onEndReachedThreshold` of the rendered content.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onEndReachedThreshold`

How far from the end (in units of visible length of the list) the bottom edge of the list must be from the end of the content to trigger the `onEndReached` callback. Thus a value of 0.5 will trigger `onEndReached` when the end of the content is within half the visible length of the list.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `onRefresh`

```javascript
() => void
```

If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make sure to also set the `refreshing` prop correctly.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onViewableItemsChanged`

```javascript
(info: {
    viewableItems: array,
    changed: array,
  }) => void
```

Called when the viewability of rows changes, as defined by the `viewabilityConfig` prop.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `progressViewOffset`

Set this when offset is needed for the loading indicator to show correctly.

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `legacyImplementation`

May not have full feature parity and is meant for debugging and performance comparison.

| Type    | Required |
| ------- | -------- |
| boolean | No       |

---

### `refreshing`

Set this true while waiting for new data from a refresh.

| Type    | Required |
| ------- | -------- |
| boolean | No       |

---

### `removeClippedSubviews`

This may improve scroll performance for large lists.

> Note: May have bugs (missing content) in some circumstances - use at your own risk.

| Type    | Required |
| ------- | -------- |
| boolean | No       |

---

### `viewabilityConfig`

See `ViewabilityHelper.js` for flow type and further documentation.

| Type              | Required |
| ----------------- | -------- |
| ViewabilityConfig | No       |

`viewabilityConfig` takes a type `ViewabilityConfig` an object with following properties

| Property                         | Required | Type    |
| -------------------------------- | -------- | ------- |
| minimumViewTime                  | No       | number  |
| viewAreaCoveragePercentThreshold | No       | number  |
| itemVisiblePercentThreshold      | No       | number  |
| waitForInteraction               | No       | boolean |

At least one of the `viewAreaCoveragePercentThreshold` or `itemVisiblePercentThreshold` is required. This needs to be done in the `constructor` to avoid following error ([ref](https://github.com/facebook/react-native/issues/17408)):

```javascript
  Error: Changing viewabilityConfig on the fly is not supported`
```

```javascript
constructor (props) {
  super(props)

  this.viewabilityConfig = {
      waitForInteraction: true,
      viewAreaCoveragePercentThreshold: 95
  }
}
```

```javascript
<FlatList
    viewabilityConfig={this.viewabilityConfig}
  ...
```

#### minimumViewTime

Minimum amount of time (in milliseconds) that an item must be physically viewable before the viewability callback will be fired. A high number means that scrolling through content without stopping will not mark the content as viewable.

#### viewAreaCoveragePercentThreshold

Percent of viewport that must be covered for a partially occluded item to count as "viewable", 0-100. Fully visible items are always considered viewable. A value of 0 means that a single pixel in the viewport makes the item viewable, and a value of 100 means that an item must be either entirely visible or cover the entire viewport to count as viewable.

#### itemVisiblePercentThreshold

Similar to `viewAreaPercentThreshold`, but considers the percent of the item that is visible, rather than the fraction of the viewable area it covers.

#### waitForInteraction

Nothing is considered viewable until the user scrolls or `recordInteraction` is called after render.

---

### `viewabilityConfigCallbackPairs`

List of `ViewabilityConfig`/`onViewableItemsChanged` pairs. A specific `onViewableItemsChanged` will be called when its corresponding `ViewabilityConfig`'s conditions are met. See `ViewabilityHelper.js` for flow type and further documentation.

| Type                                   | Required |
| -------------------------------------- | -------- |
| array of ViewabilityConfigCallbackPair | No       |

## Methods

### `scrollToEnd()`

```javascript
scrollToEnd([params]);
```

Scrolls to the end of the content. May be janky without `getItemLayout` prop.

**Parameters:**

| Name   | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| params | object | No       | See below.  |

Valid `params` keys are:

- 'animated' (boolean) - Whether the list should do an animation while scrolling. Defaults to `true`.

---

### `scrollToIndex()`

```javascript
scrollToIndex(params);
```

Scrolls to the item at the specified index such that it is positioned in the viewable area such that `viewPosition` 0 places it at the top, 1 at the bottom, and 0.5 centered in the middle.

> Note: Cannot scroll to locations outside the render window without specifying the `getItemLayout` prop.

**Parameters:**

| Name   | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| params | object | Yes      | See below.  |

Valid `params` keys are:
  - 'animated' (boolean) - Whether the list should do an animation while scrolling. Defaults to `true`.
  - 'index' (number) - The index to scroll to. Required.
  - 'viewOffset' (number) - A fixed number of pixels to offset the final target position. Required.
  - 'viewPosition' (number) - A value of `0` places the item specified by index at the top, `1` at the bottom, and `0.5` centered in the middle.

---

### `scrollToItem()`

```javascript
scrollToItem(params);
```

Requires linear scan through data - use `scrollToIndex` instead if possible.

> Note: Cannot scroll to locations outside the render window without specifying the `getItemLayout` prop.

**Parameters:**

| Name   | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| params | object | Yes      | See below.  |

Valid `params` keys are:

  - 'animated' (boolean) - Whether the list should do an animation while scrolling. Defaults to `true`.
  - 'item' (object) - The item to scroll to. Required.
  - 'viewPosition' (number)

---

### `scrollToOffset()`

```javascript
scrollToOffset(params);
```

Scroll to a specific content pixel offset in the list.

**Parameters:**

| Name   | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| params | object | Yes      | See below.  |

Valid `params` keys are:

  - 'offset' (number) - The offset to scroll to. In case of `horizontal` being true, the offset is the x-value, in any other case the offset is the y-value. Required.
  - 'animated' (boolean) - Whether the list should do an animation while scrolling. Defaults to `true`.

---

### `recordInteraction()`

```javascript
recordInteraction();
```

Tells the list an interaction has occurred, which should trigger viewability calculations, e.g. if `waitForInteractions` is true and the user has not scrolled. This is typically called by taps on items or by navigation actions.

---

### `flashScrollIndicators()`

```javascript
flashScrollIndicators();
```

Displays the scroll indicators momentarily.

---

### `getScrollResponder()`

```javascript
getScrollResponder();
```

Provides a handle to the underlying scroll responder.

---

### `getScrollableNode()`

```javascript
getScrollableNode();
```

Provides a handle to the underlying scroll node.
