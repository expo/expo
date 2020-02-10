# @expo/html-elements

<p>
  <!-- iOS -->
  <img alt="Supports Expo iOS" longdesc="Supports Expo iOS" src="https://img.shields.io/badge/iOS-4630EB.svg?style=flat-square&logo=APPLE&labelColor=999999&logoColor=fff" />
  <!-- Android -->
  <img alt="Supports Expo Android" longdesc="Supports Expo Android" src="https://img.shields.io/badge/Android-4630EB.svg?style=flat-square&logo=ANDROID&labelColor=A4C639&logoColor=fff" />
  <!-- Web -->
  <img alt="Supports Expo Web" longdesc="Supports Expo Web" src="https://img.shields.io/badge/web-4630EB.svg?style=flat-square&logo=GOOGLE-CHROME&labelColor=4285F4&logoColor=fff" />
  <a aria-label="Circle CI" href="https://circleci.com/gh/expo/expo/tree/master">
    <img alt="Circle CI" src="https://flat.badgen.net/circleci/github/expo/expo?label=Circle%20CI&labelColor=555555&icon=circleci">
  </a>
</p>

Simple, light-weight, and well tested, universal semantic HTML elements as React components for iOS, Android, web, and desktop apps!

We at Expo recommend using platform agnostic primitives like `View`, `Image`, and `Text` whenever possible but sometimes that's not easy. Some primitives like Tables, and Footers are native to web only and currently have no way of easily accessing. This package aims to solve that while still being an optimal UI package for iOS, and Android.

### What you get

- Using `@expo/html-elements` will optimize your website for SEO and accessibility. Meaning your websites are indexed more accurately and your native apps better accommodate physically impaired users.
  - This package takes full advantage of [`react-native-web` a11y rules](https://github.com/necolas/react-native-web/blob/master/packages/docs/src/guides/accessibility.stories.mdx) whenever possible.
  - For example, the `H1` component will render an `<h1 />` on web, a `UILabel` on iOS, and a `TextView` on Android.
- Every component can accept styles from the `StyleSheet` API.
- TypeScript works for iOS, Android, and web, no more having to create monkey patches to use `href` on a `Text` element.
- Every component is tested render **tested universally** for iOS, Android, and Web using the package [`jest-expo-enzyme`](https://www.npmjs.com/package/jest-expo-enzyme). Each element is also **E2E tested** on iOS with Detox, and web with [`jest-expo-puppeteer`](https://www.npmjs.com/package/jest-expo-puppeteer).
- This package is completely side-effect free!

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

- [x] `<a />` => `<A />`
- [x] `<article />` => `<Article />`
- [x] `<b />` => `<B />`
- [x] `<blockquote />` => `<BlockQuote />`
- [x] `<br />` => `<BR />`
- [x] `<caption />` => `<Caption />`
- [x] `<code />` => `<Code />`
- [x] `<del />` => `<Del />`
- [x] `<em />` => `<EM />`
- [x] `<footer />` => `<Footer />`
- [x] `<h1 />` => `<H1 />`
- [x] `<h2 />` => `<H2 />`
- [x] `<h3 />` => `<H3 />`
- [x] `<h4 />` => `<H4 />`
- [x] `<h5 />` => `<H5 />`
- [x] `<h6 />` => `<H6 />`
- [x] `<header />` => `<Header />`
- [x] `<hr />` => `<HR />`
- [x] `<i />` => `<I />`
- [x] `<li />` => `<LI />` or `<FlatList />` from `react-native-web`
- [x] `<main />` => `<Main />`
- [x] `<mark />` => `<Mark />`
- [x] `<nav />` => `<Nav />`
- [x] `<ol />` => `<OL />`
- [x] `<p />` => `<P />`
- [x] `<q />` => `<Q />`
- [x] `<s />` => `<S />`
- [x] `<section />` => `<Section />`
- [x] `<small />` => `<Small />`
- [x] `<strong />` => `<Strong />`
- [x] `<table />` => `<Table />`
- [x] `<tbody />` => `<TBody />`
- [x] `<td />` => `<TD />`
- [x] `<tfoot />` => `<TFoot />`
- [x] `<th />` => `<TH />`
- [x] `<thead />` => `<THead />`
- [x] `<time />` => `<Time />`
- [x] `<tr />` => `<TR />`
- [x] `<ul />` => `<UL />`

**External**

- [ ] `<audio />` => Use `Audio` from [`expo-av`](https://docs.expo.io/versions/latest/sdk/audio/)
- [ ] `<button />` => `<Button />` from `react-native-web`
- [ ] `<canvas />` => Use `<GLView />` from [`expo-gl`](https://docs.expo.io/versions/latest/sdk/gl-view/) and the [Expo Canvas API](https://github.com/expo/expo-2d-context)
- [ ] `<div />` => `<View />` from `react-native-web`
- [ ] `<iframe />` => On native use [`<WebView />`](https://docs.expo.io/versions/latest/sdk/webview/). Notice: `@react-native-community/web-view` is not maintained by Expo and doesn't have web support
- [ ] `<img />` => Use `<Image />` from `react-native-web`
- [ ] `<input type="text" />` => Use `<TextView />`
- [ ] `<input type="file" />` => Use [`expo-image-picker`](https://docs.expo.io/versions/latest/sdk/imagepicker/) and [`expo-document-picker`](https://docs.expo.io/versions/latest/sdk/document-picker/)
- [ ] [`<link />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link) eject the `index.html` with `expo customize:web` and link resources directly with `<link />`
- [ ] [`<noscript />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript) eject the `index.html` with `expo customize:web` and use `<noscript />` directly as HTML
- [ ] `<span />` => `<Text />` from `react-native-web`
- [ ] `<video />` => Use `<Video />` from [`expo-av`](https://docs.expo.io/versions/latest/sdk/video/)

**Pending**

- [ ] [`<details />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)
- [ ] [`<summary />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary)
- [ ] [`<progress />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)
- [ ] [`<select />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select)
- [ ] [`<picture />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
- [ ] [`<figure />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure)
- [ ] [`<figcaption />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption)

## Headings

Header elements will use the expected [font size and margins from web](http://trac.webkit.org/browser/trunk/Source/WebCore/css/html.css) universally. You can see how the native CSS units (rem, and em) are transformed in [css/units](src/css/units.ts).

```tsx
import { H1, H2, H3, H4, H5, H6 } from '@expo/html-elements';
```

### `<H1/>`

```tsx
import { H1 } from '@expo/html-elements';
export default () => <h6>Example<H1/>
```

**Output:**

<h1>Example</h1>


### `<H2/>`

```tsx
import { H2 } from '@expo/html-elements';
export default () => <H2>Example<H2/>
```

**Output:**

<h2>Example</h2>


### `<H3/>`

```tsx
import { H3 } from '@expo/html-elements';
export default () => <H3>Example<H3/>
```

**Output:**

<h3>Example</h3>


### `<H4/>`

```tsx
import { H4 } from '@expo/html-elements';
export default () => <H4>Example<H4/>
```

**Output:**

<h4>Example</h4>


### `<H5/>`

```tsx
import { H5 } from '@expo/html-elements';
export default () => <H5>Example<H5/>
```

**Output:**

<h5>Example</h5>


### `<H6/>`

```tsx
import { H6 } from '@expo/html-elements';
export default () => <H6>Example<H6/>
```

**Output:**

<h6>Example</h6>


## Link

### `<A/>`

You can use the anchor element with href prop to open links. On native this will attempt to use the `Linking` API to open the `href`.

- The CSS style is fully normalized to match `<Text />`
- For pseudo-class effects like hover and focus states check out the package [`react-native-web-hooks`](https://www.npmjs.com/package/react-native-web-hooks) | [tutorial](https://blog.expo.io/css-pseudo-class-effects-in-expo-for-web-56649f88eb6b)

```tsx
import { A } from '@expo/html-elements';

function App() {
    return <A href="#" target="_blank" />
}
```

↓ ↓ ↓ ↓ ↓ ↓

#### `<A />` output: web

```html
<a
  data-focusable={true}
  dir="auto"
  href="#"
  role="link"
  target="_blank"
/>
```

#### `<A />` output: native

```tsx
<Text
  accessibilityRole="link"
  onPress={[Function]}
/>
```

## Layout

You can use layout elements like Header, Main, Footer, Section, Nav, etc. as a drop-in replacement for `View`s in your existing app.

#### Default Layout style

All layout HTML elements inherit the shared style of `<View />` to accommodate the [Yoga layout engine][yoga] which we use on native for iOS, and Android.

- `display` is always `flex`. This is because [Yoga][yoga] only implements `display: flex`.
- `flex-direction` is always `column` instead of `row`.

#### Why use Layout elements

Consider the following: in your app you have a basic element at the top which wraps the buttons and title. A screen reader doesn't understand that this is a header, and mostly neither does a web crawler. But if you replace the encasing view with a `<Header />` the following happens:

- **iOS**: `UIView` uses [`UIAccessibilityTraitHeader`](https://developer.apple.com/documentation/uikit/uiaccessibilitytraitheader?language=objc).
- **Android**: `View` will use the proper [`AccessibilityNodeInfoCompat.CollectionItemInfoCompat`](https://github.com/facebook/react-native/blob/7428271995adf21b2b31b188ed83b785ce1e9189/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.java#L370-L372) | [docs](https://developer.android.com/reference/android/support/v4/view/accessibility/AccessibilityNodeInfoCompat.CollectionItemInfoCompat).
- **web**: render an HTML 5 [`<header />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header) with the ARIA `role` set to [`"banner"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Banner_role).

Some elements like `Footer` and `Main` have no iOS, or Android enhancements, but they'll still improve web. Using the proper HTML 5 elements will make your layout compliant with the [HTML5 outline algorithm](https://html.spec.whatwg.org/multipage/sections.html#outlines).

### `<Nav/>`

Renders a `<nav />` on web and a `View` on mobile.

```tsx
import { Nav } from '@expo/html-elements';

function App() {
    return <Nav />
}
```

### `<Header/>`

Renders a `<header />` on web with ARIA set to `banner` and a `View` with ARIA set to `header` on mobile.

```tsx
import { Header } from '@expo/html-elements';

function App() {
    return <Header />
}
```

- **iOS**: `UIView` uses [`UIAccessibilityTraitHeader`](https://developer.apple.com/documentation/uikit/uiaccessibilitytraitheader?language=objc).
- **Android**: `View` will use the proper [`AccessibilityNodeInfoCompat.CollectionItemInfoCompat`](https://github.com/facebook/react-native/blob/7428271995adf21b2b31b188ed83b785ce1e9189/ReactAndroid/src/main/java/com/facebook/react/uimanager/ReactAccessibilityDelegate.java#L370-L372) | [docs](https://developer.android.com/reference/android/support/v4/view/accessibility/AccessibilityNodeInfoCompat.CollectionItemInfoCompat).
- **web**: render an HTML 5 [`<header />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header) with the ARIA `role` set to [`"banner"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Banner_role).

### `<Main/>`

Renders a `<main />` on web with ARIA `role` set to `main` and a `View` with no ARIA set on mobile.

```tsx
import { Main } from '@expo/html-elements';

function App() {
    return <Main />
}
```

### `<Section/>`

Renders a `<section />` on web with ARIA set to `region` and a `View` with ARIA set to `summary` on mobile.

```tsx
import { Section } from '@expo/html-elements';

function App() {
    return <Section />
}
```

### `<Article/>`

Renders an `<article />` on web and a `View` everywhere else.

```tsx
import { Article } from '@expo/html-elements';

function App() {
    return <Article />
}
```

### `<Footer/>`

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

### `<P/>`

Standard paragraph: <p>example</p>

### `<B/>`

Bold text: <b>example</b>

### `<Strong/>`

Alternate Bold text: <strong>example</strong>

### `<S/>`

Strike through text: <s>example</s>

### `<Del/>`

Alternate strike through text, renders an `<del/>` on web: <del>example</del>

### `<I/>`

Italic text: _example_

### `<EM/>`

Alternate italic text: _example_

### `<Small/>`

Smaller than default text: <small>example</small>

### `<Code/>`

Inline code block: <code>example</code>

- [ ] Support lazy loading mono font on mobile.

### `<Mark/>`

Highlight text: <mark>example</mark>

### `<Q/>`

Quote text: _"example"_

### `<BlockQuote/>`

Render a [`<blockquote />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote) on web, and a `<View />` on native. This element doesn't accept text directly.

### `<Time/>`

Renders a `<time />` element with reset styles on web, and a regular `<Text />` on native. 

- `dateTime` prop is supported on web and stripped on native.

## Lists

Lists can be used to create basic bulleted or numbered lists. You should try and use universal `FlatList` or `SectionList` components for long scrolling lists instead of these.

### `<UL/>`

Create an unordered (bulleted) list `<ul />` on web, and emulates the style with a `<View />` on native.

- [x] Resets font styles everywhere.
- [ ] Supports i18n by reversing format on iOS and Android
- [ ] Supports custom bullets

```tsx
import { UL, LI } from '@expo/html-elements';

function App() {
    return (
        <UL>
            <LI>oranges</LI>
            <LI>apples</LI>
            <UL>
                <LI>green</LI>
                <LI>red</LI>
            </UL>
        </UL>
    )
}
```

### `<OL/>`

Create an ordered (numbered) list `<ol />` on web, and emulates the style with a `<View />` on native.

- [x] Resets font styles everywhere.
- [ ] Supports i18n by reversing format on iOS and Android
- [ ] Supports i18n bullets on iOS and Android
- [ ] Supports custom bullets

```tsx
import { UL, LI } from '@expo/html-elements';

function App() {
    return (
        <OL>
            <LI>oranges</LI>
            <LI>apples</LI>
            <OL>
                <LI>green</LI>
                <LI>red</LI>
            </OL>
        </OL>
    )
}
```

### `<LI/>`

Create a standard list item `<li />` on web and a native view on mobile which can render text or views inside it.

## Rules

### `<HR/>`

Renders a `<View>` everywhere. Style is modified to match web.

```tsx
import { HR } from '@expo/html-elements';

function App() {
    return (
        <HR />
    )
}
```

### `<BR/>`

Line break: <br />

## Tables

Create tables universally.

- Each element renders to the expected type on web.
- `padding` is removed from all table elements.
- Text **can only** be rendered in `TH` and `TD` on mobile.
- `colSpan` and `rowSpan` are currently web-only (PRs welcome).

```tsx
import { Table, THead, TH, TBody, TFoot, TR, TD, Caption } from '@expo/html-elements';
import { Text } from 'react-native';

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
            <TFoot>
                <TR>
                    <TD>
                        <Text>This is the table footer</Text>
                    </TD>
                </TR>
            </TFoot>
        </Table>
    )
}
```

#### Table example output web

```html
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
    <tfoot>
        <tr>
            <td><div>The table body</div></td>
        </tr>
    </tfoot>
</table>
```

### `<Table/>`

Base element for creating a Table.

- Renders a `<table />` on web.

### `<THead/>`

Header element in a Table.

- Renders a `<thead />` on web.

### `<TBody/>`

Body element in a Table.

- Renders a `<tbody />` on web.

### `<TFoot/>`

Footer element in a Table.

- Renders a `<tfoot />` on web.

### `<TH/>`

Used to display text in the Header.

- `colSpan` and `rowSpan` are currently web-only.
- Renders a `<th />` on web.

### `<TR/>`

Used to create a Row in a Table.

- Renders a `<tr />` on web.

### `<TD/>`

Create a cell in a Table.

- `colSpan` and `rowSpan` are currently web-only.
- Renders a `<td />` on web.

### `<Caption/>`

Used to caption your table. Excepts text as a child.

- Renders a `<caption />` on web.

## TODO

- Improve relative imports for better tree-shaking.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).

[yoga]: https://yogalayout.com/