---
id: imagebackground
title: ImageBackground
---

A common feature request from developers familiar with the web is `background-image`. To handle this use case, you can use the `<ImageBackground>` component, which has the same props as `<Image>`, and add whatever children to it you would like to layer on top of it.

You might not want to use `<ImageBackground>` in some cases, since the implementation is basic. Refer to `<ImageBackground>`'s [source code](https://github.com/facebook/react-native/blob/master/Libraries/Image/ImageBackground.js) for more insight, and create your own custom component when needed.

Note that you must specify some width and height style attributes.

## Example

```jsx

return (
  <ImageBackground source={...} style={{width: '100%', height: '100%'}}>
    <Text>Inside</Text>
  </ImageBackground>
);

```

---

# Reference

## Props

Inherits [Image Props](image.md#props).

### `style`

| Type                                | Required |
| ----------------------------------- | -------- |
| [view styles](view-style-props.md) | No       |

### `imageStyle`

| Type                                  | Required |
| ------------------------------------- | -------- |
| [image styles](image-style-props.md) | No       |

### `imageRef`

Allows to set a reference to the inner `Image` component

| Type                                                  | Required |
| ----------------------------------------------------- | -------- |
| [Ref](https://reactjs.org/docs/refs-and-the-dom.html) | No       |
