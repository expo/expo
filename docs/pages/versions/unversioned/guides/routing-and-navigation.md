---
title: Routing & Navigation
old_permalink: /versions/v12.0.0/guides/routing-and-navigation.html
previous___FILE: ./using-custom-fonts.md
next___FILE: ./push-notifications.md
---

A "single page app" on the web is not an app with a single screen, that would indeed be useless most of the time; rather, it is an app that does not ask the browser to navigate to a new URL for each new screen. Instead, a "single page app" will use its own routing subsystem (eg: react-router) that decouples the screens that are being displayed from the URL bar. Often it will also update the URL bar too, but override the mechanism that will cause the browser to reload the page entirely. The purpose of this is for the experience to be smooth and "app-like".

This same concept applies to native mobile apps. When you navigate to a new screen, rather than refreshing the entire app and starting fresh from that screen, the screen is pushed onto a navigation stack and animated into view according to its configuration.

The library that we recommend to use for routing & navigation in Expo for iOS and Android is [React Navigation](https://github.com/react-navigation/react-navigation). We suggest following the [fundamentals guide](https://reactnavigation.org/docs/en/getting-started.html) in the [React Navigation documentation](https://reactnavigation.org/) to learn more about how to use it.

React Navigation support for web is currently early and incomplete. We recommend using [react-router](https://reacttraining.com/react-router/web/guides/quick-start) for web routing instead.