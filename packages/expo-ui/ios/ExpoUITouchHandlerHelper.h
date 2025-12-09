// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/Platform.h>
NS_ASSUME_NONNULL_BEGIN

@interface ExpoUITouchHandlerHelper : NSObject

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
