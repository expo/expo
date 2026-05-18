// Copyright 2026-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// ObjC indirections around React APIs that `ExpoModulesCore`'s Swift sources
// would otherwise call directly. Keeping them in ObjC means the Swift sources
// don't need to `import React`, which in turn keeps `React` out of
// `ExpoModulesCore.swiftmodule`'s recorded module dependencies — every
// downstream Swift consumer would otherwise have to scan the `React` Clang
// module just to load `ExpoModulesCore`.

/**
 Triggers React Native's reload command listeners. Wraps `RCTTriggerReloadCommandListeners`.
 */
NS_SWIFT_NAME(ReactReloadCommand)
@interface EXReactReloadCommand : NSObject

+ (void)triggerWithReason:(NSString *)reason;

@end

/**
 Normalizes a React Native input event name (strips the `top` prefix and
 lower-cases the following character). Wraps `RCTNormalizeInputEventName`.
 */
NS_SWIFT_NAME(ReactEventName)
@interface EXReactEventName : NSObject

+ (nullable NSString *)normalizeInput:(NSString *)name;

@end

#if !TARGET_OS_OSX
@class UIView;
@class UIViewController;

/**
 Returns the React-managed parent controller of `view`, walking up the
 responder chain. Wraps `-[UIView reactViewController]` from
 `<React/UIView+React.h>`.
 */
NS_SWIFT_NAME(ReactView)
@interface EXReactView : NSObject

+ (nullable UIViewController *)parentControllerOf:(UIView *)view;

@end
#endif

NS_ASSUME_NONNULL_END
