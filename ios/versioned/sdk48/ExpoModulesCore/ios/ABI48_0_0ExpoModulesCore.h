// Copyright 2015-present 650 Industries. All rights reserved.

// Uncomment this to temporarily disable Fabric.
// Also make sure to change `ABI48_0_0RCT_NEW_ARCH_ENABLED` C++ flag in Pods project's build settings.
//#undef RN_FABRIC_ENABLED

// Some headers needs to be imported from Objective-C code too.
// Otherwise they won't be visible in `ExpoModulesCore-Swift.h`.
#import <ABI48_0_0React/ABI48_0_0RCTView.h>

#if __has_include("ExpoModulesCore-umbrella.h")
#import "ExpoModulesCore-umbrella.h"
#endif
