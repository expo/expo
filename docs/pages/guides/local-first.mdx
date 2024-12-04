---
title: Local-first architecture with Expo
sidebar_title: Local-first
description: An introduction to the emerging local-first software movement, including links to relevant learning resources and tools.
---

> **info** This guide is a work in progress. If you have any feedback, [open an issue](https://github.com/expo/expo/issues/new/choose) in our GitHub repository.

The term "local-first" was first coined in the paper ["Local-first software"](https://www.inkandswitch.com/local-first/), written by the research lab [Ink & Switch](https://www.inkandswitch.com/), but the ideas behind it have been around for a long time. It's the architecture that powers some of our favorite apps, like [Linear](https://linear.app/), [Superhuman](https://superhuman.com/), [Excalidraw](https://excalidraw.com/), and even [Apple Notes](<https://en.wikipedia.org/wiki/Notes_(Apple)>).

In local-first software, "the availability of another computer should never prevent you from working" ([via Martin Kleppmann](https://www.youtube.com/watch?v=NMq0vncHJvU)). When you are offline, you can still read and write directly from/to a database on your device. You can trust the software to work offline, and you know that when you are connected to the internet, your data will be seamlessly synced and available on any of your devices running the app. When you're online, this architecture is well suited for "multiplayer" apps, [as popularized by Figma](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/).

To dig deeper into what local-first is and how it works, refer to the [additional resources](#additional-resources) below.

## Why use local-first architecture?

### User experience benefits

Local-first software feels **fast** because interactions are no longer network-bound, you can read and write directly from/to a database on your device.

You can trust the software to work offline, and you know that when you are connected to the internet, your data will be seamlessly synced and available on any of your devices running the app.

Another characteristic of local-first software is that it is collaborative &mdash; multiple devices can work on the same data, and changes are synced across all of them. This can happen in real-time when you collaborate on a design in [Figma](https://www.figma.com/) or asynchronously when you create a task while offline in Linear and it is synced when you are online again.

### Developer experience benefits

You no longer have to manage various states of your app for each network request &mdash; "loaded", "loading", "error", and so on, with their corresponding UI states and other logic. Write to a local database, and the app will automatically sync the changes to the server. This means that you can focus on building the app, and not worry as much about the networking and offline states.

Your server availability may still be important, but in the event of an outage your users can still access the app and continue working. You may even provide a mechanism to sync the data without going through your server.

## Challenges in building local-first apps

The tools available today are still in their early stages, and so you may find yourself solving problems that you would expect to be solved by the tools you are using today. For example, you may need to implement a custom sync layer, or you may have to figure out how to handle permissions for multiple users operating on the same data. As the ecosystem evolves, we expect it to become easier to build local-first apps. If you're not prepared to be an early adopter, and everything that comes with that, you might want to wait for the tools to mature before you start building your app with local-first tools.

## Tools for building local-first apps

A comprehensive list of tools is available on the ["Local-first software" community website](https://localfirstweb.dev/). The following is a shorter list of tools that we at Expo have had direct experience working with.

One way to think of local-first tools is to group them by the following categories: persistence, state management, and syncing. Some tools will fit into multiple categories if they handle multiple aspects of the problem. Syncing can be further subdivided into syncable data structures and transport layers.

### Legend-State

[Legend-State](https://legendapp.com/open-source/state/v3/) is a super fast all-in-one state and sync library that lets you write less code to make faster apps. It has the following primary goals:

- Faster state management for React apps
- Fine-grained reactivity for minimal renders
- Powerful sync and persistence (with Supabase support built-in)

It works with Expo and React Native (via [React Native Async Storage](https://github.com/react-native-async-storage/async-storage?tab=readme-ov-file#react-native-async-storage)). This makes it a perfect match for building local-first mobile and web apps. Get started by using the [Legend-State Supabase example](https://github.com/expo/examples/tree/master/with-legend-state-supabase): `npx create-expo-app --example with-legend-state-supabase`.

### TinyBase

[TinyBase](https://tinybase.org/) calls itself "the reactive data store for local-first apps". It is a state management library that plugs in to many of the most popular syncing and persistence layers, such as [Yjs](#yjs) and [SQLite](#sqlite). It's a great choice for building local-first apps that need to persist and sync data. Get started by using the [TinyBase example](https://github.com/expo/examples/tree/master/with-tinybase): `npx create-expo-app --example with-tinybase`.

### SQLite

[Expo SQLite](/versions/latest/sdk/sqlite/) is a SQLite library that is a great choice for persistence for local-first apps. You can use SQLite with different state management and syncing layers in front of it, such as [`y-expo-sqlite`](https://github.com/brentvatne/y-expo-sqlite) to persist [Yjs](#yjs) documents, and [TinyBase](#tinybase) as a state management layer. Using SQLite is flexible, but you will need to combine it with other tools or build your own tools to get a complete local-first solution. See [Expo SQLite API reference](/versions/latest/sdk/sqlite/) for more information.

### Yjs

[Yjs](https://github.com/yjs/yjs) is a [CRDT implementation](https://github.com/yjs/yjs?tab=readme-ov-file#yjs-crdt-algorithm) that provides data types that can be synced across multiple clients. When building an app with Yjs and working with data that you would like to be able to sync, then you would use `Y.Array` and `Y.Map` to represent your data rather than `Array` and `Object`. You may use a library like [TinyBase](#tinybase) for state management on top of Yjs, and persistence can be handled by a variety of tools, from a JSON file on your filesystem to a full-fledged database (such as [`y-expo-sqlite`](https://github.com/brentvatne/y-expo-sqlite)) and everything in between. See [Yjs's GitHub repository](https://github.com/yjs/yjs) for more information.

### Prisma

[Prisma](https://prisma.io) is well known as the most popular ORM for Node.js and TypeScript backends, and it's now available for [Expo and React Native in early access](https://www.prisma.io/blog/bringing-prisma-orm-to-react-native-and-expo). Prisma aims to provide a complete local-first solution, with state management, syncing, and persistence all covered for you. While it's still early, [Beto Moedano](https://github.com/betomoedano) has put together full walkthrough of using Prisma with Expo to build a local-first Notion clone, [watch it on YouTube](https://www.youtube.com/watch?v=uTrPte0sCiw) and [check out the code on GitHub](https://github.com/betomoedano/React-Native-Notion-Clone).

### Jazz

[Jazz.tools](https://jazz.tools/docs/react-native) is a framework for building local-first apps. It is open source, provides first-class support for Expo and you can self-host it or use [Jazz Cloud](https://jazz.tools/cloud) to start quickly. [Jazz](https://jazz.tools). To learn more, check out the [examples](https://jazz.tools/examples#react-native) or see the [Getting Started Guide](https://jazz.tools/docs/react-native) for detailed instructions.

### Other tools

The following list, far from being comprehensive, provides other tools that have caught our attention and that you may find interesting to explore. For a more thorough list of tools, see ["Local-first software" community website](https://localfirstweb.dev/).

- [Automerge](https://automerge.org/)
- [ElectricSQL](https://electric-sql.com/)
- [Instant](https://www.instantdb.com/)
- [LiveStore](https://github.com/livestorejs)
- [PowerSync](https://www.powersync.com/)

## Additional resources

- ["The past, present, and future of local-first"](https://www.youtube.com/watch?v=NMq0vncHJvU) by Martin Kleppmann
- ["Local-first software"](https://www.inkandswitch.com/local-first/) by Ink & Switch
- ["Local-first software" community website](https://localfirstweb.dev/) and [meetup playlist on YouTube](https://www.youtube.com/playlist?list=PLTbD2QA-VMnXFsLbuPGz1H-Najv9MD2-H)
- [localfirst.fm podcast](https://localfirst.fm/) by Johannes Schickling
