// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class UIGestureRecognizer;
@class UIView;

@interface ExpoUITouchHandlerHelper : NSObject

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
