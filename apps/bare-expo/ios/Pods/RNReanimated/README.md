# react-native-reanimated

React Native's Animated library reimplemented.

It provides a more comprehensive, low level abstraction for the Animated library API to be built on top of and hence allow for much greater flexibility especially when it comes to gesture based interactions.

![](/assets/meme.png)

## OMG, why would you build this? (motivation)

`Animated` library has several limitations that become troubling when it comes to gesture based interactions.
I started this project initially to resolve the issue of pan interaction when the object can be dragged along the screen and when released it should snap to some place on the screen.
The problem was that despite using `Animated.event` and mapping gesture state to the position of the box, and making this whole interaction run on UI thread with `useNativeDriver` flag, we still had to call back into JS at the end of the gesture for us to start "snap" animation.
This is because `Animated.spring({}).start()` cannot be used in a "declarative" manner, because when it gets executed it has a "side effect" of starting a process (an animation) that updates the value for some time.
Adding "side effect" nodes into the current Animated implementation turned out to be a pretty difficult task as the execution model of the Animated API runs all the dependent nodes of each frame for the views that need to update.
We don't want to run "side effects" more often than necessary as it would, for example, result in the animation starting multiple times.

Another reason why I started rethinking how the internals of `Animated` can be redesigned was my recent work on porting "Animated Tracking" functionality to the native driver.
Apparently, even though the native driver is out for quite a while, it still does not support all the things non-native `Animated` lib can do.
Obviously, it is far more difficult to build three versions of each feature (JS, Android and iOS) instead of one, and the same applies for fixing bugs.
One of the goals of `react-native-reanimated` was to provide a more generic building block for the API that would allow for building more complex features only in JS and make the native codebase as minimal as possible.
Taking "diffClamp" node as an example, it is currently implemented in three different places in `Animated` core and even though it is pretty useful it actually only has one use case (collapsible scrollview header).

On a similar topic, I come across React Native's PR [#18029](https://github.com/facebook/react-native/pull/18029) and even though it provides a legitimate use case, I understand the maintainers being hesitant about merging it. The `Animated` API shouldn't block people from building things like this and the goal of `react-native-reanimated` is to provide lower level access that would allow for implementing that and many more features with no necessary changes to the core of the library.

You can watch my [React Europe talk](https://www.youtube.com/watch?v=kdq4z2708VM) where I explain the motivation.

The goals:
 - More generic primitive node types leading to more code reuse for the library internals therefore making it easier to add new features and fix bugs.
 - The new set of base nodes can be used to implement `Animated` compatible API including:
  - Complex nodes such as “diffClamp”.
  - Interactions such as animated value tracking or animation staggering.
 - Conditional evaluation & nodes with side effects (`set`, `startClock`, `stopClock`).
 - No more “useNativeDriver” – all animations runs on the UI thread by default

## Getting started

Before you get started you should definitely familiarize yourself with the original Animated API first. Refer to the API description below and to the [Examples](#examples) section to learn how to use this library.

Throughout this document when we refer to classes or methods prefixed with `Animated` we usually refer to them being imported from `react-native-reanimated` package instead of plain `react-native`.

### Installation

I. First install the library from npm repository using `yarn`:
```bash
  yarn add react-native-reanimated
```

II. Link native code with `react-native` cli:
```bash
  react-native link react-native-reanimated
```

III. When you want to use "reanimated" in your project import it from `react-native-reanimated` package:
```js
import Animated from 'react-native-reanimated';
```

Similarly when you need `Easing` import it from `react-native-reanimated` package instead of `react-native`:
```js
import Animated, { Easing } from 'react-native-reanimated';
```

# Transitions 🆕

Transitions is an experimental API distributed as a part of reanimated which serves the purpose of animating between two states of view hierarchy. It is conceptually similar to `LayoutAnimation` concept from react native but gives much better control of what and how is going to be animated.

Transitions API consists of two main building blocks. First one being `Transitioning.View` which is an extension of regular react-native view, so you can use any `View` props you'd like. The `Transitioning.View` is a root of all the transition animations that will be happening and is used to scope the changes to its children. In order to have next transition animated you'd need to call `animateNextTransition()` on the `Transitioning.View` instance.

The second main building block is transition definition. Transitioning API uses JSX syntax that allows you to define how the transition animation should perform. You can use all the components from `Transition` object to combine the animation you want. Please see the below list for the documentation of transition components.

## Transition groups

The below set of components can be used to group one or more transitions. You can also nest transition groups in order to achieve desirable effects.

### `<Transition.Together>`

Transitions nested under this component will run in parallel when the animation starts.

### `<Transition.Sequence>`

Transitions nested under this component will run in sequence in the order at which they are listed

## Transitions

Transition components can be used separately or as a part of a group. Each transition component has the following common properties you can use to configure the animation:

#### `durationMs`

The time animation takes to execute in milliseconds

#### `delayMs`

Use this if you want the animation to start delayed (value in milliseconds)

#### `interpolation`

Specify the transition timing curve. Possible values are: `linear`, `easeIn`, `easeOut`, `easeInOut`

#### `propagation`

Allows for the framework to automatically delay beginning of transitions across a set of different views depending on their position. The possible values are `top`, `bottom`, `left` and `right`. When `propagation="top"` it means that the first element that will start animating is the one that is closest to the top of `Transitioning.View` container, then the other views will be delayed by the amount which depends on their distance from the top edge.

### `<Transition.In>`

Allows to specify how views that get mounted durion animation transition get animated. In addition to the above parameters you can specify the type of animation using `type` prop. The possible values are: `fade`, `scale`, `slide-top`, `slide-bottom`, `slide-left`, `slide-right`.

### `<Transition.Out>`

Allows to specify how the framework should animate views that are being removed during transition. In addition to the above parameters you can specify the type of animation using `type` prop. The possible values are: `fade`, `scale`, `slide-top`, `slide-bottom`, `slide-left`, `slide-right`.

### `<Transition.Change>`

Use `Transition.Change` component to specify how components' which properties get changed during transition should be animated. The framework currently supports an animating position, bounds and transforms.

## How to use it

This API is still experimental and is a subject to change. Please refer to our [Example app](https://github.com/kmagiera/react-native-reanimated/tree/master/Example/transitions) to see how it can be used in practice in the current shape.


# Reanimated overview

We aim to bring this project to be fully compatible with `Animated` API. We believe that the set of base nodes we have selected should make this possible to be done only by writing JS code and does not require significant changes in the native codebases. Here is a list of things that haven't yet been ported from the original version of `Animated` library.
All the functionality that missing elements provide in `Animated` can already be achieved with `react-native-reanimated` although a different methodology for implementing those may be required (e.g. check ["Running animations" section](#running-animations) to see how the implementation may differ).
 - [ ] using value offsets
 - [ ] value tracking (can be achieved in different way, `react-native-reanimated` also allows for tracking all the animation parameters not only destination params)
 - [ ] animation staggering
 - [ ] animation delays

## Value
`Animated.Value` is a container for storing values. It's is initialized with `new Value(0)` constructor. For backward compatibility there are provided API for setting value after it has been initialized:
```js
const v = new Value(0);
/// ...
v.setValue(100);
```

## Clocks

Original `Animated` API makes an "animation" object a first class citizen.
`Animation` object has many features and therefore requires quite a few JS<>Native bridge methods to be managed properly.
In `react-native-reanimated`, clocks aim to replace that by providing more of a low level abstraction but also since clock nodes behave much like the animated values they make the implementation much less complex.

[`Animated.Clock`](#clocks) node is a special type of `Animated.Value` that can be updated in each frame to the timestamp of the current frame. When we take `Clock` node as an input, the value it returns is the current frame timestamp in milliseconds. Using special methods, clock nodes can be stopped and started and we can also test if clock has been started.

Because `Animated.Clock` just extends the `Animated.Value` you can use it in the same places (operations) where you can pass any type of animated node.

## At most once evaluation (the algorithm)

Unlike the original `Animated` library where each node could have been evaluated many times within a single frame, `react-native-reanimated` restricts each node to be evaluated at most once in a frame.
This restriction is required for nodes that have side-effects to be used (e.g. [`set`](#set) or [`startClock`](#startClock)).
When node is evaluated (e.g. in case of an [`add`](#add) node we want to get a sum of the input nodes) its value is cached. If within the next frame there are other nodes that want to use the output of that node instead of evaluating we return cached value.
This notion also helps with performance as we can try to evaluate as few nodes as expected.
The current algorithm for making decisions of which nodes to evaluate works as follows:
 1. for each frame we first analyze the generated events (e.g. touch stream). It is possible that events may update some animated values.
 2. Then we update values that correspond to [clock](#clocks) nodes that are "running".
 3. We traverse the node's tree starting from the nodes that have been updated in the current cycle and we look for final nodes that are connected to views.
 4. If we found nodes connected to view properties we evaluate them. This can recursively trigger an evaluation for their input nodes etc.
 5. After everything is done we check if some "running" clocks exists. If so we enqueue a callback to be evaluated with the next frame and start over from pt 1. Otherwise we do nothing.

## Blocks

Blocks are just arrays of nodes that are being evaluated in a particular order and return the value of the last node. It can be created using [`block`](#block) command but also when passed as an argument to other nodes the [`block`](#block) command can be omitted and we can just pass a nodes array directly. See an example below:

```js
cond(
  eq(state, State.ACTIVE),
  [
    stopClock(clock),
    set(transX, add(transX, diffX))
  ],
  runTiming(clock, state, config)
)
```

Passing array directly is equivalent to wrapping it with the [`block`](#block) command.

# API reference

## Views, props, etc

Follow the original `Animated` library guides to learn how values can be connected to View attributes.
Similarly with `react-native-reanimated` you need to use components prefixed with `Animated.` (remember to [import](#getting-started) `Animated` from reanimated package). For example:

```js
import Animated from 'react-native-reanimated';

// use
<Animated.View/>
// instead of
<View/>
```

## `Animated.Code`

`Animated.Code` component allows you to define reanimated nodes that you want to execute when their input nodes updates, but aren't necessarily strictly related to some view properties and hence it does not feel right to place them under `translate` or other prop of an `Animated.View`. This component renders `null`, so you can place it in any place you want in your render method. It is required that your code is put inside component as we rely on `componentDidMount` and `componentWillUnmount` callbacks to install and cleanup animated nodes. Note that the code you put is going to be executed only once. We currently have no way of telling if your code changes and so it will only be run in `componentDidMount`. If you wish for your reanimated nodes to be updated when the component updates, you can update the `key` property of the `Animated.Code` component, which will effectively unmount old and mount new versions of it in the React tree.
```js
<Animated.Code>
  { ()=>
        block([
          set(this.transX1, add(multiply(-1, this._transX))),
          set(this.transX2, add(multiply(-2, this._transX), 120)),
          set(this.transX3, sub(multiply(2, this._transX), 120)),
          set(this.transX4, add(multiply(1, this._transX))),
        ])
  }
</Animated.Code>
```

or:

```js
<Animated.Code exec={
block([
  set(this.transX1, add(multiply(-1, this._transX))),
  set(this.transX2, add(multiply(-2, this._transX), 120)),
  set(this.transX3, sub(multiply(2, this._transX), 120)),
  set(this.transX4, add(multiply(1, this._transX))),
])
}/>
```

## `Animated.useCode`

The `useCode` hook acts as an alternative to the `Animated.Code` component.
```js
Animated.useCode(node, deps)
```
It's passed an animated node and an array of dependencies, and updates that node both when the component mounts and every time a value in that array changes. It does nothing on versions of React Native that don't support hooks (<0.59).
```js
const [offset, setOffset] = React.useState(20);
Animated.useCode(
  set(transX1, add(_transX, offset)),
  [offset]
);
```

## Event handling with reanimated nodes

`react-native-reanimated`'s new syntax is possible to be used with `Animated.event`. Instead of providing only a mapping from event fields to animated nodes, it is allowed to write a function that takes reanimated values map as an input and return a block (or any other reanimated function) that will be then used to handle the event.

This syntax allows for providing some post-processing for the event data that does not fit well as a dependency of other nodes we connect to `Animated.View` component props.
[See example](https://github.com/kmagiera/react-native-reanimated/blob/master/Example/movable/index.js)
```js
this.onGestureEvent = event([
  {
    nativeEvent: {
      translationX: x => set(this._x, x)
    },
  },
]);
```

If you'd like to use more than one event attribute in your reanimated code, this is also supported. Instead of defining event handler methods for a single attribute you can define at the level of `nativeEvent`. Here is an example that takes both translation attributes and state attribute from `PanGestureHandler` event:
```js
<PanGestureHandler
  onGestureEvent={event([
    {
      nativeEvent: ({ translationX: x, translationY: y, state }) =>
        block([
          set(this._transX, add(x, offsetX)), set(this._transY, add(y, offsetY)),
          cond(eq(state, State.END), [set(this.offsetX, add(this.offsetX, x)), set(this.offsetY, add(this.offsetY, y))]),
        ]),
    },
  ])}
>
  <Animated.View
    style={{ transform: [{ translateX: this._transX, translateY: this._transY }], }}
  />
</PanGestureHandler>
```


## Available nodes

<!-- Base  -->

---
### `set`

```js
set(valueToBeUpdated, sourceNode)
```

When evaluated, it will assign the value of `sourceNode` to the `Animated.Value` passed as a first argument. In other words, it performs an assignment operation from the `sourceNode` to `valueToBeUpdated` value node and also returns a node that represents this value.

---
### `cond`

```js
cond(conditionNode, ifNode, [elseNode])
```

If `conditionNode` evaluates to "truthy" value the node evaluates `ifNode` node and returns its value, otherwise it evaluates `elseNode` and returns its value. `elseNode` is optional.

---
### `call`

```js
call(argsNodes, callback)
```

If one of the nodes from `argsNodes` array updates, `callback` will be called in JavaScript with a list of current values of nodes from `argsNodes` array as the first argument.

---
### `block`

```js
block([node1, ...])
```

Takes an array of nodes and evaluates all of them in the order they are put in the array. It then returns the value of the last node.

---
### `debug`

```js
debug(messageString, valueNode)
```

When the node is evaluated, it prints a string that contains the `messageString` concatenated with the value of `valueNode`. This then returns the value of `valueNode`. Logs are printed in the JS debugger if it's attached, in console if Expo client is being used, or else in the native console. Logs are visible only in `DEV` mode and have no effect on production builds. Note that `messageString` should be a normal string, not an animated node.

---
### `startClock`

```js
startClock(clockNode)
```

When evaluated, it will make `Clock` node passed as an argument start updating its value each frame. Then returns `0`.

---
### `stopClock`

```js
stopClock(clockNode)
```

When evaluated, it will make `Clock` node passed as an argument stop updating its value (if it has been doing that). Then returns `0`.

---
### `clockRunning`

```js
clockRunning(clockNode)
```

For a given `Clock` node, it returns `1` if the clock [has been started](#startClock) (if it's updating each frame) or returns `0` otherwise.

---
### `event`

Works the same way as with the original `Animated` library.

---
### `add`

```js
add(nodeOrNumber1, nodeOrNumber2, ...)
```

Takes two or more animated nodes or values, and when evaluated, returns their sum.

---
### `sub`

```js
sub(nodeOrNumber1, nodeOrNumber2, ...)
```

Takes two or more animated nodes or values, and when evaluated, returns the result of subtracting their values in the exact order.

---
### `multiply`

```js
multiply(nodeOrNumber1, nodeOrNumber2, ...)
```

Takes two or more animated nodes or values, and when evaluated, returns the result of multiplying their values in the exact order.

---
### `divide`

```js
divide(nodeOrNumber1, nodeOrNumber2, ...)
```

Takes two or more animated nodes or values, and when evaluated, returns the result of dividing their values in the exact order.


---
### `pow`

```js
pow(nodeOrNumber1, nodeOrNumber2, ...)
```

Takes two or more animated nodes or values, and when evaluated, returns the result of first node to the second node power. If more than two nodes are present, the result from the previous step is used as a base and the third node as exponent. This process continues onward for the following nodes if these are present.

---
### `modulo`

```js
modulo(nodeOrNumber, nodeOrNumber)
```

Remainder after division of the first argument by the second one. modulo(a,0) will throw an error.

---
### `sqrt`

```js
sqrt(nodeOrNumber)
```

The square root of the given node. If the number is negative, an error is thrown.

---
### `sin`

```js
sin(node)
```

Returns a sine of the value (in radians) of the given node.

---
### `cos`

```js
cos(node)
```

Returns a cosine of the value (in radians) of the given node

---
### `tan`

```js
tan(node)
```

Returns a tangent of the value in radians of the given node

---
### `acos`

```js
acos(node)
```

Returns a arc-cosine of the value in radians of the given node

---
### `asin`

```js
asin(node)
```

Returns a arc-sine of the value in radians of the given node

---
### `atan`

```js
atan(node)
```

Returns a arc-tangent of the value in radians of the given node

---
### `exp`

```js
exp(node)
```

Returns an exponent of the value of the given node.

---
### `round`

```js
round(node)
```

Returns a node that rounds input value to the nearest integer.

---
### `floor`

```js
floor(node)
```

Returns a node that rounds a number down to its nearest integer. If the passed argument is an integer, the value will not be rounded.

---
### `ceil`

```js
ceil(node)
```

Returns a node that rounds a number upward to its nearest integer. If the passed argument is an integer, the value will not be rounded.

---
### `lessThan`

```js
lessThan(nodeOrValueA, nodeOrValueB)
```

Returns `1` if the value of the first node is less than the value of the second node. Otherwise returns `0`.

---
### `eq`

```js
eq(nodeOrValueA, nodeOrValueB)
```

Returns `1` if the value of both nodes are equal. Otherwise returns `0`.

---
### `greaterThan`


```js
greaterThan(nodeOrValueA, nodeOrValueB)
```

Returns `1` if the value of the first node is greater than the value of the second node. Otherwise returns `0`.

---
### `lessOrEq`

```js
lessOrEq(nodeOrValueA, nodeOrValueB)
```

Returns `1` if the value of the first node is less or equal to the value of the second node. Otherwise returns `0`.

---
### `greaterOrEq`

```js
greaterOrEq(nodeOrValueA, nodeOrValueB)
```

Returns `1` if the value of the first node is greater or equal to the value of the second node. Otherwise returns `0`.

---
### `neq`

```js
neq(nodeOrValueA, nodeOrValueB)
```

Returns `1` if the value of the first node is not equal to the value of the second node. Otherwise returns `0`.

---
### `and`

```js
and(nodeOrValue1, ...)
```

Acts as a logical `AND` operator. Takes one or more nodes as an input and evaluates them in sequence until some node evaluates to a "falsy" value. Then returns that value and stops evaluating further nodes. If all nodes evaluate to a "truthy" it returns the last node's value.

---
### `or`

```js
or(nodeOrValue1, ...)
```

Acts as a logical `OR` operator. Takes one or more nodes as an input and evaluates them in sequence until some node evaluates to a "truthy" value. Then returns that value and stops evaluating further nodes. If all nodes evaluate to a "falsy" value it returns the last node's value.

---
### `defined`

```js
defined(node)
```

Returns `1` if the given node evaluates to a "defined" value (that is to something that is non-null, non-undefined and non-NaN). Returns `0` otherwise.

---
### `not`

```js
not(node)
```

Returns `1` if the given node evaluates to a "falsy" value and `0` otherwise.

<!-- Derived -->

---
### `abs`

```js
abs(node)
```

Evaluates the given node and returns an absolute value of the node's value.

---
### `min`

```js
min(nodeOrValue1, nodeOrValue2)
```

Takes two nodes as an input and returns a minimum of all the node's values.

---
### `max`

```js
max(nodeOrValue1, nodeOrValue2)
```

Takes two nodes as an input and returns a maximum of all the node's values.

---
### `diff`

```js
diff(node)
```

Evaluates node and returns a difference between value returned at the last time it was evaluated and its value at the current time. When evaluating for the first time it returns the node's value.

---
### `acc`

```js
acc(node)
```

Returns an accumulated value of the given node. This node stores a sum of all evaluations of the given node and each time it gets evaluated it would add current node's value to that sum and return it.

---
### `diffClamp`

Works the same way as with the original `Animated` library.

---
### `interpolate`
```js
interpolate(node, {
  // Input range for the interpolation. Should be monotonically increasing.
  inputRange: [nodeOrValue...],
  // Output range for the interpolation, should be the same length as the input range.
  outputRange: [nodeOrValue...],
  // Sets the left and right extrapolate modes.
  extrapolate?: Extrapolate.EXTEND | Extrapolate.CLAMP | Extrapolate.IDENTITY,
  // Set the left extrapolate mode, the behavior if the input is less than the first value in inputRange.
  extrapolateLeft?: Extrapolate.EXTEND | Extrapolate.CLAMP | Extrapolate.IDENTITY,
  // Set the right extrapolate mode, the behavior if the input is greater than the last value in inputRange.
  extrapolateRight?: Extrapolate.EXTEND | Extrapolate.CLAMP | Extrapolate.IDENTITY,
})

Extrapolate.EXTEND; // Will extend the range linearly.
Extrapolate.CLAMP; // Will clamp the input value to the range.
Extrapolate.IDENTITY; // Will return the input value if the input value is out of range.
```

Maps an input value within a range to an output value within a range. Also supports different types of extrapolation for when the value falls outside the range.

---
### `color`

```js
color(red, green, blue, alpha)
```

Creates a color node in RGBA format, where the first three input nodes should have *integer* values in the range 0-255 (consider using `round` node if needed) and correspond to color components Red, Green and Blue respectively. Last input node should have a value between 0 and 1 and represents alpha channel (value `1` means fully opaque and `0` completely transparent). Alpha parameter can be ommited, then `1` (fully opaque) is used as a default.

The returned node can be mapped to view properties that represents color (e.g. [`backgroundColor`](https://facebook.github.io/react-native/docs/view-style-props.html#backgroundcolor)).

---
### `concat`
```js
concat(nodeOrValue1, ...)
```
Returns concatanation of given nodes (number or string) as string

---
### `onChange`

```js
onChange(value, action)
```
When evaluated, it will compare `value` to its previous value. If it has changed, `action` will be evaluated and its value will be returned.

<!-- Anims -->
## Animations

---
### `decay`

```js
decay(clock, { finished, velocity, position, time }, { deceleration })
```

Updates `position` and `velocity` nodes by running a single step of animation each time this node evaluates. State variable `finished` is set to `1` when the animation gets to the final point (that is the velocity drops under the level of significance). The `time` state node is populated automatically by this node and refers to the last clock time this node got evaluated. It is expected to be reset each time we want to restart the animation. Decay animation can be configured using `deceleration` config param and it controls how fast the animation decelerates. The value should be between `0` and `1` but only values that are close to `1` will yield meaningful results.

---
### `timing`

```js
timing(clock, { finished, position, frameTime, time }, { toValue, duration, easing })
```

Updates `position` node by running timing based animation from a given position to a destination determined by `toValue`. The animation is expected to last `duration` milliseconds and use `easing` function that could be set to one of the nodes exported by the `Easing` object.
The `frameTime` node will also get updated and represents the progress of animation in milliseconds (how long the animation has lasted so far), similar to the `time` node that just indicates the last clock time the animation node has been evaluated. Both of these variables are expected to be reset before restarting the animation. Finally `finished` node will be set to `1` when the position reaches the final value or when `frameTime` exceeds `duration`.

---
### `spring`

```js
spring(clock, { finished, position, velocity, time }, { damping, mass, stiffness, overshootClamping, restSpeedThreshold, restDisplacementThreshold, toValue })
```

When evaluated, updates `position` and `velocity` nodes by running a single step of spring based animation. Check the original `Animated` API docs to learn about the config parameters like `damping`, `mass`, `stiffness`, `overshootClamping`, `restSpeedThreshold` and `restDisplacementThreshold`. The `finished` state updates to `1` when the `position` reaches the destination set by `toValue`. The `time` state variable also updates when the node evaluates and it represents the clock value at the time when the node got evaluated for the last time. It is expected that `time` variable is reset before spring animation can be restarted.

### `SpringUtils`
For developers' convenience, it's possible to use a different way of configuring `spring` animation which follows behavior known from React Native core.

#### `SpringUtils.makeDefaultConfig()`
 Returns an object filled with default config of animation:
 ```js
  {
    stiffness: new Value(100),
    mass: new Value(1),
    damping: new Value(10),
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    toValue: new Value(0),
  }
```

#### `SpringUtils.makeConfigFromBouncinessAndSpeed(prevConfig)`
Transforms an object with `bounciness` and `speed` params into config expected by the `spring` node. `bounciness` and `speed` might be nodes or numbers.

#### `SpringUtils.makeConfigFromOrigamiTensionAndFriction(prevConfig)`
Transforms an object with `tension` and `friction` params into config expected by the `spring` node. `tension` and `friction` might be nodes or numbers.

See an [Example of different configs](https://github.com/kmagiera/react-native-reanimated/blob/master/Example/differentSpringConfigs/index.js).


## Running animations
### Declarative API
Invoking animation differs from the way it is done when using the original `Animated` API.
Here, instead of having animation objects we operate on nodes that can perform single animation steps.
In order to map an animation into a value, we will make the value to be assigned to a node that among few other things will call into the animation step node. Check [`timing`](#timing), [`decay`](#decay) and [`spring`](#spring) nodes documentation for some details about how animation step nodes can be configured.

The example below shows a component that renders:

```js
import Animated, { Easing } from 'react-native-reanimated';

const { Clock, Value, set, cond, startClock, clockRunning, timing, debug, stopClock, block } = Animated

function runTiming(clock, value, dest) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
  };

  const config = {
    duration: 5000,
    toValue: new Value(0),
    easing: Easing.inOut(Easing.ease),
  };

  return block([
    cond(clockRunning(clock), [
      // if the clock is already running we update the toValue, in case a new dest has been passed in
        set(config.toValue, dest),
    ], [
      // if the clock isn't running we reset all the animation params and start the clock
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.frameTime, 0),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    // we run the step here that is going to update position
    timing(clock, state, config),
    // if the animation is over we stop the clock
    cond(state.finished, debug('stop clock', stopClock(clock))),
    // we made the block return the updated position
    state.position,
  ]);
}

export class AnimatedBox extends Component {
  // we create a clock node
  clock = new Clock();
  // and use runTiming method defined above to create a node that is going to be mapped
  // to the translateX transform.
  transX = runTiming(this.clock, -120, 120);

  render() {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[styles.box, { transform: [{ translateX: this.transX }] }]}
        />
      </View>
    );
  }
}
```

### Backward compatible API
As it might sometimes be impractical to use the API above, there's an alternative way of invoking animation, which is similar to the original `Animated` API.
```js
class Example extends Component {
  constructor(props) {
    super(props);
    this._transX = new Value(0);
    this._config = {
      duration: 5000,
      toValue: 120,
      easing: Easing.inOut(Easing.ease),
    };
    this._anim = timing(this._transX, this._config);
  }

  render() {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[styles.box, { transform: [{ translateX: this._transX }] }]}
        />
        <Button
          onPress={() => {
            this._anim.start();
          }}
          title="Start"
        />
      </View>
    );
  }
}
```
This API gives the possibility to use animation with original `Animated` API. It's also a way of running animation on some interaction without necessity or rerendering view.

## 100% declarative gesture interactions

`react-native-reanimated` works best with the [Gesture Handler](https://kmagiera.github.io/react-native-gesture-handler) library. Currently all the examples are made using that library, including the ultimate [ImagePreview app](https://github.com/kmagiera/react-native-reanimated/blob/master/Example/imageViewer). See it in action below:

![](/assets/imagepreview.gif)

## Examples

The source code for the example (showcase) app is under the [`Example/`](https://github.com/kmagiera/react-native-reanimated/blob/master/Example/) directory.

In order to run it you need to pull in the repository, enter `Example/` folder and run:
```bash
  yarn install
```

Then run `react-native run-android` or `react-native run-ios` (depending on which platform you want to run the Example app on).

You will need to have an Android or iOS device or emulator connected as well as `react-native-cli` package installed globally.

## License

React native reanimated library is licensed under [The MIT License](LICENSE).

## Credits

This project is supported by amazing people from [Expo.io](https://expo.io) and [Software Mansion](https://swmansion.com)

[![expo](https://avatars2.githubusercontent.com/u/12504344?v=3&s=100 "Expo.io")](https://expo.io)
[![swm](https://avatars1.githubusercontent.com/u/6952717?v=3&s=100 "Software Mansion")](https://swmansion.com)
