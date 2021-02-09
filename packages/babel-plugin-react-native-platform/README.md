# babel-plugin-react-native-platform

Removes unused platform and development code from Expo projects.

# Options

## `platform: string`

The platform for which you want to compile: `'ios'`, `'android'`, `'web'`.

## `mode: string`

Dictates whether or not the build is in development or production mode: `'development', 'production'`

### Example Input

```js
if (__DEV__ || process.env.NODE_ENV === 'production') {
}
```

### Example Output

```js
if (true || 'development' === 'production') {
}
```

# Examples

The following examples show what the output of a lexical block looks like after it's been optimized with `expo build:web` (`babel-plugin-react-native-platform` & Webpack's Terser).

## If Statements

### Example Input

```js
import { Platform } from '@unimodules/core';

let value;

if (Platform.OS === 'ios') {
  value = 'ios';
} else if (Platform.OS == 'android') {
  value = 'android';
} else if (Platform.OS === 'web') {
  value = 'web';
} else {
  value = 'default';
}

console.log('Output', value);
```

### Before

```js
var value,
  Platform = {
    OS: 'web',
    select(e) {
      return 'web' in e ? e.web : e.default;
    },
  };
(value =
  Platform.OS === 'ios'
    ? 'ios'
    : Platform.OS == 'android'
    ? 'android'
    : Platform.OS === 'web'
    ? 'web'
    : 'default'),
  console.log('Output', value);
```

### After

```js
console.log('Output', 'web');
```

## `Platform.select`

### Example Input

```js
import { Platform } from 'react-native';

const value = Platform.select({
  ios: 'ios',
  android: 'android',
  web: 'web',
  default: 'default',
});

console.log('Output', value);
```

### Before

```js
var value = {
  OS: 'web',
  select(e) {
    return 'web' in e ? e.web : e.default;
  },
}.select({ ios: 'ios', android: 'android', web: 'web', default: 'default' });
console.log('Output', value);
```

### After

```js
console.log('Output', 'web');
```

## Switch Statements

### Example Input

```js
import { Platform } from 'react-native';

switch (Platform.OS) {
  case 'ios':
    console.log('iOS');
    break;
  case 'android':
    console.log('Android');
    break;
  case 'web':
    console.log('web');
    break;
  default:
    console.log('default');
    break;
}
```

### Before

```js
switch (
  {
    OS: 'web',
    select(e) {
      return 'web' in e ? e.web : e.default;
    },
  }.OS
) {
  case 'ios':
    console.log('iOS');
    break;
  case 'android':
    console.log('Android');
    break;
  case 'web':
    console.log('web');
    break;
  default:
    console.log('default');
}
```

### After

```js
console.log('web');
```
