---
title: Using SVGs
sidebar_title: Using SVGs
---

import SnackEmbed from '~/components/plugins/SnackEmbed';
import { Terminal } from '~/ui/components/Snippet';

SVGs (Scalable Vector Graphics) are a great way to present icons and other visual elements in a flexible, crisp, and performant way. Using SVGs on the web is straightforward, since we can copy an SVG and place it inline in an HTML file. This works because browsers understand how to parse and present SVGs. Expo does not understand how to parse and present SVG out of the box on Android and iOS, so we'll need to use a React Native package and an SVG converter to do so.

Let's go over the whole process of creating an SVG to presenting it in a Expo project.

## Exporting an SVG

Once we have a vector created inside a design program, like Figma, Illustrator, or Sketch, find the "export" menu and specify "SVG" as the export type. This will create an SVG file we can view in a code editor. Alternatively, these programs often allow right clicking on an element, then copying it as an SVG.

## Converting SVG files using a Babel transformer

[React Native SVG transformer](https://github.com/kristerkari/react-native-svg-transformer) allows compile-time transformation to make SVG files compatible with React.

Follow the installation steps to configure your Expo project to use this workflow. After your project is properly configured, you'll be able to use your local SVG files like this:

```javascript
import Logo from './assets/logo.svg';

<Logo width={120} height={40} />;
```

## Converting individual SVG files for React Native

Alternatively, [React-SVGR](https://react-svgr.com/playground/?native=true) is a great tool to convert individual SVG files. It takes an SVG as input then can transform it into another format, including a format that works with React.

Paste the SVG contents from the exported SVG file into [React-SVGR](https://react-svgr.com/playground/?native=true) and make sure the "native" checkbox is ticked. It will provide output that we can copy and paste into our project.

To automate this process, React-SVGR also [provides a CLI](https://react-svgr.com/docs/cli/) that could allow us to put regular SVGs in our project, then run a script that would convert them into React components automatically. If you have many icons, or a team of developers working on your project, it's definitely worth the time to set up process like this.

## Including the SVG in our project

Once we have a compatible SVG, we'll need to add [react-native-svg](https://github.com/react-native-svg/react-native-svg) to our project. We can do so with:

<Terminal cmd={['$ npx expo install react-native-svg']} />

Then we can add code like the following to our project:

<SnackEmbed snackId="@jonsamp/react-native-svg-example" preview platform="web" />

You can learn more about SVG with our [API Reference document on SVG](/versions/latest/sdk/svg/).
