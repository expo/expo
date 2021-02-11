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

 #import "FBSDKModalFormPresentationController.h"

@implementation FBSDKModalFormPresentationController
{
  UIView *_dimmedView;
}

- (UIView *)dimmedView
{
  if (!_dimmedView) {
    _dimmedView = [[UIView alloc] initWithFrame:self.containerView.bounds];
    _dimmedView.backgroundColor = [UIColor colorWithWhite:0 alpha:.6];
  }
  return _dimmedView;
}

 #pragma mark - UIPresentationController overrides

- (void)presentationTransitionWillBegin
{
  [self.containerView addSubview:[self dimmedView]];
  [self.containerView addSubview:[self presentedView]];
  [self.presentingViewController.transitionCoordinator
   animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
     [self dimmedView].alpha = 1.0;
   } completion:NULL];
}

- (void)presentationTransitionDidEnd:(BOOL)completed
{
  if (!completed) {
    [[self dimmedView] removeFromSuperview];
  }
}

- (void)dismissalTransitionWillBegin
{
  [self.presentingViewController.transitionCoordinator
   animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
     [self dimmedView].alpha = 0;
   } completion:NULL];
}

- (void)dismissalTransitionDidEnd:(BOOL)completed
{
  if (completed) {
    [[self dimmedView] removeFromSuperview];
  }
}

// technically not necessary for tvOS yet since there's no resizing.
- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
  [coordinator animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
                 [self dimmedView].frame = self.containerView.bounds;
               } completion:NULL];
}

@end

#endif
