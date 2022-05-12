---
title: Stacking overlapping views with zIndex in Expo and React Native apps
sidebar_title: Stacking views with zIndex
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import SnackEmbed from '~/components/plugins/SnackEmbed';
import { Collapsible } from '~/ui/components/Collapsible';

`zIndex` is the Expo and React Native analog of [CSS's `z-index` property](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index) which lets the developer control the order in which components are displayed over one another.

## Default `zIndex` behavior

Without specifying an explicit `zIndex` or `position`, components that occur later in the tree have a higher z-order.

<SnackEmbed platform="web" preview name="Default layout">
{`
import React from "react";
import { StyleSheet, View } from "react-native";\n
export default function App() {
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: '#e1e4e8',
          },
        ]}>
        {/* zIndex: 0 */}
        <View style={[styles.item, { backgroundColor: '#6638f0' }]} />
        {/* zIndex: 1 */}
        <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
        {/* zIndex: 2 */}
        <View style={[styles.item, { backgroundColor: '#4af2a1' }]} />
      </View>
    </View>
  );
}\n
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 200,
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  item: {
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    height: 48,
    width: 48,
    borderRadius: 8,
  },
});
`}
</SnackEmbed>

<Collapsible summary="Result">

<ImageSpotlight style={{maxWidth: 360}} alt="Three square components in a square parent container" src="/static/images/z-index/default-layout.png" />

</Collapsible>

This is illustrated more clearly when the components visually intersect each other.

<SnackEmbed platform="web" preview name="Interstecting views">
{`
import React from "react";
import { StyleSheet, View } from "react-native";\n
export default function App() {
  return (
    <View style={styles.root}>
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#e1e4e8',
        },
      ]}>
      {/* zIndex: 0 */}
      <View style={[styles.item, { backgroundColor: '#6638f0' }]} />
      {/* zIndex: 1 */}
      <View style={[styles.item, { backgroundColor: '#5cc9f5', marginTop: -16 }]} />
      {/* zIndex: 2 */}
      <View style={[styles.item, { backgroundColor: '#4af2a1', marginTop: -16 }]} />
    </View>
  </View>
  );
}\n
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 200,
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  item: {
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    height: 48,
    width: 48,
    borderRadius: 8,
  },
});
`}
</SnackEmbed>

<Collapsible summary="Result">

<ImageSpotlight style={{maxWidth: 360}} alt="Three square components intersecting each other" src="/static/images/z-index/default-visually-stacked.png" />

</Collapsible>

## Changing the `zIndex` of an element

If you want to change how a component stacks without changing the order in which it occurs in the component tree, use `zIndex`:

<SnackEmbed platform="web" preview name="zIndex override">
{`
import React from "react";
import { StyleSheet, View } from "react-native";\n
export default function App() {
  return (
    <View style={styles.root}>
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#e1e4e8',
        },
      ]}>
      <View style={[styles.item, { backgroundColor: '#6638f0' }]} />
      <View style={[styles.item, { backgroundColor: '#5cc9f5', marginTop: -16, zIndex: 1 }]} />
      <View style={[styles.item, { backgroundColor: '#4af2a1', marginTop: -16 }]} />
    </View>
  </View>
  );
}\n
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 200,
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  item: {
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    height: 48,
    width: 48,
    borderRadius: 8,
  },
});
`}
</SnackEmbed>

<Collapsible summary="Result">

<ImageSpotlight style={{maxWidth: 360}} alt="Three components where the second is stacked above the first and third" src="/static/images/z-index/relative-z-index.png" />

</Collapsible>

## Manually positioning your component

Along with specifying how the component will stack, you can break out of the default layout set by the component's parent by changing the `position` property on the child component to `'absolute'` and specifying the distance it should be from its parent with the style properties `top`, `right`, `bottom`, and `left`.

<SnackEmbed platform="web" preview name="Position absolute">
{`
import React from "react";
import { StyleSheet, View } from "react-native";\n
export default function App() {
  return (
  <View style={styles.root}>
    <View style={[styles.container, { backgroundColor: '#e1e4e8' }]}>
      <View
        style={[
          styles.item,
          { backgroundColor: '#6638f0', position: 'absolute', top: 32, left: 32, zIndex: 1 },
        ]}
      />
      <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
      <View style={[styles.item, { backgroundColor: '#4af2a1', marginTop: -16 }]} />
    </View>
  </View>
  );
}\n
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 200,
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  item: {
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    height: 48,
    width: 48,
    borderRadius: 8,
  },
});
`}
</SnackEmbed>

<Collapsible summary="Result">

<ImageSpotlight style={{maxWidth: 360}} alt="Position absolute example" src="/static/images/z-index/absolute-position.png" />

</Collapsible>

You can even make the component extend outside of the parent's visual bounds.

<SnackEmbed platform="web" preview name="Position absolute bounds">
{`
import React from "react";
import { StyleSheet, View } from "react-native";\n
export default function App() {
  return (
<View style={styles.root}>
    <View style={[styles.container, { backgroundColor: '#e1e4e8' }]}>
      <View
        style={[
          styles.item,
          { backgroundColor: '#6638f0', position: 'absolute', top: -32, left: -32, zIndex: 1 },
        ]}
      />
      <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
      <View style={[styles.item, { backgroundColor: '#4af2a1', marginTop: -16 }]} />
    </View>
  </View>
  );
}\n
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 200,
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  item: {
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    height: 48,
    width: 48,
    borderRadius: 8,
  },
});
`}
</SnackEmbed>

<Collapsible summary="Result">

<ImageSpotlight style={{maxWidth: 360}} alt="Position absolute component out of visual bounds of parent" src="/static/images/z-index/absolute-z-index-bounds.png" />

</Collapsible>

While a `position: 'absolute'` component may seem like it operates independently, it must still respect the `zIndex` of its parent.

<SnackEmbed platform="web" preview name="Parent-child zIndex relationship">
{`
import React from "react";
import { StyleSheet, View } from "react-native";\n
export default function App() {
  return (
<View style={styles.root}>
    <View style={[styles.container, { backgroundColor: '#e1e4e8' }]}>
      <View
        style={[
          styles.item,
          { backgroundColor: '#6638f0', position: 'absolute', top: -32, left: -32, zIndex: 100 },
        ]}
      />
      <View style={[styles.item, { backgroundColor: '#5cc9f5' }]} />
      <View style={[styles.item, { backgroundColor: '#4af2a1', marginTop: -16 }]} />
    </View>
    <View style={[styles.container, { backgroundColor: '#dcffe4', marginTop: -188 }]} />
  </View>
  );
}\n
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    height: 200,
    width: 200,
    borderRadius: 16,
    padding: 16,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  item: {
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.2)',
    height: 48,
    width: 48,
    borderRadius: 8,
  },
});
`}
</SnackEmbed>

<Collapsible summary="Result">

<ImageSpotlight style={{maxWidth: 360}} alt="Position absolute child must respect parent's zIndex" src="/static/images/z-index/z-index-parent.png" />

</Collapsible>
