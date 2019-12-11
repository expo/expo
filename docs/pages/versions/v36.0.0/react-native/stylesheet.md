---
id: stylesheet
title: StyleSheet
---

A StyleSheet is an abstraction similar to CSS StyleSheets

Create a new StyleSheet:

```jsx
const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  activeTitle: {
    color: 'red',
  },
});
```

Use a StyleSheet:

```jsx
<View style={styles.container}>
  <Text style={[styles.title, this.props.isActive && styles.activeTitle]} />
</View>
```

Code quality:

- By moving styles away from the render function, you're making the code easier to understand.
- Naming the styles is a good way to add meaning to the low level components in the render function.

---

# Reference

## Methods

### `setStyleAttributePreprocessor()`

```jsx

static setStyleAttributePreprocessor(property, process)

```

WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will not be reliably announced. The whole thing might be deleted, who knows? Use at your own risk.

Sets a function to use to pre-process a style property value. This is used internally to process color and transform values. You should not use this unless you really know what you are doing and have exhausted other options.

---

### `create()`

```jsx

static create(obj)

```

Creates a StyleSheet style reference from the given object.

---

### `flatten`

```jsx

static flatten(style)

```

Flattens an array of style objects, into one aggregated style object. Alternatively, this method can be used to lookup IDs, returned by `StyleSheet.register`.

> _NOTE_: Exercise caution as abusing this can tax you in terms of optimizations. IDs enable optimizations through the bridge and memory in general. Refering to style objects directly will deprive you of these optimizations.

Example:

```jsx
const styles = StyleSheet.create({
  listItem: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  selectedListItem: {
    color: 'green',
  },
});

StyleSheet.flatten([styles.listItem, styles.selectedListItem]);
// returns { flex: 1, fontSize: 16, color: 'green' }
```

Alternative use:

```jsx
const styles = StyleSheet.create({
  listItem: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  selectedListItem: {
    color: 'green',
  },
});

StyleSheet.flatten(styles.listItem);
// returns { flex: 1, fontSize: 16, color: 'white' }
// Simply styles.listItem would return its ID (number)
```

This method internally uses `StyleSheetRegistry.getStyleByID(style)` to resolve style objects represented by IDs. Thus, an array of style objects (instances of `StyleSheet.create()`), are individually resolved to, their respective objects, merged as one and then returned. This also explains the alternative use.

---

### `compose`

Combines two styles such that `style2` will override any styles in `style1`. If either style is falsy, the other one is returned without allocating an array, saving allocations and maintaining reference equality for PureComponent checks.

```jsx

static compose(style1, style2)

```

## Properties

### `hairlineWidth`

This is defined as the width of a thin line on the platform. It can be used as the thickness of a border or division between two elements. Example:

```jsx
const styles = StyleSheet.create({
  separator: {
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
```

This constant will always be a round number of pixels (so a line defined by it can look crisp) and will try to match the standard width of a thin line on the underlying platform. However, you should not rely on it being a constant size, because on different platforms and screen densities its value may be calculated differently.

A line with hairline width may not be visible if your simulator is downscaled.

---

### `absoluteFill`

A very common pattern is to create overlays with position absolute and zero positioning (`position: 'absolute', left: 0, right: 0, top: 0, bottom: 0`), so `absoluteFill` can be used for convenience and to reduce duplication of these repeated styles. If you want, absoluteFill can be used to create a customized entry in a StyleSheet, e.g.:

```jsx
const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFill,
  },
});
```

---

### `absoluteFillObject`

Sometimes you may want `absoluteFill` but with a couple tweaks - `absoluteFillObject` can be used to create a customized entry in a `StyleSheet`, e.g.:

```jsx
const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    top: 10,
    backgroundColor: 'transparent',
  },
});
```

---

### `absoluteFill` vs. `absoluteFillObject`

Currently, there is no difference between using `absoluteFill` vs. `absoluteFillObject` as you can see in the [source code](https://github.com/facebook/react-native/blob/master/Libraries/StyleSheet/StyleSheet.js#L255)
