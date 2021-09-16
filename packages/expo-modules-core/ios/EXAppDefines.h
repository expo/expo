// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// We ship some modules in [prebuilt binaries](https://expo.fyi/prebuilt-modules),
// classic defines like `DEBUG` or `RCT_DEV` may not like what we expected.
// Because the prebuilt modules are always built with Release configurations.
// This class acts as a supporter to get app build time configurations.
//
// Note this class is not thread-safe, please make sure to intiailize
// in `application(_:didFinishLaunchingWithOptions:)`
@interface EXAppDefines : NSObject

@property (class, nonatomic, assign, readonly) BOOL APP_DEBUG;
@property (class, nonatomic, assign, readonly) BOOL APP_RCT_DEBUG;
@property (class, nonatomic, assign, readonly) BOOL APP_RCT_DEV;

+ (void)initDefines:(BOOL)debug;

+ (void)initDefines:(BOOL)debug
           rctDebug:(BOOL)rctDebug
             rctDev:(BOOL)rctDev;

@end

NS_ASSUME_NONNULL_END
