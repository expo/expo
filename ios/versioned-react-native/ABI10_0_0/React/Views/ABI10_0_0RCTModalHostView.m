/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTModalHostView.h"

#import "ABI10_0_0RCTAssert.h"
#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTModalHostViewController.h"
#import "ABI10_0_0RCTTouchHandler.h"
#import "ABI10_0_0RCTUIManager.h"
#import "UIView+ReactABI10_0_0.h"

@implementation ABI10_0_0RCTModalHostView
{
  __weak ABI10_0_0RCTBridge *_bridge;
  BOOL _isPresented;
  ABI10_0_0RCTModalHostViewController *_modalViewController;
  ABI10_0_0RCTTouchHandler *_touchHandler;
  UIView *_ReactABI10_0_0Subview;
}

ABI10_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI10_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:coder)

- (instancetype)initWithBridge:(ABI10_0_0RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _modalViewController = [ABI10_0_0RCTModalHostViewController new];
    UIView *containerView = [UIView new];
    containerView.autoresizingMask =  UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    _modalViewController.view = containerView;
    _touchHandler = [[ABI10_0_0RCTTouchHandler alloc] initWithBridge:bridge];
    _isPresented = NO;

    __weak typeof(self) weakSelf = self;
    _modalViewController.boundsDidChangeBlock = ^(CGRect newBounds) {
      [weakSelf notifyForBoundsChange:newBounds];
    };
  }

  return self;
}

- (void)notifyForBoundsChange:(CGRect)newBounds
{
  if (_ReactABI10_0_0Subview && _isPresented) {
    [_bridge.uiManager setFrame:newBounds forView:_ReactABI10_0_0Subview];
  }
}

- (void)insertReactABI10_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  ABI10_0_0RCTAssert(_ReactABI10_0_0Subview == nil, @"Modal view can only have one subview");
  [super insertReactABI10_0_0Subview:subview atIndex:atIndex];
  [subview addGestureRecognizer:_touchHandler];
  subview.autoresizingMask = UIViewAutoresizingFlexibleHeight |
                             UIViewAutoresizingFlexibleWidth;

  [_modalViewController.view insertSubview:subview atIndex:0];
  _ReactABI10_0_0Subview = subview;
}

- (void)removeReactABI10_0_0Subview:(UIView *)subview
{
  ABI10_0_0RCTAssert(subview == _ReactABI10_0_0Subview, @"Cannot remove view other than modal view");
  [super removeReactABI10_0_0Subview:subview];
  [subview removeGestureRecognizer:_touchHandler];
  _ReactABI10_0_0Subview = nil;
}

- (void)didUpdateReactABI10_0_0Subviews
{
  // Do nothing, as subview (singular) is managed by `insertReactABI10_0_0Subview:atIndex:`
}

- (void)dismissModalViewController
{
  if (_isPresented) {
    [_modalViewController dismissViewControllerAnimated:[self hasAnimationType] completion:nil];
    _isPresented = NO;
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (!_isPresented && self.window) {
    ABI10_0_0RCTAssert(self.ReactABI10_0_0ViewController, @"Can't present modal view controller without a presenting view controller");

    if ([self.animationType isEqualToString:@"fade"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
    } else if ([self.animationType isEqualToString:@"slide"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    }
    [self.ReactABI10_0_0ViewController presentViewController:_modalViewController animated:[self hasAnimationType] completion:^{
      if (self->_onShow) {
        self->_onShow(nil);
      }
    }];
    _isPresented = YES;
  }
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];

  if (_isPresented && !self.superview) {
    [self dismissModalViewController];
  }
}

- (void)invalidate
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self dismissModalViewController];
  });
}

- (BOOL)isTransparent
{
  return _modalViewController.modalPresentationStyle == UIModalPresentationCustom;
}

- (BOOL)hasAnimationType
{
  return ![self.animationType isEqualToString:@"none"];
}

- (void)setTransparent:(BOOL)transparent
{
  _modalViewController.modalPresentationStyle = transparent ? UIModalPresentationCustom : UIModalPresentationFullScreen;
}

@end
