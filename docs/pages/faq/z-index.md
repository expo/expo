---
title: 'Stacking overlapping views with zIndex in Expo and React Native apps'
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

`zIndex` is the Expo and React Native analog of [CSS's `z-index` property](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index) which lets the developer control the order in which components are displayed over one another.

## Default `zIndex` behavior

Without specifying an explicit `zIndex` or `position`, components that occur later in the tree have a higher z-order.

<ImageSpotlight style={{maxWidth: 360}} alt="Three square components in a square parent container" src="/static/images/z-index/default-layout.png" />

```jsx
export default function App() {
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#ffd6f6',
          },
        ]}>
        {/* zIndex: 0 */}
        <View style={[styles.item, { backgroundColor: '#6638f0' }]} />
        {/* zIndex: 1 */}
        <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
        {/* zIndex: 2 */}
        <View style={[styles.item, { backgroundColor: '#4af2a1' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 300,
    width: 300,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  item: {
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    height: 64,
    width: 64,
    borderRadius: 8,
  },
});
```

This is illustrated more clearly when the components visually intersect each other.

<ImageSpotlight style={{maxWidth: 360}} alt="Three square components intersecting each other" src="/static/images/z-index/default-visually-stacked.png" />

```jsx
export default function App() {
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#e1e4e8',
          },
        ]}>
        {/* zIndex: 0 */}
        <View style={[styles.item, { backgroundColor: '#6638f0' }]} />
        {/* zIndex: 1 */}
        <View style={[styles.item, { backgroundColor: '#5cc9f5', marginTop: -16 }]} />
        {/* zIndex: 2 */}
        <View style={[styles.item, { backgroundColor: '#4af2a1', marginTop: -16 }]} />
      </View>
    </View>
  );
}
```

## Changing the `zIndex` of an element

If you want to change how a component stacks without changing the order in which it occurs in the component tree, use `zIndex`:

<ImageSpotlight style={{maxWidth: 360}} alt="Three components where the second is stacked above the first and third" src="/static/images/z-index/relative-z-index.png" />

```jsx
export default function App() {
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#e1e4e8',
          },
        ]}>
        <View style={[styles.item, { backgroundColor: '#6638f0' }]} />
        <View style={[styles.item, { backgroundColor: '#5cc9f5', marginTop: -16, zIndex: 1 }]} />
        <View style={[styles.item, { backgroundColor: '#4af2a1', marginTop: -16 }]} />
      </View>
    </View>
  );
}
```

## Manually positioning your component

Along with specifying how the component will stack, you can break out of the default layout set by the component's parent and by changing the `position` property on that component to `'absolute'` and specifying the distance it should be from its parent with the style properties `top`, `right`, `bottom`, and `left`.

<ImageSpotlight style={{maxWidth: 360}} alt="Position absolute example" src="/static/images/z-index/absolute-position.png" />

```jsx
export default function App() {
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#e1e4e8',
          },
        ]}>
        <View
          style={[
            styles.item,
            {
              backgroundColor: '#6638f0',
              position: 'absolute',
              top: 32,
              left: 32,
              zIndex: 1,
            },
          ]}
        />
        <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
        <View
          style={[
            styles.item,
            {
              backgroundColor: '#4af2a1',
              marginTop: -16,
            },
          ]}
        />
      </View>
    </View>
  );
}
```

You can even make the component extend outside of the parent's visual bounds.

<ImageSpotlight style={{maxWidth: 360}} alt="Position absolute component out of visual bounds of parent" src="/static/images/z-index/absolute-z-index-bounds.png" />

```jsx
export default function App() {
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#e1e4e8',
          },
        ]}>
        <View
          style={[
            styles.item,
            {
              backgroundColor: '#6638f0',
              position: 'absolute',
              top: -32,
              left: -32,
              zIndex: 1,
            },
          ]}
        />
        <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
        <View
          style={[
            styles.item,
            {
              backgroundColor: '#4af2a1',
              marginTop: -16,
            },
          ]}
        />
      </View>
    </View>
  );
}
```

While a `position: 'absolute'` component may seem like it operates independently, it must still respect the `zIndex` of its parent.

<ImageSpotlight style={{maxWidth: 360}} alt="Position absolute child must respect parent's zIndex" src="/static/images/z-index/z-index-parent.png" />

```jsx
export default function App() {
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#e1e4e8',
          },
        ]}>
        <View
          style={[
            styles.item,
            {
              backgroundColor: '#6638f0',
              position: 'absolute',
              top: -32,
              left: -32,
              zIndex: 100,
            },
          ]}
        />
        <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
        <View
          style={[
            styles.item,
            {
              backgroundColor: '#4af2a1',
              marginTop: -16,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#dcffe4',
            marginTop: -284,
          },
        ]}
      />
    </View>
  );
}
```
