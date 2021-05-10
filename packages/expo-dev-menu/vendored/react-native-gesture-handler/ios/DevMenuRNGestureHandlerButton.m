//
//  DevMenuRNGestureHandlerButton.m
//  DevMenuRNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "DevMenuRNGestureHandlerButton.h"

#import <UIKit/UIKit.h>

/**
 * Gesture Handler Button components overrides standard mechanism used by DevMenuRN
 * to determine touch target, which normally would reurn the UIView that is placed
 * as the deepest element in the view hierarchy.
 * It's done this way as it allows for the actual target determination to run in JS
 * where we can travers up the view ierarchy to find first element that want to became
 * JS responder.
 *
 * Since we want to use native button (or actually a `UIControl`) we need to determine
 * the target in native. This makes it impossible for JS responder based components to
 * function as a subviews of the button component. Here we override `hitTest:withEvent:`
 * method and we only determine the target to be either a subclass of `UIControl` or a
 * view that has gesture recognizers registered.
 *
 * This "default" behaviour of target determinator should be sufficient in most of the
 * cases as in fact it is not that common UI pattern to have many nested buttons (usually
 * there are just two levels e.g. when you have clickable table cells with additional
 * buttons). In cases when the default behaviour is insufficient it is recommended to use
 * `TapGestureHandler` instead of a button which gives much better flexibility as far as
 * controlling the touch flow.
 */
@implementation DevMenuRNGestureHandlerButton

- (instancetype)init
{
  self = [super init];
  if (self) {
    _hitTestEdgeInsets = UIEdgeInsetsZero;
#if !TARGET_OS_TV
    [self setExclusiveTouch:YES];
#endif
  }
  return self;
}

- (BOOL)shouldHandleTouch:(UIView *)view
{
    return [view isKindOfClass:[UIControl class]] || [view.gestureRecognizers count] > 0;
}

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  if (UIEdgeInsetsEqualToEdgeInsets(self.hitTestEdgeInsets, UIEdgeInsetsZero)) {
    return [super pointInside:point withEvent:event];
  }
  CGRect hitFrame = UIEdgeInsetsInsetRect(self.bounds, self.hitTestEdgeInsets);
  return CGRectContainsPoint(hitFrame, point);
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    UIView *inner = [super hitTest:point withEvent:event];
    while (inner && ![self shouldHandleTouch:inner]) inner = inner.superview;
    return inner;
}

@end

