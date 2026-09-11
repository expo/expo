// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
// Pulls in UIKit on iOS/tvOS, and on macOS the aliases that map `UIGestureRecognizer` and
// `UIView` onto their AppKit counterparts. Forward declaring them instead would name classes
// that do not exist on macOS, and Swift would drop the methods below from the generated interface.
#import <ExpoModulesCore/Platform.h>

NS_ASSUME_NONNULL_BEGIN

@interface ExpoUITouchHandlerHelper : NSObject

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view;

+ (void)detachTouchHandler:(UIGestureRecognizer *)touchHandler fromView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
