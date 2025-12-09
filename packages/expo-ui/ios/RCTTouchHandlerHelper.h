// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
NS_ASSUME_NONNULL_BEGIN

@interface RCTTouchHandlerHelper : NSObject

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
