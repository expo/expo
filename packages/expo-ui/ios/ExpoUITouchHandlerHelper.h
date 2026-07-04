// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class UIGestureRecognizer;
@class UIView;

@interface ExpoUITouchHandlerHelper : NSObject

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view;

/// True iff `recognizer` is one of React Native's surface touch handlers: Fabric's
/// `RCTSurfaceTouchHandler` (compile-time class) or Paper's `RCTTouchHandler` (resolved
/// at runtime via `NSClassFromString`, since the Paper header may be absent in
/// Fabric-only builds). Shared by the menu-dismiss guard's disable path and the
/// create path so both agree on exactly which recognizers count as RN touch handlers.
+ (BOOL)isReactTouchHandler:(UIGestureRecognizer *)recognizer;

@end

NS_ASSUME_NONNULL_END
