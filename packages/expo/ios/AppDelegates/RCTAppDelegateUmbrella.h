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
#else
#import <React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h>
#endif


#if INLINE_USE_HERMES

#undef USE_HERMES
#undef INLINE_USE_HERMES

#endif // INLINE_USE_HERMES
