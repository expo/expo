// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

#define LOG_LEVEL_DEF ddLogLevel
#import <CocoaLumberjack/CocoaLumberjack.h>

#if DEBUG
static const DDLogLevel ddLogLevel = DDLogLevelVerbose;
#else
static const DDLogLevel ddLogLevel = DDLogLevelWarning;
#endif

#define EXAssertMainThread() NSAssert([NSThread isMainThread], @"Method must be called on main thread")

@protocol EXKernelUtil <NSObject>

@end
