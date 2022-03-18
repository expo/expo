# expo-dev-client-components

A package for sharing React Native components between different dev-client RN apps

## API documentation

```tsx
import { View, Spacer, Row, useExpoTheme, ChevronRightICon } from 'expo-dev-client-components';

function ExampleRow() {
  const theme = useExpoTheme();

  return (
    <View px="small" py="large">
      <Row align="center">
        <ChevronRightIcon />
        <Spacer.Horizontal size="tiny" />
        <Text size="large" style={{ color: theme.text.default }}>
          Enter URL manually
        </Text>
      </Row>
    </View>
  );
}
```

### Documentation

`create-primitive` is a utility that generates a set of themed react-native components.

Features:

- theme-ability
- typesafety
- clear and flexible API

## API

```tsx
import { Text } from 'react-native';
import { create } from './create-primitives';

const Heading = create(Text, {
  base: {
    fontFamily: 'Helvetica',
  },

  variants: {
    size: {
      large: {
        fontSize: 28,
        lineHeight: 34,
      },
      medium: {
        fontSize: 22,
        lineHeight: 28,
      },
      small: {
        fontSize: 18,
        lineHeight: 22,
      },
    },
    color: {
      success: {
        color: 'green',
      },
      danger: {
        color: 'red',
      },
    },
  },
});
```

This above produces a `Heading` component that can be used like so:

```tsx
function App() {
  return (
    <Heading size="medium" color="success">
      Hi
    </Heading>
  );
}
```

All of the variants are captured by typescript which makes using them a breeze.

## Declarative Selectors

We can extend the `Heading` component above with selectors:

```tsx
const Heading = create(RNText, {
  variants: {
    // ....
  },
  selectors: {
    // when device theme is 'light'...
    light: {
      color: {
        // ...any `Heading` with `color="success"`...
        success: {
          // ...will have these styles applied
          color: 'green',
        },
      },
    },
  },
});
```

You can also pass selectors to primitives for one-off instances where you need a specific style:

```tsx
function App() {
  return (
    <View>
      <Heading
        selectors={{
          dark: { color: 'green' },
          light: { color: 'blue' },
        }}>
        Hi
      </Heading>
    </View>
  );
}
```

## Flexibility

You can use any style library you'd like - for example using tailwind for a terser, readable configuration.

```tsx
import tw from 'somewhere';
import { create } from './create-primitives';

const Heading = create(RNText, {
  size: {
    large: tw('text-4xl'),
    medium: tw('text-3xl'),
    small: tw('text-2xl'),
  },
  weight: {
    normal: tw('font-medium'),
    heavy: tw('font-semibold'),
  },
  color: {
    success: tw('text-green-500'),
    danger: tw('text-red-500'),
  },
});
```

## Installation in managed Expo projects

There are no native dependencies exported and so this module should be compatible with any RN project

## Installation in bare React Native projects

There are no native dependencies exported and so this module should be compatible with any RN project

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
