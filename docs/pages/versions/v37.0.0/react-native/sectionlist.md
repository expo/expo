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

### Example

```javascript
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, SectionList } from 'react-native';
import Constants from 'expo-constants';

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

function Item({ title }) {
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={DATA}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item }) => <Item title={item} />}
        renderSectionHeader={({ section: { title } }) => <Text style={styles.header}>{title}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
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
```

This is a convenience wrapper around [`<VirtualizedList>`](virtualizedlist.md), and thus inherits its props (as well as those of [`<ScrollView>`](scrollview.md) that aren't explicitly listed here, along with the following caveats:

- Internal state is not preserved when content scrolls out of the render window. Make sure all your data is captured in the item data or external stores like Flux, Redux, or Relay.
- This is a `PureComponent` which means that it will not re-render if `props` remain shallow-equal. Make sure that everything your `renderItem` function depends on is passed as a prop (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state.
- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate and momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.
- By default, the list looks for a `key` prop on each item and uses that for the React key. Alternatively, you can provide a custom `keyExtractor` prop.

### Props

- [`ScrollView` props...](scrollview.md#props)

Required props:

- [`renderItem`](sectionlist.md#renderitem)
- [`sections`](sectionlist.md#sections)

Optional props:

- [`extraData`](sectionlist.md#extradata)
- [`initialNumToRender`](sectionlist.md#initialnumtorender)
- [`inverted`](sectionlist.md#inverted)
- [`ItemSeparatorComponent`](sectionlist.md#itemseparatorcomponent)
- [`keyExtractor`](sectionlist.md#keyextractor)
- [`legacyImplementation`](sectionlist.md#legacyimplementation)
- [`ListEmptyComponent`](sectionlist.md#listemptycomponent)
- [`ListFooterComponent`](sectionlist.md#listfootercomponent)
- [`ListHeaderComponent`](sectionlist.md#listheadercomponent)
- [`onEndReached`](sectionlist.md#onendreached)
- [`onEndReachedThreshold`](sectionlist.md#onendreachedthreshold)
- [`onRefresh`](sectionlist.md#onrefresh)
- [`onViewableItemsChanged`](sectionlist.md#onviewableitemschanged)
- [`refreshing`](sectionlist.md#refreshing)
- [`removeClippedSubviews`](sectionlist.md#removeclippedsubviews)
- [`renderSectionFooter`](sectionlist.md#rendersectionfooter)
- [`renderSectionHeader`](sectionlist.md#rendersectionheader)
- [`SectionSeparatorComponent`](sectionlist.md#sectionseparatorcomponent)
- [`stickySectionHeadersEnabled`](sectionlist.md#stickysectionheadersenabled)

### Methods

- [`flashScrollIndicators`](sectionlist.md#flashscrollindicators)
- [`recordInteraction`](sectionlist.md#recordinteraction)
- [`scrollToLocation`](sectionlist.md#scrolltolocation)

### Type Definitions

- [`Section`](sectionlist.md#section)

---

# Reference

## Props

### `renderItem`

Default renderer for every item in every section. Can be over-ridden on a per-section basis. Should return a React element.

| Type     | Required |
| -------- | -------- |
| function | Yes      |

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

The actual data to render, akin to the `data` prop in [`FlatList`](flatlist.md).

| Type                                         | Required |
| -------------------------------------------- | -------- |
| array of [Section](sectionlist.md#section)s | Yes      |

---

### `extraData`

A marker property for telling the list to re-render (since it implements `PureComponent`). If any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the `data` prop, stick it here and treat it immutably.

| Type | Required |
| ---- | -------- |
| any  | No       |

---

### `initialNumToRender`

How many items to render in the initial batch. This should be enough to fill the screen but not much more. Note these items will never be unmounted as part of the windowed rendering in order to improve perceived performance of scroll-to-top actions.

| Type   | Required |
| ------ | -------- |
| number | Yes      |

---

### `inverted`

Reverses the direction of scroll. Uses scale transforms of -1.

| Type      | Required |
| --------- | -------- |
| [boolean] | No       |

---

### `ItemSeparatorComponent`

Rendered in between each item, but not at the top or bottom. By default, `highlighted`, `section`, and `[leading/trailing][Item/Section]` props are provided. `renderItem` provides `separators.highlight`/`unhighlight` which will update the `highlighted` prop, but you can also add custom props with `separators.updateProps`.

| Type                           | Required |
| ------------------------------ | -------- |
| [component, function, element] | No       |

---

### `keyExtractor`

Used to extract a unique key for a given item at the specified index. Key is used for caching and as the React key to track item re-ordering. The default extractor checks `item.key`, then falls back to using the index, like React does. Note that this sets keys for each item, but each overall section still needs its own key.

| Type                                   | Required |
| -------------------------------------- | -------- |
| (item: Item, index: number) =\> string | Yes      |

---

### `legacyImplementation`

The legacy implementation is no longer supported.

| Type      | Required |
| --------- | -------- |
| [boolean] | No       |

---

### `ListEmptyComponent`

Rendered when the list is empty. Can be a React Component Class, a render function, or a rendered element.

| Type                           | Required |
| ------------------------------ | -------- |
| [component, function, element] | No       |

---

### `ListFooterComponent`

Rendered at the very end of the list. Can be a React Component Class, a render function, or a rendered element.

| Type                           | Required |
| ------------------------------ | -------- |
| [component, function, element] | No       |

---

### `ListHeaderComponent`

Rendered at the very beginning of the list. Can be a React Component Class, a render function, or a rendered element.

| Type                         | Required |
| ---------------------------- | -------- |
| component, function, element | No       |

---

### `onEndReached`

Called once when the scroll position gets within `onEndReachedThreshold` of the rendered content.

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [(info: {distanceFromEnd: number}) =\> void] | No       |

---

### `onEndReachedThreshold`

How far from the end (in units of visible length of the list) the bottom edge of the list must be from the end of the content to trigger the `onEndReached` callback. Thus a value of 0.5 will trigger `onEndReached` when the end of the content is within half the visible length of the list.

| Type     | Required |
| -------- | -------- |
| [number] | No       |

---

### `onRefresh`

If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make sure to also set the `refreshing` prop correctly. To offset the RefreshControl from the top (e.g. by 100 pts), use `progressViewOffset={100}`.

| Type          | Required |
| ------------- | -------- |
| [() =\> void] | No       |

---

### `onViewableItemsChanged`

Called when the viewability of rows changes, as defined by the `viewabilityConfig` prop.

| Type     | Required |
| -------- | -------- |
| function | No       |

The function will be passed an object with the following keys:

- 'viewableItems' (array of `ViewToken`s)
- 'changed' (array of `ViewToken`s)

The `ViewToken` type is exported by `ViewabilityHelper.js`:

| Name       | Type    | Required |
| ---------- | ------- | -------- |
| item       | any     | Yes      |
| key        | string  | Yes      |
| index      | number  | No       |
| isViewable | boolean | Yes      |
| section    | any     | No       |

---

### `refreshing`

Set this true while waiting for new data from a refresh.

| Type      | Required |
| --------- | -------- |
| [boolean] | No       |

---

### `removeClippedSubviews`

Note: may have bugs (missing content) in some circumstances - use at your own risk.

This may improve scroll performance for large lists.

| Type    | Required |
| ------- | -------- |
| boolean | No       |

---

### `renderSectionFooter`

Rendered at the bottom of each section.

| Type                                                    | Required |
| ------------------------------------------------------- | -------- |
| [(info: {section: SectionT}) =\> ?React.Element\<any\>] | No       |

---

### `renderSectionHeader`

Rendered at the top of each section. These stick to the top of the `ScrollView` by default on iOS. See `stickySectionHeadersEnabled`.

| Type                                                    | Required |
| ------------------------------------------------------- | -------- |
| [(info: {section: SectionT}) =\> ?React.Element\<any\>] | No       |

---

### `SectionSeparatorComponent`

Rendered at the top and bottom of each section (note this is different from `ItemSeparatorComponent` which is only rendered between items). These are intended to separate sections from the headers above and below and typically have the same highlight response as `ItemSeparatorComponent`. Also receives `highlighted`, `[leading/trailing][Item/Section]`, and any custom props from `separators.updateProps`.

| Type                | Required |
| ------------------- | -------- |
| [ReactClass\<any\>] | No       |

---

### `stickySectionHeadersEnabled`

Makes section headers stick to the top of the screen until the next one pushes it off. Only enabled by default on iOS because that is the platform standard there.

| Type    | Required |
| ------- | -------- |
| boolean | No       |

## Methods

### `scrollToLocation()`

```jsx
scrollToLocation(params);
```

Scrolls to the item at the specified `sectionIndex` and `itemIndex` (within the section) positioned in the viewable area such that `viewPosition` 0 places it at the top (and may be covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle.

> Note: Cannot scroll to locations outside the render window without specifying the `getItemLayout` or `onScrollToIndexFailed` prop.

**Parameters:**

| Name   | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| params | object | Yes      | See below.  |

Valid `params` keys are:

- 'animated' (boolean) - Whether the list should do an animation while scrolling. Defaults to `true`.
- 'itemIndex' (number) - Index within section for the item to scroll to. Required.
- 'sectionIndex' (number) - Index for section that contains the item to scroll to. Required.
- 'viewOffset' (number) - A fixed number of pixels to offset the final target position, e.g. to compensate for sticky headers.
- 'viewPosition' (number) - A value of `0` places the item specified by index at the top, `1` at the bottom, and `0.5` centered in the middle.

---

### `recordInteraction()`

```jsx
recordInteraction();
```

Tells the list an interaction has occurred, which should trigger viewability calculations, e.g. if `waitForInteractions` is true and the user has not scrolled. This is typically called by taps on items or by navigation actions.

---

### `flashScrollIndicators()`

```jsx
flashScrollIndicators();
```

Displays the scroll indicators momentarily.

| Platfrom |
| -------- |
| iOS      |

## Type Definitions

### Section

An object that identifies the data to be rendered for a given section.

| Type |
| ---- |
| any  |

**Properties:**

| Name                     | Type                         | Description                                                                                                                                                             |
| ------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data                     | array                        | The data for rendering items in this section. Array of objects, much like [`FlatList`'s data prop](flatlist.md#data).                                                  |
| [key]                    | string                       | Optional key to keep track of section re-ordering. If you don't plan on re-ordering sections, the array index will be used by default.                                  |
| [renderItem]             | function                     | Optionally define an arbitrary item renderer for this section, overriding the default [`renderItem`](sectionlist.md#renderitem) for the list.                          |
| [ItemSeparatorComponent] | component, function, element | Optionally define an arbitrary item separator for this section, overriding the default [`ItemSeparatorComponent`](sectionlist.md#itemseparatorcomponent) for the list. |
| [keyExtractor]           | function                     | Optionally define an arbitrary key extractor for this section, overriding the default [`keyExtractor`](sectionlist.md#keyextractor).                                   |
