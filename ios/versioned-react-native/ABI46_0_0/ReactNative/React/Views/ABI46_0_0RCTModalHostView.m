/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTModalHostView.h"

#import <UIKit/UIKit.h>

#import "ABI46_0_0RCTAssert.h"
#import "ABI46_0_0RCTBridge.h"
#import "ABI46_0_0RCTModalHostViewController.h"
#import "ABI46_0_0RCTTouchHandler.h"
#import "ABI46_0_0RCTUIManager.h"
#import "ABI46_0_0RCTUtils.h"
#import "ABI46_0_0UIView+React.h"

@implementation ABI46_0_0RCTModalHostView {
  __weak ABI46_0_0RCTBridge *_bridge;
  BOOL _isPresented;
  ABI46_0_0RCTModalHostViewController *_modalViewController;
  ABI46_0_0RCTTouchHandler *_touchHandler;
  UIView *_ABI46_0_0ReactSubview;
  UIInterfaceOrientation _lastKnownOrientation;
  ABI46_0_0RCTDirectEventBlock _onRequestClose;
}

ABI46_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI46_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : coder)

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _modalViewController = [ABI46_0_0RCTModalHostViewController new];
    UIView *containerView = [UIView new];
    containerView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    _modalViewController.view = containerView;
    _touchHandler = [[ABI46_0_0RCTTouchHandler alloc] initWithBridge:bridge];
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
  if (_ABI46_0_0ReactSubview && _isPresented) {
    [_bridge.uiManager setSize:newBounds.size forView:_ABI46_0_0ReactSubview];
    [self notifyForOrientationChange];
  }
}

- (void)setOnRequestClose:(ABI46_0_0RCTDirectEventBlock)onRequestClose
{
  _onRequestClose = onRequestClose;
}

- (void)presentationControllerDidAttemptToDismiss:(UIPresentationController *)controller
{
  if (_onRequestClose != nil) {
    _onRequestClose(nil);
  }
}

- (void)notifyForOrientationChange
{
  if (!_onOrientationChange) {
    return;
  }

  UIInterfaceOrientation currentOrientation = [ABI46_0_0RCTSharedApplication() statusBarOrientation];
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

- (void)insertABI46_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  ABI46_0_0RCTAssert(_ABI46_0_0ReactSubview == nil, @"Modal view can only have one subview");
  [super insertABI46_0_0ReactSubview:subview atIndex:atIndex];
  [_touchHandler attachToView:subview];

  [_modalViewController.view insertSubview:subview atIndex:0];
  _ABI46_0_0ReactSubview = subview;
}

- (void)removeABI46_0_0ReactSubview:(UIView *)subview
{
  ABI46_0_0RCTAssert(subview == _ABI46_0_0ReactSubview, @"Cannot remove view other than modal view");
  // Superclass (category) removes the `subview` from actual `superview`.
  [super removeABI46_0_0ReactSubview:subview];
  [_touchHandler detachFromView:subview];
  _ABI46_0_0ReactSubview = nil;
}

- (void)didUpdateABI46_0_0ReactSubviews
{
  // Do nothing, as subview (singular) is managed by `insertABI46_0_0ReactSubview:atIndex:`
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
  if (!self.userInteractionEnabled && ![self.superview.ABI46_0_0ReactSubviews containsObject:self]) {
    return;
  }

  [self ensurePresentedOnlyIfNeeded];
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  [self ensurePresentedOnlyIfNeeded];
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

- (void)setVisible:(BOOL)visible
{
  if (_visible != visible) {
    _visible = visible;
    [self ensurePresentedOnlyIfNeeded];
  }
}

- (void)ensurePresentedOnlyIfNeeded
{
  BOOL shouldBePresented = !_isPresented && _visible && self.window;
  if (shouldBePresented) {
    ABI46_0_0RCTAssert(self.ABI46_0_0ReactViewController, @"Can't present modal view controller without a presenting view controller");

    _modalViewController.supportedInterfaceOrientations = [self supportedOrientationsMask];

    if ([self.animationType isEqualToString:@"fade"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
    } else if ([self.animationType isEqualToString:@"slide"]) {
      _modalViewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    }
    if (self.presentationStyle != UIModalPresentationNone) {
      _modalViewController.modalPresentationStyle = self.presentationStyle;
    }
    if (@available(iOS 13.0, *)) {
      _modalViewController.presentationController.delegate = self;
    }
    [_delegate presentModalHostView:self withViewController:_modalViewController animated:[self hasAnimationType]];
    _isPresented = YES;
  }

  BOOL shouldBeHidden = _isPresented && (!_visible || !self.superview);
  if (shouldBeHidden) {
    [self dismissModalViewController];
  }
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
