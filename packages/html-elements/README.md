# @expo/html-elements

Universal semantic HTML React components for iOS, Android, web, and desktop. We recommended using platform agnostic primitives like `View`, `Image`, and `Text` wherever possible but sometimes that's not always easy.
For instance rendering an HTML `<footer />` element requires platform specific code in your app for every platform you want to support, this can quickly become a huge burden. So that's where `@expo/html-elements` comes in!

- Using these components will optimize for accessibility and SEO.
  - This package takes full advantage of [`react-native-web` a11y rules](https://github.com/necolas/react-native-web/blob/master/packages/docs/src/guides/accessibility.stories.mdx) whenever possible.
  - The `H1` component will render an `<h1 />` on web, a `UILabel` on iOS, and a `TextView` on Android.
- Every component excepts styles from the `StyleSheet` API.
- TypeScript works for iOS, Android, and web, no need to monkey patching types.
- This package is completely side-effect free!
- Components are tested with `jest-expo-enzyme`.

## Setup

Install:

```sh
yarn add @expo/html-elements
```

Import and use the package:

```tsx
import { H1 } from '@expo/html-elements';
```

# Components

## Headings

Header elements will use the expected font size and margins from web universally.

```tsx
import { H1, H2, H3, H4, H5, H6 } from '@expo/html-elements';
```

## Link

You can use the anchor element with href prop to open links. On native this will attempt to use the `Linking` API to open the `href`. The style is fully normalized with no special modifications made to it.

```tsx
import { A } from '@expo/html-elements';

function App() {
    return <A href="#" target="_blank" />
}
```

## Structure

### Nav

Renders a `<nav />` on web and a `View` on mobile.

```tsx
import { Nav } from '@expo/html-elements';

function App() {
    return <Nav />
}
```

### Header

Renders a `<header />` on web with aria set to `banner` and a `View` with aria set to `header` on mobile. This required a non-universal `accessibilityRole` internally.

```tsx
import { Header } from '@expo/html-elements';

function App() {
    return <Header />
}
```

### Main

Renders a `<main />` on web with aria set to `main` and a `View` with no aria set on mobile. This required a non-universal `accessibilityRole` internally.

```tsx
import { Main } from '@expo/html-elements';

function App() {
    return <Main />
}
```

### Section

Renders a `<section />` on web with aria set to `region` and a `View` with aria set to `summary` on mobile.

```tsx
import { Section } from '@expo/html-elements';

function App() {
    return <Section />
}
```

### Article

Renders an `<article />` on web and a `View` everywhere else. This required a non-universal `accessibilityRole` internally.

```tsx
import { Article } from '@expo/html-elements';

function App() {
    return <Article />
}
```

### Footer

Renders an `<footer />` on web and a `View` everywhere else. This required a platform specific implementations for web and mobile.

```tsx
import { Footer } from '@expo/html-elements';

function App() {
    return <Footer />
}
```

## Text

### P

Renders a `Text` everywhere. Style is slightly modified to match web.

```tsx
import { P, B, S, I, Br, Code } from '@expo/html-elements';

function App() {
    return (
        <>
            <P>Hello<B>World (in bold)</B></P>
            <S>strike text</S>
            <Br />
            <I>Italic</I>
            <Code>const foo = true</Code>
        </>
    )
}
```

Alternative elements:

```tsx
import { Strong, Strike, Em } from '@expo/html-elements';
```


## Rules

### Hr

Renders a `<View>` everywhere. Style is modified to match web.

```tsx
import { Hr } from '@expo/html-elements';

function App() {
    return (
        <>
            <Hr />
        </>
    )
}
```

## Tables

Create tables universally. `colSpan` and `rowSpan` are currently web-only. Each element renders to the expected type on web.
- `padding` is removed from all table elements.
- Text can only be rendered in `Th` and `Td` on mobile.

```tsx
import { Table, Thead, Th, Tbody, Tr, Td, Caption } from '@expo/html-elements';

function App() {
    return (
       <Table>
            <Caption>Caption</Caption>
            <Thead>
                <Tr>
                    <Th colSpan="2">The table header</Th>
                </Tr>
            </Thead>
            <Tbody>
                <Tr>
                    <Td>The table body</Td>
                    <Td>with two columns</Td>
                </Tr>
            </Tbody>
        </Table>
    )
}
```

# TODO

- Support more HTML elements.
- Improve relative imports for better tree-shaking.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
