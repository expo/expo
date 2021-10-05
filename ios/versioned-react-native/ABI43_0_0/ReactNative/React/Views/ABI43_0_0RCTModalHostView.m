/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTModalHostView.h"

#import <UIKit/UIKit.h>

#import "ABI43_0_0RCTAssert.h"
#import "ABI43_0_0RCTBridge.h"
#import "ABI43_0_0RCTModalHostViewController.h"
#import "ABI43_0_0RCTTouchHandler.h"
#import "ABI43_0_0RCTUIManager.h"
#import "ABI43_0_0RCTUtils.h"
#import "ABI43_0_0UIView+React.h"

@implementation ABI43_0_0RCTModalHostView {
  __weak ABI43_0_0RCTBridge *_bridge;
  BOOL _isPresented;
  ABI43_0_0RCTModalHostViewController *_modalViewController;
  ABI43_0_0RCTTouchHandler *_touchHandler;
  UIView *_ABI43_0_0ReactSubview;
  UIInterfaceOrientation _lastKnownOrientation;
}

ABI43_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI43_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : coder)

- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _modalViewController = [ABI43_0_0RCTModalHostViewController new];
    UIView *containerView = [UIView new];
    containerView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    _modalViewController.view = containerView;
    _touchHandler = [[ABI43_0_0RCTTouchHandler alloc] initWithBridge:bridge];
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
  if (_ABI43_0_0ReactSubview && _isPresented) {
    [_bridge.uiManager setSize:newBounds.size forView:_ABI43_0_0ReactSubview];
    [self notifyForOrientationChange];
  }
}

- (void)notifyForOrientationChange
{
  if (!_onOrientationChange) {
    return;
  }

  UIInterfaceOrientation currentOrientation = [ABI43_0_0RCTSharedApplication() statusBarOrientation];
  if (currentOrientation == _lastKnownOrientation) {
    return;
  }
  _lastKnownOrientation = currentOrientation;

  BOOL isPortrait = currentOrientation == UIInterfaceOrientationPortrait ||
      currentOrientation == UIInterfaceOrientationPortraitUpsideDown;
  NSDictionary *eventPayload = @{
    @"orientation" : isPortrait ? @"portrait" : @"landscape",
  };
  _onOrientationChange(eventPayload);
}

- (void)insertABI43_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  ABI43_0_0RCTAssert(_ABI43_0_0ReactSubview == nil, @"Modal view can only have one subview");
  [super insertABI43_0_0ReactSubview:subview atIndex:atIndex];
  [_touchHandler attachToView:subview];

  [_modalViewController.view insertSubview:subview atIndex:0];
  _ABI43_0_0ReactSubview = subview;
}

- (void)removeABI43_0_0ReactSubview:(UIView *)subview
{
  ABI43_0_0RCTAssert(subview == _ABI43_0_0ReactSubview, @"Cannot remove view other than modal view");
  // Superclass (category) removes the `subview` from actual `superview`.
  [super removeABI43_0_0ReactSubview:subview];
  [_touchHandler detachFromView:subview];
  _ABI43_0_0ReactSubview = nil;
}

- (void)didUpdateABI43_0_0ReactSubviews
{
  // Do nothing, as subview (singular) is managed by `insertABI43_0_0ReactSubview:atIndex:`
}

- (void)dismissModalViewController
{
  if (_isPresented) {
    [_delegate dismissModalHostView:self withViewController:_modalViewController animated:[self hasAnimationType]];
    _isPresented = NO;
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  // In the case where there is a LayoutAnimation, we will be reinserted into the view hierarchy but only for aesthetic
  // purposes. In such a case, we should NOT represent the <Modal>.
  if (!self.userInteractionEnabled && ![self.superview.ABI43_0_0ReactSubviews containsObject:self]) {
    return;
  }

  if (!_isPresented && self.window) {
    ABI43_0_0RCTAssert(self.ABI43_0_0ReactViewController, @"Can't present modal view controller without a presenting view controller");

    _modalViewController.supportedInterfaceOrientations = [self supportedOrientationsMask];

    if ([self.animationType isEqualToString:@"fade"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
    } else if ([self.animationType isEqualToString:@"slide"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    }
    if (self.presentationStyle != UIModalPresentationNone) {
      _modalViewController.modalPresentationStyle = self.presentationStyle;
    }
    [_delegate presentModalHostView:self withViewController:_modalViewController animated:[self hasAnimationType]];
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
  return _modalViewController.modalPresentationStyle == UIModalPresentationOverFullScreen;
}

- (BOOL)hasAnimationType
{
  return ![self.animationType isEqualToString:@"none"];
}

- (void)setTransparent:(BOOL)transparent
{
  if (self.isTransparent != transparent) {
    return;
  }

  _modalViewController.modalPresentationStyle =
      transparent ? UIModalPresentationOverFullScreen : UIModalPresentationFullScreen;
}

- (UIInterfaceOrientationMask)supportedOrientationsMask
{
  if (_supportedOrientations.count == 0) {
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
      return UIInterfaceOrientationMaskAll;
    } else {
      return UIInterfaceOrientationMaskPortrait;
    }
  }

  UIInterfaceOrientationMask supportedOrientations = 0;
  for (NSString *orientation in _supportedOrientations) {
    if ([orientation isEqualToString:@"portrait"]) {
      supportedOrientations |= UIInterfaceOrientationMaskPortrait;
    } else if ([orientation isEqualToString:@"portrait-upside-down"]) {
      supportedOrientations |= UIInterfaceOrientationMaskPortraitUpsideDown;
    } else if ([orientation isEqualToString:@"landscape"]) {
      supportedOrientations |= UIInterfaceOrientationMaskLandscape;
    } else if ([orientation isEqualToString:@"landscape-left"]) {
      supportedOrientations |= UIInterfaceOrientationMaskLandscapeLeft;
    } else if ([orientation isEqualToString:@"landscape-right"]) {
      supportedOrientations |= UIInterfaceOrientationMaskLandscapeRight;
    }
  }
  return supportedOrientations;
}

@end
