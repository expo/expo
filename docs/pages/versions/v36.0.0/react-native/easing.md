---
id: easing
title: Easing
---

The `Easing` module implements common easing functions. This module is used by [Animated.timing()](animated.md#timing) to convey physically believable motion in animations.

You can find a visualization of some common easing functions at http://easings.net/

### Predefined animations

The `Easing` module provides several predefined animations through the following methods:

- [`back`](easing.md#back) provides a basic animation where the object goes slightly back before moving forward
- [`bounce`](easing.md#bounce) provides a bouncing animation
- [`ease`](easing.md#ease) provides a basic inertial animation
- [`elastic`](easing.md#elastic) provides a basic spring interaction

### Standard functions

Three standard easing functions are provided:

- [`linear`](easing.md#linear)
- [`quad`](easing.md#quad)
- [`cubic`](easing.md#cubic)

The [`poly`](easing.md#poly) function can be used to implement quartic, quintic, and other higher power functions.

### Additional functions

Additional mathematical functions are provided by the following methods:

- [`bezier`](easing.md#bezier) provides a cubic bezier curve
- [`circle`](easing.md#circle) provides a circular function
- [`sin`](easing.md#sin) provides a sinusoidal function
- [`exp`](easing.md#exp) provides an exponential function

The following helpers are used to modify other easing functions.

- [`in`](easing.md#in) runs an easing function forwards
- [`inOut`](easing.md#inout) makes any easing function symmetrical
- [`out`](easing.md#out) runs an easing function backwards

---

# Reference

## Methods

### `step0()`

```jsx

static step0(n)

```

A stepping function, returns 1 for any positive value of `n`.

---

### `step1()`

```jsx

static step1(n)

```

A stepping function, returns 1 if `n` is greater than or equal to 1.

---

### `linear()`

```jsx

static linear(t)

```

A linear function, `f(t) = t`. Position correlates to elapsed time one to one.

http://cubic-bezier.com/#0,0,1,1

---

### `ease()`

```jsx

static ease(t)

```

A basic inertial interaction, similar to an object slowly accelerating to speed.

http://cubic-bezier.com/#.42,0,1,1

---

### `quad()`

```jsx

static quad(t)

```

A quadratic function, `f(t) = t * t`. Position equals the square of elapsed time.

http://easings.net/#easeInQuad

---

### `cubic()`

```jsx

static cubic(t)

```

A cubic function, `f(t) = t * t * t`. Position equals the cube of elapsed time.

http://easings.net/#easeInCubic

---

### `poly()`

```jsx

static poly(n)

```

A power function. Position is equal to the Nth power of elapsed time.

n = 4: http://easings.net/#easeInQuart n = 5: http://easings.net/#easeInQuint

---

### `sin()`

```jsx

static sin(t)

```

A sinusoidal function.

http://easings.net/#easeInSine

---

### `circle()`

```jsx

static circle(t)

```

A circular function.

http://easings.net/#easeInCirc

---

### `exp()`

```jsx

static exp(t)

```

An exponential function.

http://easings.net/#easeInExpo

---

### `elastic()`

```jsx

static elastic(bounciness)

```

A basic elastic interaction, similar to a spring oscillating back and forth.

Default bounciness is 1, which overshoots a little bit once. 0 bounciness doesn't overshoot at all, and bounciness of N > 1 will overshoot about N times.

http://easings.net/#easeInElastic

---

### `back()`

```jsx

static back(s)

```

Use with `Animated.parallel()` to create a basic effect where the object animates back slightly as the animation starts.

---

### `bounce()`

```jsx

static bounce(t)

```

Provides a basic bouncing effect.

http://easings.net/#easeInBounce

---

### `bezier()`

```jsx

static bezier(x1, y1, x2, y2)

```

Provides a cubic bezier curve, equivalent to CSS Transitions' `transition-timing-function`.

A useful tool to visualize cubic bezier curves can be found at http://cubic-bezier.com/

---

### `in()`

```jsx
static in easing;
```

Runs an easing function forwards.

---

### `out()`

```jsx

static out(easing)

```

Runs an easing function backwards.

---

### `inOut()`

```jsx

static inOut(easing)

```

Makes any easing function symmetrical. The easing function will run forwards for half of the duration, then backwards for the rest of the duration.
