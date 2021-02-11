// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "TargetConditionals.h"

#if TARGET_OS_TV

 #import "FBSDKDeviceViewControllerBase+Internal.h"

 #import "FBSDKCoreKit+Internal.h"
 #import "FBSDKModalFormPresentationController.h"
 #import "FBSDKSmartDeviceDialogView.h"

static const NSTimeInterval kAnimationDurationTimeInterval = .5;

/*
Subclasses should generally:
- override viewDidDisappear to handle cancellations
- assign `deviceDialogView.confirmationCode` to set the code
*/
@implementation FBSDKDeviceViewControllerBase

- (instancetype)init
{
  if ((self = [super init])) {
    self.transitioningDelegate = self;
    self.modalPresentationStyle = UIModalPresentationCustom;
  }
  return self;
}

- (void)loadView
{
  CGRect frame = [UIScreen mainScreen].bounds;
  BOOL smartLoginEnabled = ([FBSDKServerConfigurationManager cachedServerConfiguration].smartLoginOptions & FBSDKServerConfigurationSmartLoginOptionsEnabled);
  FBSDKDeviceDialogView *deviceView =
  (smartLoginEnabled
    ? [[FBSDKSmartDeviceDialogView alloc] initWithFrame:frame]
    : [[FBSDKDeviceDialogView alloc] initWithFrame:frame]);
  deviceView.delegate = self;
  self.view = deviceView;
}

- (FBSDKDeviceDialogView *)deviceDialogView
{
  return (FBSDKDeviceDialogView *)self.view;
}

 #pragma mark - UIViewControllerAnimatedTransitioning

// Extract this out to another class if we have other similar transitions.
- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext
{
  return kAnimationDurationTimeInterval;
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
  if ([self isBeingPresented]) {
    UIView *presentedView = [transitionContext viewForKey:UITransitionContextToViewKey];
    // animate the view to slide in from bottom
    presentedView.center = CGPointMake(presentedView.center.x, presentedView.center.y + CGRectGetHeight(presentedView.bounds));
    UIView *containerView = [transitionContext containerView];
    [containerView addSubview:presentedView];
    [UIView animateWithDuration:kAnimationDurationTimeInterval
                          delay:0
         usingSpringWithDamping:1
          initialSpringVelocity:0
                        options:UIViewAnimationOptionCurveEaseOut
                     animations:^{
                       presentedView.center = CGPointMake(presentedView.center.x, presentedView.center.y - CGRectGetHeight(presentedView.bounds));
                     } completion:^(BOOL finished) {
                       [transitionContext completeTransition:finished];
                     }];
  } else {
    UIView *presentedView = [transitionContext viewForKey:UITransitionContextFromViewKey];
    // animate the view to slide out to the bottom
    [UIView animateWithDuration:kAnimationDurationTimeInterval
                          delay:0
         usingSpringWithDamping:1
          initialSpringVelocity:0
                        options:UIViewAnimationOptionCurveEaseIn
                     animations:^{
                       presentedView.center = CGPointMake(presentedView.center.x, presentedView.center.y + CGRectGetHeight(presentedView.bounds));
                     } completion:^(BOOL finished) {
                       [transitionContext completeTransition:finished];
                     }];
  }
}

 #pragma mark - UIViewControllerTransitioningDelegate

- (id<UIViewControllerAnimatedTransitioning>)animationControllerForDismissedController:(UIViewController *)dismissed
{
  return self;
}

- (id<UIViewControllerAnimatedTransitioning>)animationControllerForPresentedController:(UIViewController *)presented presentingController:(UIViewController *)presenting sourceController:(UIViewController *)source
{
  return self;
}

- (UIPresentationController *)presentationControllerForPresentedViewController:(UIViewController *)presented
                                                      presentingViewController:(UIViewController *)presenting
                                                          sourceViewController:(UIViewController *)source
{
  return [[FBSDKModalFormPresentationController alloc] initWithPresentedViewController:presented
                                                              presentingViewController:presenting];
}

 #pragma mark - FBSDKDeviceDialogViewDelegate

- (void)deviceDialogViewDidCancel:(FBSDKDeviceDialogView *)deviceDialogView
{
  [self dismissViewControllerAnimated:YES completion:NULL];
}

@end

#endif
