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

## Installation in managed Expo projects

There are no native dependencies exported and so this module should be compatible with any RN project

## Installation in bare React Native projects

There are no native dependencies exported and so this module should be compatible with any RN project

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
