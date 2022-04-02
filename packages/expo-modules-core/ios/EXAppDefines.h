// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 For expo modules to get app build time preprocessor values.
 We ship some modules in [prebuilt binaries](https://expo.fyi/prebuilt-modules),
 classic defines like `DEBUG` or `RCT_DEV` may not work as expected
 because the prebuilt modules are always built with Release configuration.
 This class acts as a supporter to get app build time preprocessor values.
 */
@interface EXAppDefines : NSObject

@property (class, nonatomic, assign, readonly) BOOL APP_DEBUG NS_SWIFT_NAME(APP_DEBUG);
@property (class, nonatomic, assign, readonly) BOOL APP_RCT_DEBUG NS_SWIFT_NAME(APP_RCT_DEBUG);
@property (class, nonatomic, assign, readonly) BOOL APP_RCT_DEV NS_SWIFT_NAME(APP_RCT_DEV);
@property (class, nonatomic, assign, readonly) BOOL APP_NEW_ARCH_ENABLED NS_SWIFT_NAME(APP_NEW_ARCH_ENABLED);

+ (NSDictionary *)getAllDefines;

+ (void)load:(NSDictionary *)defines;

@end

NS_ASSUME_NONNULL_END
