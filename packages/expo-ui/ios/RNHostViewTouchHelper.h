// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNHostViewTouchHelper : NSObject

+ (nullable UIGestureRecognizer *)createTouchHandlerForView:(UIView *)view;
+ (void)detachTouchHandler:(UIGestureRecognizer *)touchHandler fromView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
