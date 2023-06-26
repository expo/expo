/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTRootContentView.h"

#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTPerformanceLogger.h"
#import "ABI49_0_0RCTRootView.h"
#import "ABI49_0_0RCTRootViewInternal.h"
#import "ABI49_0_0RCTTouchHandler.h"
#import "ABI49_0_0RCTUIManager.h"
#import "ABI49_0_0UIView+React.h"

@implementation ABI49_0_0RCTRootContentView

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI49_0_0RCTBridge *)bridge
                     ABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
              sizeFlexibility:(ABI49_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  if ((self = [super initWithFrame:frame])) {
    _bridge = bridge;
    self.ABI49_0_0ReactTag = ABI49_0_0ReactTag;
    _sizeFlexibility = sizeFlexibility;
    _touchHandler = [[ABI49_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    [_touchHandler attachToView:self];
    [_bridge.uiManager registerRootView:self];
  }
  return self;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (nonnull NSCoder *)aDecoder)

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateAvailableSize];
}

- (void)insertABI49_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI49_0_0ReactSubview:subview atIndex:atIndex];
  [_bridge.performanceLogger markStopForTag:ABI49_0_0RCTPLTTI];
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_contentHasAppeared) {
      self->_contentHasAppeared = YES;
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTContentDidAppearNotification object:self.superview];
    }
  });
}

- (void)setSizeFlexibility:(ABI49_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  if (_sizeFlexibility == sizeFlexibility) {
    return;
  }

  _sizeFlexibility = sizeFlexibility;
  [self setNeedsLayout];
}

- (CGSize)availableSize
{
  CGSize size = self.bounds.size;
  return CGSizeMake(
      _sizeFlexibility & ABI49_0_0RCTRootViewSizeFlexibilityWidth ? INFINITY : size.width,
      _sizeFlexibility & ABI49_0_0RCTRootViewSizeFlexibilityHeight ? INFINITY : size.height);
}

- (void)updateAvailableSize
{
  if (!self.ABI49_0_0ReactTag || !_bridge.isValid) {
    return;
  }

  [_bridge.uiManager setAvailableSize:self.availableSize forRootView:self];
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
    [(ABI49_0_0RCTRootView *)self.superview contentViewInvalidated];

    [_bridge enqueueJSCall:@"AppRegistry"
                    method:@"unmountApplicationComponentAtRootTag"
                      args:@[ self.ABI49_0_0ReactTag ]
                completion:NULL];
  }
}

@end
