---
title: Introduction
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

> ⏩ Ready to advance from Expo Go and get a development build of your project? Follow the [Getting Started guide](getting-started.md).

> 👀 Want to get notified of new releases to `expo-dev-client` with a changelog and upgrade instructions? Sign up for the [mailing list](https://expo.dev/mailing-list/dev-client).

Building your project with Expo allows you to iterate quickly and safely by allowing you to make most changes in JavaScript. [Your team can achieve web-like iteration speeds](https://blog.expo.dev/javascript-driven-development-with-custom-runtimes-eda87d574c9d) by decomposing your application into:

- **A Client**: A native binary that can interact with platform API which is built and distributed the same as in traditional native development. Expo Go is an example of a client that is used to develop many Expo apps.
- **An Update**: An atomic collection of assets like JavaScript, data files, or media that instruct the client how to behave. These updates may be served from your local computer by `expo-cli`, embedded in the binary by EAS Build, or hosted on a publicly available server.

## From Expo Go to Development Builds

To help new projects get started, the [Expo Go](https://expo.dev/client) app is a standard client containing a preset collection of modules. As your project moves toward release, you may find that you need to customize your project, either to reduce your bundle size, to use a module offered by developers in the React Native community, or even to add your own custom native code. At that point, you can build a development client tailored to your project, install it on your phone, and continue developing. 

**Development builds** of your app are Debug builds containing the `expo-dev-client` package. Like production builds are for the general public and preview builds let your team test your next release, development builds let developers iterate as quickly as possible. They come with extensible development tools to develop and test your project.

> ⏩ Ready to create a development build of your project? Follow the [Getting Started guide](getting-started.md).

<object width="100%" height="400">
  <param name="movie" value="https://youtube.com/embed/_SWalkrP0CA" />
  <param name="wmode" value="transparent" />
  <embed src="https://youtube.com/embed/_SWalkrP0CA" type="application/x-shockwave-flash" wmode="transparent" width="100%" height="400" />
</object>

