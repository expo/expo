/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTModalHostView.h"

#import "ABI5_0_0RCTAssert.h"
#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTModalHostViewController.h"
#import "ABI5_0_0RCTTouchHandler.h"
#import "ABI5_0_0RCTUIManager.h"
#import "UIView+ReactABI5_0_0.h"

@implementation ABI5_0_0RCTModalHostView
{
  __weak ABI5_0_0RCTBridge *_bridge;
  BOOL _isPresented;
  ABI5_0_0RCTModalHostViewController *_modalViewController;
  ABI5_0_0RCTTouchHandler *_touchHandler;
}

ABI5_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI5_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:coder)

- (instancetype)initWithBridge:(ABI5_0_0RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _modalViewController = [ABI5_0_0RCTModalHostViewController new];
    _touchHandler = [[ABI5_0_0RCTTouchHandler alloc] initWithBridge:bridge];
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
  if (_modalViewController.view && _isPresented) {
    [_bridge.uiManager setFrame:newBounds forView:_modalViewController.view];
  }
}

- (NSArray<UIView *> *)ReactABI5_0_0Subviews
{
  return _modalViewController.view ? @[_modalViewController.view] : @[];
}

- (void)insertReactABI5_0_0Subview:(UIView *)subview atIndex:(__unused NSInteger)atIndex
{
  ABI5_0_0RCTAssert([_modalViewController.view ReactABI5_0_0Tag] == nil, @"Modal view can only have one subview");
  [subview addGestureRecognizer:_touchHandler];
  subview.autoresizingMask = UIViewAutoresizingFlexibleHeight |
                             UIViewAutoresizingFlexibleWidth;
  _modalViewController.view = subview;
}

- (void)removeReactABI5_0_0Subview:(UIView *)subview
{
  ABI5_0_0RCTAssert(subview == _modalViewController.view, @"Cannot remove view other than modal view");
  [subview removeGestureRecognizer:_touchHandler];
  _modalViewController.view = nil;
}

- (void)dismissModalViewController
{
  if (_isPresented) {
    [_modalViewController dismissViewControllerAnimated:self.animated completion:nil];
    _isPresented = NO;
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (!_isPresented && self.window) {
    ABI5_0_0RCTAssert(self.ReactABI5_0_0ViewController, @"Can't present modal view controller without a presenting view controller");
    [self.ReactABI5_0_0ViewController presentViewController:_modalViewController animated:self.animated completion:^{
      if (_onShow) {
        _onShow(nil);
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

- (void)setTransparent:(BOOL)transparent
{
  _modalViewController.modalPresentationStyle = transparent ? UIModalPresentationCustom : UIModalPresentationFullScreen;
}

@end
