// Copyright 2015-present 650 Industries. All rights reserved.

/**
 `React-RCTAppDelegate-umbrella.h` requires `USE_HERMES`.
 This umbrella wrapper lets us import `React-RCTAppDelegate-umbrella.h` in `Expo.h` without requiring `USE_HERMES` from app project settings.
 */

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#ifndef USE_HERMES

#define USE_HERMES 1
#define INLINE_USE_HERMES 1

#endif // USE_HERMES
#endif // __has_include(<reacthermes/HermesExecutorFactory.h>)

#if __has_include(<React_RCTAppDelegate/React-RCTAppDelegate-umbrella.h>)
#import <React_RCTAppDelegate/React-RCTAppDelegate-umbrella.h>
#elif __has_include(<React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h>)
#import <React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h>
#else
// SwiftPM: React Native ships ONE consolidated React.framework rather than a
// separate React_RCTAppDelegate pod, so neither umbrella above exists. The
// app-delegate headers are in React.framework/Headers but deliberately absent
// from React-umbrella.h, so import them individually.
#import <React/RCTReactNativeFactory.h>
#import <React/RCTDefaultReactNativeFactoryDelegate.h>
#import <React/RCTRootViewFactory.h>
#endif


#if INLINE_USE_HERMES

#undef USE_HERMES
#undef INLINE_USE_HERMES

#endif // INLINE_USE_HERMES
