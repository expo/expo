// Copyright 2015-present 650 Industries. All rights reserved.

// Some headers needs to be imported from Objective-C code too.
// Otherwise they won't be visible in `ExpoModulesCore-Swift.h`.
#import <React/RCTView.h>

#if __has_include("ExpoModulesCore-umbrella.h")
#import "ExpoModulesCore-umbrella.h"
#endif
