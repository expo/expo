/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTRootContentView.h"

#import "ABI16_0_0RCTBridge.h"
#import "ABI16_0_0RCTPerformanceLogger.h"
#import "ABI16_0_0RCTRootView.h"
#import "ABI16_0_0RCTRootViewInternal.h"
#import "ABI16_0_0RCTTouchHandler.h"
#import "ABI16_0_0RCTUIManager.h"
#import "UIView+ReactABI16_0_0.h"

@interface ABI16_0_0RCTRootContentView () <UIGestureRecognizerDelegate>
@end

@implementation ABI16_0_0RCTRootContentView
{
  __weak ABI16_0_0RCTBridge *_bridge;
  UIColor *_backgroundColor;
}

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI16_0_0RCTBridge *)bridge
                     ReactABI16_0_0Tag:(NSNumber *)ReactABI16_0_0Tag
               sizeFlexiblity:(ABI16_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  if ((self = [super initWithFrame:frame])) {
    _bridge = bridge;
    self.ReactABI16_0_0Tag = ReactABI16_0_0Tag;
    _sizeFlexibility = sizeFlexibility;
    _touchHandler = [[ABI16_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    _touchHandler.delegate = self;
    [_touchHandler attachToView:self];
    [_bridge.uiManager registerRootView:self];
    self.layer.backgroundColor = NULL;
  }
  return self;
}

ABI16_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame:(CGRect)frame)
ABI16_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder:(nonnull NSCoder *)aDecoder)

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateAvailableSize];
}

- (void)insertReactABI16_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI16_0_0Subview:subview atIndex:atIndex];
  [_bridge.performanceLogger markStopForTag:ABI16_0_0RCTPLTTI];
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_contentHasAppeared) {
      self->_contentHasAppeared = YES;
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI16_0_0RCTContentDidAppearNotification
                                                          object:self.superview];
    }
  });
}

- (void)setSizeFlexibility:(ABI16_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  if (_sizeFlexibility == sizeFlexibility) {
    return;
  }

  _sizeFlexibility = sizeFlexibility;
  [self setNeedsLayout];
}

- (void)updateAvailableSize
{
  if (!self.ReactABI16_0_0Tag || !_bridge.isValid) {
    return;
  }

  CGSize size = self.bounds.size;
  CGSize availableSize =
    CGSizeMake(
      _sizeFlexibility & ABI16_0_0RCTRootViewSizeFlexibilityWidth ? INFINITY : size.width,
      _sizeFlexibility & ABI16_0_0RCTRootViewSizeFlexibilityHeight ? INFINITY : size.height
    );

  [_bridge.uiManager setAvailableSize:availableSize forRootView:self];
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  _backgroundColor = backgroundColor;
  if (self.ReactABI16_0_0Tag && _bridge.isValid) {
    [_bridge.uiManager setBackgroundColor:backgroundColor forView:self];
  }
}

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  // The root content view itself should never receive touches
  UIView *hitView = [super hitTest:point withEvent:event];
  if (_passThroughTouches && hitView == self) {
    return nil;
  }
  return hitView;
}

- (void)invalidate
{
  if (self.userInteractionEnabled) {
    self.userInteractionEnabled = NO;
    [(ABI16_0_0RCTRootView *)self.superview contentViewInvalidated];
    [_bridge enqueueJSCall:@"AppRegistry"
                    method:@"unmountApplicationComponentAtRootTag"
                      args:@[self.ReactABI16_0_0Tag]
                completion:NULL];
  }
}

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch
{
  if (![gestureRecognizer isKindOfClass:[ABI16_0_0RCTTouchHandler class]]) {
    return YES;
  }

  UIView *currentView = touch.view;
  while (currentView && ![currentView isReactABI16_0_0RootView]) {
    currentView = currentView.superview;
  }
  return currentView == self;
}

@end
