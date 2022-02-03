#import <UIKit/UIKit.h>

#import "ABI43_0_0RNSFullWindowOverlay.h"

#import <ABI43_0_0React/ABI43_0_0RCTTouchHandler.h>

@implementation ABI43_0_0RNSFullWindowOverlayContainer

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  for (UIView *view in [self subviews]) {
    if (view.userInteractionEnabled && [view pointInside:[self convertPoint:point toView:view] withEvent:event]) {
      return YES;
    }
  }
  return NO;
}

@end

@implementation ABI43_0_0RNSFullWindowOverlay {
  __weak ABI43_0_0RCTBridge *_bridge;
  ABI43_0_0RNSFullWindowOverlayContainer *_container;
  CGRect _reactFrame;
  ABI43_0_0RCTTouchHandler *_touchHandler;
}

- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _reactFrame = CGRectNull;
    _container = self.container;
    [self show];
  }

  return self;
}

- (void)ABI43_0_0ReactSetFrame:(CGRect)frame
{
  _reactFrame = frame;
  [_container setFrame:frame];
}

- (void)addSubview:(UIView *)view
{
  [_container addSubview:view];
}

- (ABI43_0_0RNSFullWindowOverlayContainer *)container
{
  if (_container == nil) {
    _container = [[ABI43_0_0RNSFullWindowOverlayContainer alloc] initWithFrame:_reactFrame];
  }

  return _container;
}

- (void)show
{
  UIWindow *window = ABI43_0_0RCTSharedApplication().delegate.window;
  [window addSubview:_container];
}

- (void)hide
{
  if (!_container) {
    return;
  }

  [_container removeFromSuperview];
}

- (void)didMoveToWindow
{
  if (self.window == nil) {
    [self hide];
    [_touchHandler detachFromView:_container];
  } else {
    if (_touchHandler == nil) {
      _touchHandler = [[ABI43_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    }
    [_touchHandler attachToView:_container];
  }
}

- (void)invalidate
{
  [self hide];
  _container = nil;
}

@end

@implementation ABI43_0_0RNSFullWindowOverlayManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI43_0_0RNSFullWindowOverlay alloc] initWithBridge:self.bridge];
}

@end
