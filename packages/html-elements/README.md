# @expo/html-elements

<p>
  <!-- iOS -->
  <img alt="Supports Expo iOS" longdesc="Supports Expo iOS" src="https://img.shields.io/badge/iOS-4630EB.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff" />
  <!-- Android -->
  <img alt="Supports Expo Android" longdesc="Supports Expo Android" src="https://img.shields.io/badge/Android-4630EB.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff" />
  <!-- Web -->
  <img alt="Supports Expo Web" longdesc="Supports Expo Web" src="https://img.shields.io/badge/web-4630EB.svg?style=flat-square&logo=GOOGLE-CHROME&labelColor=4285F4&logoColor=fff" />
</p>

Simple, light-weight, and well tested, universal semantic HTML elements as React components for iOS, Android, web, and desktop!

We at Expo recommended using platform agnostic primitives like `View`, `Image`, and `Text` whenever possible but sometimes that's not easy! This package aims to solve that while still being an optimal UI package for iOS, and Android.

**What you get**

- Using these components will optimize for accessibility and SEO.
  - This package takes full advantage of [`react-native-web` a11y rules](https://github.com/necolas/react-native-web/blob/master/packages/docs/src/guides/accessibility.stories.mdx) whenever possible.
  - The `H1` component will render an `<h1 />` on web, a `UILabel` on iOS, and a `TextView` on Android.
- Every component accepts styles from the `StyleSheet` API.
- TypeScript works for iOS, Android, and web, no need to monkey patch types.
- This package is completely side-effect free!
- Every component is tested universally for iOS, Android, and Web using the package [`jest-expo-enzyme`](https://www.npmjs.com/package/jest-expo-enzyme).

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
- [x] `<del />` => `<Del />`
- [x] `<strong />` => `<Strong />`
- [x] `<i />` => `<I />`
- [x] `<em />` => `<EM />`
- [x] `<br />` => `<BR />`
- [x] `<small />` => `<Small />`
- [x] `<mark />` => `<Mark />`
- [x] `<code />` => `<Code />`
- [x] `<hr />` => `<HR />`
- [x] `<table />` => `<Table />`
- [x] `<thead />` => `<THead />`
- [x] `<tbody />` => `<TBody />`
- [x] `<tfoot />` => `<TFoot />`
- [x] `<th />` => `<TH />`
- [x] `<tr />` => `<TR />`
- [x] `<td />` => `<TD />`
- [x] `<caption />` => `<Caption />`
- [x] `<ul />` => `<UL />`
- [x] `<ol />` => `<OL />`
- [x] `<li />` => `<LI />` or `<FlatList />` from `react-native-web`
- [ ] `<div />` => `<View />` from `react-native-web`
- [ ] `<video />` => Use `<Video />` from [`expo-av`](https://docs.expo.io/versions/latest/sdk/video/)
- [ ] `<img />` => Use `<Image />` from `react-native-web`
- [ ] `<canvas />` => Use `<GLView />` from [`expo-gl`](https://docs.expo.io/versions/latest/sdk/gl-view/) and the [Expo Canvas API](https://github.com/expo/expo-2d-context)
- [ ] `<input type="text" />` => Use `<TextView />`
- [ ] `<input type="file" />` => Use [`expo-image-picker`](https://docs.expo.io/versions/latest/sdk/imagepicker/) and [`expo-document-picker`](https://docs.expo.io/versions/latest/sdk/document-picker/)
- [ ] `<iframe />` => On native use [`<WebView />`](https://docs.expo.io/versions/latest/sdk/webview/). Notice: `@react-native-community/web-view` is not maintained by Expo and doesn't have web support

## Headings

Header elements will use the expected [font size and margins from web](http://trac.webkit.org/browser/trunk/Source/WebCore/css/html.css) universally. You can see how the native CSS units (rem, and em) are transformed here: [css/units](src/css/units.ts).

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

Renders a `<header />` on web with aria set to `banner` and a `View` with aria set to `header` on mobile.

```tsx
import { Header } from '@expo/html-elements';

function App() {
    return <Header />
}
```

### Main

Renders a `<main />` on web with aria set to `main` and a `View` with no aria set on mobile.

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

Renders an `<article />` on web and a `View` everywhere else.

```tsx
import { Article } from '@expo/html-elements';

function App() {
    return <Article />
}
```

### Footer

Renders an `<footer />` on web and a `View` everywhere else.

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
import { P, B, S, I, BR, Small, Code } from '@expo/html-elements';

function App() {
    return (
        <>
            <P>Hello<B>World (in bold)</B></P>
            <S>strike text</S>
            <BR />
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

### Del

Alternate strike through text, renders an `<del/>` on web: <del>example</del>

### I

Italic text: _example_

### EM

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

### UL

Create an unordered (bulleted) list `<ul />` on web and emulate with a `<View />` on native.

- [x] Resets font styles everywhere.
- [ ] Supports i18n by reversing format on iOS and Android
- [ ] Supports custom bullets

```tsx
import { UL, LI } from '@expo/html-elements';

function App() {
    return (
        <>
            <UL>
                <LI>oranges</LI>
                <LI>apples</LI>
                <UL>
                    <LI>green</LI>
                    <LI>red</LI>
                </UL>
            </UL>
        </>
    )
}
```

### OL

Create an ordered (numbered) list `<ol />` on web and emulate with a `<View />` on native.

- [x] Resets font styles everywhere.
- [ ] Supports i18n by reversing format on iOS and Android
- [ ] Supports i18n bullets on iOS and Android
- [ ] Supports custom bullets

```tsx
import { UL, LI } from '@expo/html-elements';

function App() {
    return (
        <>
            <OL>
                <LI>oranges</LI>
                <LI>apples</LI>
                <OL>
                    <LI>green</LI>
                    <LI>red</LI>
                </OL>
            </OL>
        </>
    )
}
```

### LI

Create a standard list item `<li />` on web and a native view on mobile which can render text or views inside it.

## Rules

### HR

Renders a `<View>` everywhere. Style is modified to match web.

```tsx
import { HR } from '@expo/html-elements';

function App() {
    return (
        <>
            <HR />
        </>
    )
}
```

### BR

Line break: <br />

## Tables

Create tables universally.

- Each element renders to the expected type on web.
- `padding` is removed from all table elements.
- Text **can only** be rendered in `TH` and `TD` on mobile.
- `colSpan` and `rowSpan` are currently web-only (PRs welcome).

```tsx
import { Table, THead, TH, TBody, TFoot, TR, TD, Caption } from '@expo/html-elements';

function App() {
    return (
       <Table>
            <Caption>Caption</Caption>
            <THead>
                <TR>
                    <TH colSpan="2">The table header</TH>
                </TR>
            </THead>
            <TBody>
                <TR>
                    <TD>The table body</TD>
                    <TD>with two columns</TD>
                </TR>
            </TBody>
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
