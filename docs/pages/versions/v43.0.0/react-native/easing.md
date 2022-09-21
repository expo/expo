---
id: easing
title: Easing
---

The `Easing` module implements common easing functions. This module is used by [Animated.timing()](animated.md#timing) to convey physically believable motion in animations.

You can find a visualization of some common easing functions at http://easings.net/

### Predefined animations

The `Easing` module provides several predefined animations through the following methods:

- [`back`](#back) provides a basic animation where the object goes slightly back before moving forward
- [`bounce`](#bounce) provides a bouncing animation
- [`ease`](#ease) provides a basic inertial animation
- [`elastic`](#elastic) provides a basic spring interaction

### Standard functions

Three standard easing functions are provided:

- [`linear`](#linear)
- [`quad`](#quad)
- [`cubic`](#cubic)

The [`poly`](#poly) function can be used to implement quartic, quintic, and other higher power functions.

### Additional functions

Additional mathematical functions are provided by the following methods:

- [`bezier`](#bezier) provides a cubic bezier curve
- [`circle`](#circle) provides a circular function
- [`sin`](#sin) provides a sinusoidal function
- [`exp`](#exp) provides an exponential function

The following helpers are used to modify other easing functions.

- [`in`](#in) runs an easing function forwards
- [`inOut`](#inout) makes any easing function symmetrical
- [`out`](#out) runs an easing function backwards

## Example

```js
import React from 'react';
import {
  Animated,
  Easing,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const App = () => {
  let opacity = new Animated.Value(0);

  const animate = easing => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1200,
      easing,
    }).start();
  };

  const size = opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  const animatedStyles = [
    styles.box,
    {
      opacity,
      width: size,
      height: size,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Text style={styles.title}>Press rows below to preview the Easing!</Text>
      <View style={styles.boxContainer}>
        <Animated.View style={animatedStyles} />
      </View>
      <SectionList
        style={styles.list}
        sections={SECTIONS}
        keyExtractor={item => item.title}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => animate(item.easing)} style={styles.listRow}>
            <Text>{item.title}</Text>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.listHeader}>{title}</Text>
        )}
      />
    </View>
  );
};

const SECTIONS = [
  {
    title: 'Predefined animations',
    data: [
      { title: 'Bounce', easing: Easing.bounce },
      { title: 'Ease', easing: Easing.ease },
      { title: 'Elastic', easing: Easing.elastic(4) },
    ],
  },
  {
    title: 'Standard functions',
    data: [
      { title: 'Linear', easing: Easing.linear },
      { title: 'Quad', easing: Easing.quad },
      { title: 'Cubic', easing: Easing.cubic },
    ],
  },
  {
    title: 'Additional functions',
    data: [
      {
        title: 'Bezier',
        easing: Easing.bezier(0, 2, 1, -1),
      },
      { title: 'Circle', easing: Easing.circle },
      { title: 'Sin', easing: Easing.sin },
      { title: 'Exp', easing: Easing.exp },
    ],
  },
  {
    title: 'Combinations',
    data: [
      {
        title: 'In + Bounce',
        easing: Easing.in(Easing.bounce),
      },
      {
        title: 'Out + Exp',
        easing: Easing.out(Easing.exp),
      },
      {
        title: 'InOut + Elastic',
        easing: Easing.inOut(Easing.elastic(1)),
      },
    ],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20232a',
  },
  title: {
    marginTop: 10,
    textAlign: 'center',
    color: '#61dafb',
  },
  boxContainer: {
    height: 160,
    alignItems: 'center',
  },
  box: {
    marginTop: 32,
    borderRadius: 4,
    backgroundColor: '#61dafb',
  },
  list: {
    backgroundColor: '#fff',
  },
  listHeader: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f4f4f4',
    color: '#999',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  listRow: {
    padding: 8,
  },
});

export default App;
```

---

# Reference

## Methods

### `step0()`

```js
static step0(n)
```

A stepping function, returns 1 for any positive value of `n`.

---

### `step1()`

```js
static step1(n)
```

A stepping function, returns 1 if `n` is greater than or equal to 1.

---

### `linear()`

```js
static linear(t)
```

A linear function, `f(t) = t`. Position correlates to elapsed time one to one.

http://cubic-bezier.com/#0,0,1,1

---

### `ease()`

```js
static ease(t)
```

A basic inertial interaction, similar to an object slowly accelerating to speed.

http://cubic-bezier.com/#.42,0,1,1

---

### `quad()`

```js
static quad(t)
```

A quadratic function, `f(t) = t * t`. Position equals the square of elapsed time.

http://easings.net/#easeInQuad

---

### `cubic()`

```js
static cubic(t)
```

A cubic function, `f(t) = t * t * t`. Position equals the cube of elapsed time.

http://easings.net/#easeInCubic

---

### `poly()`

```js
static poly(n)
```

A power function. Position is equal to the Nth power of elapsed time.

n = 4: http://easings.net/#easeInQuart n = 5: http://easings.net/#easeInQuint

---

### `sin()`

```js
static sin(t)
```

A sinusoidal function.

http://easings.net/#easeInSine

---

### `circle()`

```js
static circle(t)
```

A circular function.

http://easings.net/#easeInCirc

---

### `exp()`

```js
static exp(t)
```

An exponential function.

http://easings.net/#easeInExpo

---

### `elastic()`

```js
static elastic(bounciness)
```

A basic elastic interaction, similar to a spring oscillating back and forth.

Default bounciness is 1, which overshoots a little bit once. 0 bounciness doesn't overshoot at all, and bounciness of N > 1 will overshoot about N times.

http://easings.net/#easeInElastic

---

### `back()`

```js
static back(s)
```

Use with `Animated.parallel()` to create a basic effect where the object animates back slightly as the animation starts.

---

### `bounce()`

```js
static bounce(t)
```

Provides a basic bouncing effect.

http://easings.net/#easeInBounce

---

### `bezier()`

```js
static bezier(x1, y1, x2, y2)
```

Provides a cubic bezier curve, equivalent to CSS Transitions' `transition-timing-function`.

A useful tool to visualize cubic bezier curves can be found at http://cubic-bezier.com/

---

### `in()`

{/* prettier-ignore-start */}
```js
static in(easing);
```
{/* prettier-ignore-end */}

Runs an easing function forwards.

---

### `out()`

```js
static out(easing)
```

Runs an easing function backwards.

---

### `inOut()`

```js
static inOut(easing)
```

Makes any easing function symmetrical. The easing function will run forwards for half of the duration, then backwards for the rest of the duration.
