---
id: using-a-scrollview
title: Using a ScrollView
---

The [ScrollView](scrollview.md) is a generic scrolling container that can contain multiple components and views. The scrollable items need not be homogeneous, and you can scroll both vertically and horizontally (by setting the `horizontal` property).

This example creates a vertical `ScrollView` with both images and text mixed together.

```javascript
import React, { Component } from 'react';
import { ScrollView, Image, Text } from 'react-native';

export default class IScrolledDownAndWhatHappenedNextShockedMe extends Component {
  render() {
    return (
      <ScrollView>
        <Text style={{ fontSize: 96 }}>Scroll me plz</Text>
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Text style={{ fontSize: 96 }}>If you like</Text>
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Text style={{ fontSize: 96 }}>Scrolling down</Text>
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Text style={{ fontSize: 96 }}>What's the best</Text>
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Text style={{ fontSize: 96 }}>Framework around?</Text>
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Image
          source={{
            uri: 'https://reactnative.dev/img/tiny_logo.png',
            width: 64,
            height: 64,
          }}
        />
        <Text style={{ fontSize: 80 }}>React Native</Text>
      </ScrollView>
    );
  }
}
```

ScrollViews can be configured to allow paging through views using swiping gestures by using the `pagingEnabled` props. Swiping horizontally between views can also be implemented on Android using the [ViewPager](https://github.com/react-native-community/react-native-viewpager) component.

On iOS a ScrollView with a single item can be used to allow the user to zoom content. Set up the `maximumZoomScale` and `minimumZoomScale` props and your user will be able to use pinch and expand gestures to zoom in and out.

The ScrollView works best to present a small amount of things of a limited size. All the elements and views of a `ScrollView` are rendered, even if they are not currently shown on the screen. If you have a long list of more items than can fit on the screen, you should use a `FlatList` instead. So let's [learn about list views](using-a-listview.md) next.
