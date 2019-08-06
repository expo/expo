---
id: stylesheet
title: StyleSheet
---

A StyleSheet is an abstraction similar to CSS StyleSheets

Create a new StyleSheet:

```javascript
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

```javascript
<View style={styles.container}>
  <Text style={[styles.title, this.props.isActive && styles.activeTitle]} />
</View>
```

Code quality:

- By moving styles away from the render function, you're making the code easier to understand.
- Naming the styles is a good way to add meaning to the low level components in the render function.

Performance:

- Making a stylesheet from a style object makes it possible to refer to it by ID instead of creating a new style object every time.
- It also allows to send the style only once through the bridge. All subsequent uses are going to refer an id (not implemented yet).

### Methods

- [`setStyleAttributePreprocessor`](../stylesheet/#setstyleattributepreprocessor)
- [`create`](../stylesheet/#create)
- [`flatten`](../stylesheet/#flatten)

### Properties

- [`hairlineWidth`](../stylesheet/#hairlinewidth)
- [`absoluteFill`](../stylesheet/#absolutefill)
- [`absoluteFillObject`](../stylesheet/#absolutefillobject)

---

# Reference

## Methods

### `setStyleAttributePreprocessor()`

```javascript

static setStyleAttributePreprocessor(property, process)

```

WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will not be reliably announced. The whole thing might be deleted, who knows? Use at your own risk.

Sets a function to use to pre-process a style property value. This is used internally to process color and transform values. You should not use this unless you really know what you are doing and have exhausted other options.

---

### `create()`

```javascript

static create(obj)

```

Creates a StyleSheet style reference from the given object.

---

### `flatten`

```javascript

static flatten(style)

```

Flattens an array of style objects, into one aggregated style object. Alternatively, this method can be used to lookup IDs, returned by `StyleSheet.register`.

> _NOTE_: Exercise caution as abusing this can tax you in terms of optimizations. IDs enable optimizations through the bridge and memory in general. Refering to style objects directly will deprive you of these optimizations.

Example:

```javascript
var styles = StyleSheet.create({
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

```javascript
var styles = StyleSheet.create({
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
// return { flex: 1, fontSize: 16, color: 'white' }
// Simply styles.listItem would return its ID (number)
```

This method internally uses `StyleSheetRegistry.getStyleByID(style)` to resolve style objects represented by IDs. Thus, an array of style objects (instances of `StyleSheet.create()`), are individually resolved to, their respective objects, merged as one and then returned. This also explains the alternative use.

## Properties

### `hairlineWidth`

```javascript
var styles = StyleSheet.create({
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

A very common pattern is to create overlays with position absolute and zero positioning, so `absoluteFill` can be used for convenience and to reduce duplication of these repeated styles.

---

### `absoluteFillObject`

Sometimes you may want absoluteFill but with a couple tweaks - absoluteFillObject can be used to create a customized entry in a StyleSheet, e.g.:

```javascript
const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    top: 10,
    backgroundColor: 'transparent',
  },
});
```

---
