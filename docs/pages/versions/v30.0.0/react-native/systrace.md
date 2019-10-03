---
id: systrace
title: Systrace
---

### Methods

- [`installReactHook`](../systrace/#installreacthook)
- [`setEnabled`](../systrace/#setenabled)
- [`isEnabled`](../systrace/#isenabled)
- [`beginEvent`](../systrace/#beginevent)
- [`endEvent`](../systrace/#endevent)
- [`beginAsyncEvent`](../systrace/#beginasyncevent)
- [`endAsyncEvent`](../systrace/#endasyncevent)
- [`counterEvent`](../systrace/#counterevent)
- [`attachToRelayProfiler`](../systrace/#attachtorelayprofiler)
- [`swizzleJSON`](../systrace/#swizzlejson)
- [`measureMethods`](../systrace/#measuremethods)
- [`measure`](../systrace/#measure)

---

# Reference

## Methods

### `installReactHook()`

```javascript

static installReactHook(useFiber)

```

---

### `setEnabled()`

```javascript

static setEnabled(enabled)

```

---

### `isEnabled()`

```javascript

static isEnabled()

```

---

### `beginEvent()`

```javascript

static beginEvent(profileName?, args?)

```

beginEvent/endEvent for starting and then ending a profile within the same call stack frame.

---

### `endEvent()`

```javascript

static endEvent()

```

---

### `beginAsyncEvent()`

```javascript

static beginAsyncEvent(profileName?)

```

beginAsyncEvent/endAsyncEvent for starting and then ending a profile where the end can either occur on another thread or out of the current stack frame, eg await the returned cookie variable should be used as input into the endAsyncEvent call to end the profile.

---

### `endAsyncEvent()`

```javascript

static endAsyncEvent(profileName?, cookie?)

```

---

### `counterEvent()`

```javascript

static counterEvent(profileName?, value?)

```

Register the value to the profileName on the systrace timeline.

---

### `attachToRelayProfiler()`

```javascript

static attachToRelayProfiler(relayProfiler)

```

Relay profiles use await calls, so likely occur out of current stack frame therefore async variant of profiling is used.

---

### `swizzleJSON()`

```javascript

static swizzleJSON()

```

This is not called by default due to performance overhead, but it's useful for finding traces which spend too much time in JSON.

---

### `measureMethods()`

```javascript

static measureMethods(object, objectName, methodNames)

```

Measures multiple methods of a class. For example, the following will return the `parse` and `stringify` methods of the JSON class: Systrace.measureMethods(JSON, 'JSON', ['parse', 'stringify']);

@param object @param objectName @param methodNames Map from method names to method display names.

---

### `measure()`

```javascript

static measure(objName, fnName, func)

```

Returns a profiled version of the input function. For example, you can: JSON.parse = Systrace.measure('JSON', 'parse', JSON.parse);

@param objName @param fnName @param {function} func @return {function} replacement function
