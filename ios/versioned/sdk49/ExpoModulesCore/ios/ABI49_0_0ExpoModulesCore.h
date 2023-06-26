// Copyright 2015-present 650 Industries. All rights reserved.

// Uncomment this to temporarily disable Fabric.
// Also make sure to change `ABI49_0_0RCT_NEW_ARCH_ENABLED` C++ flag in Pods project's build settings.
//#undef RN_FABRIC_ENABLED

// Some headers needs to be imported from Objective-C code too.
// Otherwise they won't be visible in `ExpoModulesCore-Swift.h`.
#import <ABI49_0_0React/ABI49_0_0RCTView.h>

#if __has_include(<ABI49_0_0ExpoModulesCore/ABI49_0_0ExpoModulesCore-umbrella.h>)
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0ExpoModulesCore-umbrella.h>
#endif
