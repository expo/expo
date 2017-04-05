// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

#define LOG_LEVEL_DEF ddLogLevel
#import <CocoaLumberjack/CocoaLumberjack.h>

#if DEBUG
static const DDLogLevel ddLogLevel = DDLogLevelVerbose;
#else
static const DDLogLevel ddLogLevel = DDLogLevelWarning;
#endif

// Dynamically generated configuration
#ifndef EX_DETACHED
#import "../../Generated/EXDynamicMacros.h"
#endif

#define EXAssertMainThread() NSAssert([NSThread isMainThread], @"Method must be called on main thread")

#define EX_ENABLE_LEGACY_MENU_BEHAVIOR 0

@protocol EXKernelUtil <NSObject>

@end
