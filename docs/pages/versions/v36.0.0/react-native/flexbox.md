---
id: flexbox
title: Layout with Flexbox
---

A component can specify the layout of its children using the Flexbox algorithm. Flexbox is designed to provide a consistent layout on different screen sizes.

You will normally use a combination of `flexDirection`, `alignItems`, and `justifyContent` to achieve the right layout.

> Flexbox works the same way in React Native as it does in CSS on the web, with a few exceptions. The defaults are different, with `flexDirection` defaulting to `column` instead of `row`, and the `flex` parameter only supporting a single number.

### Flex

[`flex`](https://reactnative.dev/docs/layout-props#flex) will define how your items are going to **“fill”** over the available space along your main axis. Space will be divided according to each element's flex property.

In the following example the red, yellow and the green views are all children in the container view that has `flex: 1` set. The red view uses `flex: 1` , the yellow view uses `flex: 2` and the green view uses `flex: 3` . **1+2+3 = 6** which means that the red view will get `1/6` of the space, the yellow `2/6` of the space and the green `3/6` of the space.

![Flex](https://cdn-images-1.medium.com/max/800/1*PhCFmO5tYX_sZSyCd4vO3w.png)

#### Flex Direction

[`flexDirection`](https://reactnative.dev/docs/layout-props#flexdirection) controls the direction in which the children of a node are laid out. This is also referred to as the _main axis_. The cross axis is the axis perpendicular to the main axis, or the axis which the wrapping lines are laid out in.

- `row` Align children from left to right. If wrapping is enabled then the next line will start under the first item on the left of the container.

- `column` (**default value**) Align children from top to bottom. If wrapping is enabled then the next line will start to the left first item on the top of the container.

- `row-reverse` Align children from right to left. If wrapping is enabled then the next line will start under the first item on the right of the container.

- `column-reverse` Align children from bottom to top. If wrapping is enabled then the next line will start to the left first item on the bottom of the container.

LEARN MORE [HERE](https://yogalayout.com/docs/flex-direction)

```javascript
import React, { Component } from 'react';
import { View } from 'react-native';

export default class FlexDirectionBasics extends Component {
  render() {
    return (
      // Try setting `flexDirection` to `column`.
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: 50, height: 50, backgroundColor: 'powderblue' }} />
        <View style={{ width: 50, height: 50, backgroundColor: 'skyblue' }} />
        <View style={{ width: 50, height: 50, backgroundColor: 'steelblue' }} />
      </View>
    );
  }
}
```

![Flex Direction](https://cdn-images-1.medium.com/max/800/1*rA7IbuUsJWsx6evKAsabVw.png)

### Layout Direction

Layout direction specifies the direction in which children and text in a hierarchy should be laid out. Layout direction also affects what edge `start` and `end` refer to. By default React Native lays out with LTR layout direction. In this mode `start` refers to left and `end` refers to right.

- `LTR` (**default value**) Text and children are laid out from left to right. Margin and padding applied the start of an element are applied on the left side.

- `RTL` Text and children are laid out from right to left. Margin and padding applied the start of an element are applied on the right side.

#### Justify Content

[`justifyContent`](https://reactnative.dev/docs/layout-props#justifycontent) describes how to align children within the main axis of their container. For example, you can use this property to center a child horizontally within a container with `flexDirection` set to `row` or vertically within a container with `flexDirection` set to `column`.

- `flex-start`(**default value**) Align children of a container to the start of the container's main axis.

- `flex-end` Align children of a container to the end of the container's main axis.

- `center` Align children of a container in the center of the container's main axis.

- `space-between` Evenly space of children across the container's main axis, distributing remaining space between the children.

- `space-around` Evenly space of children across the container's main axis, distributing remaining space around the children. Compared to `space-between` using `space-around` will result in space being distributed to the beginning of the first child and end of the last child.

- `space-evenly` Evenly distributed within the alignment container along the main axis. The spacing between each pair of adjacent items, the main-start edge and the first item, and the main-end edge and the last item, are all exactly the same.

LEARN MORE [HERE](https://yogalayout.com/docs/justify-content)

```javascript
import React, { Component } from 'react';
import { View } from 'react-native';

export default class JustifyContentBasics extends Component {
  render() {
    return (
      // Try setting `justifyContent` to `center`.
      // Try setting `flexDirection` to `row`.
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
        <View style={{ width: 50, height: 50, backgroundColor: 'powderblue' }} />
        <View style={{ width: 50, height: 50, backgroundColor: 'skyblue' }} />
        <View style={{ width: 50, height: 50, backgroundColor: 'steelblue' }} />
      </View>
    );
  }
}
```

![Justify Content](https://cdn-images-1.medium.com/max/800/1*i5TVlme-TisAVvD5ax2yPA.png)

#### Align Items

[`alignItems`](https://reactnative.dev/docs/layout-props#alignitems) describes how to align children along the cross axis of their container. Align items is very similar to `justifyContent` but instead of applying to the main axis, `alignItems` applies to the cross axis.

- `stretch` (**default value**) Stretch children of a container to match the `height` of the container's cross axis.

- `flex-start` Align children of a container to the start of the container's cross axis.

- `flex-end` Align children of a container to the end of the container's cross axis.

- `center` Align children of a container in the center of the container's cross axis.

- `baseline` Align children of a container along a common baseline. Individual children can be set to be the reference baseline for their parents.

> For `stretch` to have an effect, children must not have a fixed dimension along the secondary axis. In the following example, setting `alignItems: stretch` does nothing until the `width: 50` is removed from the children.

LEARN MORE [HERE](https://yogalayout.com/docs/align-items)

```javascript
import React, { Component } from 'react';
import { View } from 'react-native';

export default class AlignItemsBasics extends Component {
  render() {
    return (
      // Try setting `alignItems` to 'flex-start'
      // Try setting `justifyContent` to `flex-end`.
      // Try setting `flexDirection` to `row`.
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
        <View style={{ width: 50, height: 50, backgroundColor: 'powderblue' }} />
        <View style={{ height: 50, backgroundColor: 'skyblue' }} />
        <View style={{ height: 100, backgroundColor: 'steelblue' }} />
      </View>
    );
  }
}
```

![Align Items](https://cdn-images-1.medium.com/max/800/1*evkM7zfxt-9p-HJ1M0Bh2g.png)

### Align Self

[`alignSelf`](https://reactnative.dev/docs/layout-props#alignself) has the same options and effect as `alignItems` but instead of affecting the children within a container, you can apply this property to a single child to change its alignment within its parent. `alignSelf` overrides any option set by the parent with `alignItems`.

![Align Self](https://cdn-images-1.medium.com/max/800/1*J1JCoKwLCokX9JXVBvP71g.png)

### Align Content

[alignContent](https://reactnative.dev/docs/layout-props#aligncontent) defines the distribution of lines along the cross-axis. This only has effect when items are wrapped to multiple lines using `flexWrap`.

- `flex-start` (**default value**) Align wrapped lines to the start of the container's cross axis.

- `flex-end` Align wrapped lines to the end of the container's cross axis.

- `stretch` wrapped lines to match the height of the container's cross axis.

- `center` Align wrapped lines in the center of the container's cross axis.

- `space-between` Evenly space wrapped lines across the container's main axis, distributing remaining space between the lines.

- `space-around` Evenly space wrapped lines across the container's main axis, distributing remaining space around the lines. Compared to space between using space around will result in space being distributed to the begining of the first lines and end of the last line.

LEARN MORE [HERE](https://yogalayout.com/docs/align-content)

![Align Content](https://cdn-images-1.medium.com/max/800/1*cC2XFyCF_igp20Ombt4wBw.png)

### Flex Wrap

The [`flexWrap`](https://reactnative.dev/docs/layout-props#flexwrap) property is set on containers and controls what happens when children overflow the size of the container along the main axis. By default children are forced into a single line (which can shrink elements). If wrapping is allowed items are wrapped into multiple lines along the main axis if needed.

When wrapping lines `alignContent` can be used to specify how the lines are placed in the container. learn more [here](https://yogalayout.com/docs/flex-wrap)

![Flex Wrap](https://cdn-images-1.medium.com/max/800/1*_7v4uQhSsuCn1cfeOMVfrA.png)

### Flex Basis, Grow, and Shrink

- [`flexGrow`](https://reactnative.dev/docs/layout-props#flexgrow) describes how any space within a container should be distributed among its children along the main axis. After laying out its children, a container will distribute any remaining space according to the flex grow values specified by its children.

  flexGrow accepts any floating point value >= 0, with 0 being the default value. A container will distribute any remaining space among its children weighted by the child’s flex grow value.

- [`flexShrink`](https://reactnative.dev/docs/layout-props#flexshrink) describes how to shrink children along the main axis in the case that the total size of the children overflow the size of the container on the main axis. Flex shrink is very similar to flex grow and can be thought of in the same way if any overflowing size is considered to be negative remaining space. These two properties also work well together by allowing children to grow and shrink as needed.

  Flex shrink accepts any floating point value >= 0, with 1 being the default value. A container will shrink its children weighted by the child’s flex shrink value.

- [`flexBasis`](https://reactnative.dev/docs/layout-props#flexbasis) is an axis-independent way of providing the default size of an item along the main axis. Setting the flex basis of a child is similar to setting the `width` of that child if its parent is a container with `flexDirection: row` or setting the `height` of a child if its parent is a container with `flexDirection: column`. The flex basis of an item is the default size of that item, the size of the item before any flex grow and flex shrink calculations are performed.

LEARN MORE [HERE](https://yogalayout.com/docs/flex)

### Width and Height

The `width` property in Yoga specifies the width of the element's content area. Similarly height property specifies the `height` of the element's content area.

Both `width` and `height` can take following values:

- `auto` Is the **default Value**, React Native calculates the width/height for the element based on its content, whether that is other children, text, or an image.

- `pixels` Defines the width/height in absolute pixels. Depending on other styles set on the component, this may or may not be the final dimension of the node.

- `percentage` Defines the width or height in percentage of its parent's width or height respectively.

### Absolute & Relative Layout

The `position` type of an element defines how it is positioned within its parent.

`relative` (**default value**) By default an element is positioned relatively. This means an element is positioned according to the normal flow of the layout, and then offset relative to that position based on the values of `top`, `right`, `bottom`, and `left`. The offset does not affect the position of any sibling or parent elements.

`absolute` When positioned absolutely an element doesn't take part in the normal layout flow. It is instead laid out independent of its siblings. The position is determined based on the `top`, `right`, `bottom`, and `left` values.

![Absolute & Relative Layoutp](https://cdn-images-1.medium.com/max/800/1*NlPeRQCQK3Vb5nyjL0Mqxw.png)

#### Going Deeper

Check out the interactive [yoga playground](https://yogalayout.com/playground) that you can use to get a better understanding of flexbox.

We've covered the basics, but there are many other styles you may need for layouts. The full list of props that control layout is documented [here](layout-props.md).

We're getting close to being able to build a real application. One thing we are still missing is a way to take user input, so let's move on to [learn how to handle text input with the TextInput component](handling-text-input.md).

See some examples from [Wix Engineers](https://medium.com/wix-engineering/the-full-react-native-layout-cheat-sheet-a4147802405c):
