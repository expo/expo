# @expo/html-elements

<p>
  <!-- iOS -->
  <img alt="Supports Expo iOS" longdesc="Supports Expo iOS" src="https://img.shields.io/badge/iOS-4630EB.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff" />
  <!-- Android -->
  <img alt="Supports Expo Android" longdesc="Supports Expo Android" src="https://img.shields.io/badge/Android-4630EB.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff" />
  <!-- Web -->
  <img alt="Supports Expo Web" longdesc="Supports Expo Web" src="https://img.shields.io/badge/web-4630EB.svg?style=flat-square&logo=GOOGLE-CHROME&labelColor=4285F4&logoColor=fff" />
</p>

Universal semantic HTML React components for iOS, Android, web, and desktop. We recommended using platform agnostic primitives like `View`, `Image`, and `Text` wherever possible but sometimes that's not always an option.
For instance rendering an HTML `<footer />` element requires platform specific code in your app for every platform you want to support, this can quickly become a huge burden (especially for TypeScript users). This is where `@expo/html-elements` comes in!

**What you get**

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

Not all HTML elements are supported. There are some HTML elements that mostly overlap with some universal modules, you should always try to use the universal modules whenever possible. All supported components are a capitalized variation of the semantic HTML they implement/emulate.

- [x] `<h1 />` => `<H1 />`
- [x] `<h2 />` => `<H2 />`
- [x] `<h3 />` => `<H3 />`
- [x] `<h4 />` => `<H4 />`
- [x] `<h5 />` => `<H5 />`
- [x] `<h6 />` => `<H6 />`
- [x] `<a />` => `<A />`
- [x] `<article />` => `<Article />`
- [x] `<header />` => `<Header />`
- [x] `<main />` => `<Main />`
- [x] `<section />` => `<Section />`
- [x] `<nav />` => `<Nav />`
- [x] `<footer />` => `<Footer />`
- [x] `<p />` => `<P />`
- [x] `<b />` => `<B />`
- [x] `<s />` => `<S />`
- [x] `<strike />` => `<Strike />`
- [x] `<strong />` => `<Strong />`
- [x] `<i />` => `<I />`
- [x] `<em />` => `<Em />`
- [x] `<br />` => `<Br />`
- [x] `<small />` => `<Small />`
- [x] `<mark />` => `<Mark />`
- [x] `<code />` => `<Code />`
- [x] `<hr />` => `<Hr />`
- [x] `<table />` => `<Table />`
- [x] `<thead />` => `<Thead />`
- [x] `<tbody />` => `<Tbody />`
- [x] `<tfoot />` => `<Tfoot />`
- [x] `<th />` => `<Th />`
- [x] `<tr />` => `<Tr />`
- [x] `<td />` => `<Td />`
- [x] `<caption />` => `<Caption />`
- [x] `<ul />` => `<Ul />`
- [x] `<ol />` => `<Ol />`
- [x] `<li />` => `<Li />` or `<FlatList />` from `react-native-web`
- [ ] `<div />` => `<View />` from `react-native-web`
- [ ] `<video />` => Use `<Video />` from [`expo-av`](https://docs.expo.io/versions/latest/sdk/video/).
- [ ] `<img />` => Use `<Image />` from `react-native-web`
- [ ] `<canvas />` => Use `<GLView />` from [`expo-gl`](https://docs.expo.io/versions/latest/sdk/gl-view/)
- [ ] `<input type="text" />` => Use `<TextView />`
- [ ] `<input type="file" />` => Use [`expo-image-picker`](https://docs.expo.io/versions/latest/sdk/imagepicker/) and [`expo-document-picker`](https://docs.expo.io/versions/latest/sdk/document-picker/)
- [ ] `<iframe />` => On native use `<WebView />` from `@react-native-community/web-view`, this package is not maintained by Expo and doesn't have web support.

## Headings

Header elements will use the expected font size and margins from web universally.

```tsx
import { H1, H2, H3, H4, H5, H6 } from '@expo/html-elements';
```

### H1

```tsx
import { H1 } from '@expo/html-elements';
export default () => <h6>Example<H1/>
```

**Output:**

<h1>Example</h1>


### H2

```tsx
import { H2 } from '@expo/html-elements';
export default () => <H2>Example<H2/>
```

**Output:**

<h2>Example</h2>


### H3

```tsx
import { H3 } from '@expo/html-elements';
export default () => <H3>Example<H3/>
```

**Output:**

<h3>Example</h3>


### H4

```tsx
import { H4 } from '@expo/html-elements';
export default () => <H4>Example<H4/>
```

**Output:**

<h4>Example</h4>


### H5

```tsx
import { H5 } from '@expo/html-elements';
export default () => <H5>Example<H5/>
```

**Output:**

<h5>Example</h5>


### H6

```tsx
import { H6 } from '@expo/html-elements';
export default () => <H6>Example<H6/>
```

**Output:**

<h6>Example</h6>


## Link

### A

You can use the anchor element with href prop to open links. On native this will attempt to use the `Linking` API to open the `href`.

- The CSS style is fully normalized to match `<Text />`
- For pseudo-class effects check out the package [`react-native-web-hooks`](https://www.npmjs.com/package/react-native-web-hooks) | [tutorial](https://blog.expo.io/css-pseudo-class-effects-in-expo-for-web-56649f88eb6b)

```tsx
import { A } from '@expo/html-elements';

function App() {
    return <A href="#" target="_blank" />
}
```

↓ ↓ ↓ ↓ ↓ ↓

#### A output: web

```html
<a
  className="css-reset-4rbku5 css-cursor-18t94o4 css-text-901oao"
  data-focusable={true}
  dir="auto"
  href="#"
  role="link"
  target="_blank"
/>
```

#### A output: native

```tsx
<Text
  accessibilityRole="link"
  onPress={[Function]}
  target="_parent"
/>
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

Wraps the primitive `Text` element on native and renders the expected HTML on web.

- Style is slightly modified to match web.
- All font styles are reset.
- All elements except styles from `StyleSheet` API.

```tsx
import { P, B, S, I, Br, Small, Code } from '@expo/html-elements';

function App() {
    return (
        <>
            <P>Hello<B>World (in bold)</B></P>
            <S>strike text</S>
            <Br />
            <I>Italic</I>
            <Code>const foo = true</Code>
            <Small>Small text</Small>
        </>
    )
}
```

### P

Standard paragraph: <p>example</p>

### B

Bold text: <b>example</b>

### Strong

Alternate Bold text: <strong>example</strong>

### S

Strike through text: <s>example</s>

### Strike

Alternate strike through text, renders an `<s/>` on web: <s>example</s>

### I

Italic text: _example_

### Em

Alternate italic text: _example_

### Small

Smaller than default text: <small>example</small>

### Code

Inline code block: <code>example</code>

- [ ] Support lazy loading mono font on mobile.

### Mark

Highlight text: <mark>example</mark>


## Lists

You should try and use agnostic `FlatList` or `SectionList`s instead of these whenever possible.

### Ul

Create an unordered (bulleted) list `<ul />` on web and emulate with a `<View />` on native.

- [x] Resets font styles everywhere.
- [ ] Supports i18n by reversing format on iOS and Android
- [ ] Supports custom bullets

```tsx
import { Ul, Li } from '@expo/html-elements';

function App() {
    return (
        <>
            <Ul>
                <Li>oranges</Li>
                <Li>apples</Li>
                <Ul>
                    <Li>green</Li>
                    <Li>red</Li>
                </Ul>
            </Ul>
        </>
    )
}
```

### Ol

Create an ordered (numbered) list `<ol />` on web and emulate with a `<View />` on native.

- [x] Resets font styles everywhere.
- [ ] Supports i18n by reversing format on iOS and Android
- [ ] Supports i18n bullets on iOS and Android
- [ ] Supports custom bullets

```tsx
import { Ul, Li } from '@expo/html-elements';

function App() {
    return (
        <>
            <Ol>
                <Li>oranges</Li>
                <Li>apples</Li>
                <Ol>
                    <Li>green</Li>
                    <Li>red</Li>
                </Ol>
            </Ol>
        </>
    )
}
```

### Li

Create a standard list item `<li />` on web and a native view on mobile which can render text or views inside it.

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

### Br

Line break: <br />

## Tables

Create tables universally.

- Each element renders to the expected type on web.
- `padding` is removed from all table elements.
- Text **can only** be rendered in `Th` and `Td` on mobile.
- `colSpan` and `rowSpan` are currently web-only (PRs welcome).

```tsx
import { Table, Thead, Th, Tbody, Tfoot, Tr, Td, Caption } from '@expo/html-elements';

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

#### Table Example

<table>
    <caption>Caption</caption>
    <thead>
        <tr>
            <th colSpan="2">The table header</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>The table body</td>
            <td>with two columns</td>
        </tr>
    </tbody>
</table>

## TODO

- Support more HTML elements.
- Improve relative imports for better tree-shaking.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
