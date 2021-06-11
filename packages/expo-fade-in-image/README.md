# expo-fade-in-image

Wrap Image components in `<FadeIn>` to have them fade in pleasantly when they finish loading.

## Installation

```
expo install expo-fade-in-image
```

## Usage

```javascript
import React from 'react';
import { Image } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

const uri = 'https://d3lwq5rlu14cro.cloudfront.net/v1/AQ5jDS5SYyUkapWWEviV.png';

class FancyImage extends React.Component {
  render() {
    return (
      <FadeIn>
        <Image source={{ uri }} style={{ width: 162, height: 28 }} />
      </FadeIn>
    );
  }
}
```

### props

- `style` adds style to the image wrapper.
- `renderPlaceholderContent` renders an element while loading the image, e.g. a spinner.
- `placeholderStyle` adds style to the placeholder wrapper, default background color is `#eee`.

## Example

See the [example
project
source](https://github.com/expo/react-native-fade-in-image/tree/master/example)
or try it out at https://exp.host/@community/fade-in-image-example

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
