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

#if !TARGET_OS_TV

 #import "FBSDKAppLinkReturnToRefererController.h"

 #import "FBSDKAppLink.h"
 #import "FBSDKAppLinkReturnToRefererView_Internal.h"
 #import "FBSDKURL_Internal.h"

static const CFTimeInterval kFBSDKViewAnimationDuration = 0.25f;

@implementation FBSDKAppLinkReturnToRefererController
{
  UINavigationController *_navigationController;
  FBSDKAppLinkReturnToRefererView *_view;
}

 #pragma mark - Object lifecycle

- (instancetype)init
{
  return [super init];
}

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (instancetype)initForDisplayAboveNavController:(UINavigationController *)navController
{
  self = [self init];
  if (self) {
    _navigationController = navController;

    if (_navigationController != nil) {
      NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
      [nc addObserver:self
             selector:@selector(statusBarFrameWillChange:)
                 name:UIApplicationWillChangeStatusBarFrameNotification
               object:nil];
      [nc addObserver:self
             selector:@selector(statusBarFrameDidChange:)
                 name:UIApplicationDidChangeStatusBarFrameNotification
               object:nil];
      [nc addObserver:self
             selector:@selector(orientationDidChange:)
                 name:UIDeviceOrientationDidChangeNotification
               object:nil];
    }
  }
  return self;
}

- (void)dealloc
{
  _view.delegate = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

 #pragma mark - Public API

- (FBSDKAppLinkReturnToRefererView *)view
{
  if (!_view) {
    self.view = [[FBSDKAppLinkReturnToRefererView alloc] initWithFrame:CGRectZero];
    if (_navigationController) {
      [_navigationController.view addSubview:_view];
    }
  }
  return _view;
}

- (void)setView:(FBSDKAppLinkReturnToRefererView *)view
{
  if (_view != view) {
    _view.delegate = nil;
  }

  _view = view;
  _view.delegate = self;

  if (_navigationController) {
    _view.includeStatusBarInSize = FBSDKIncludeStatusBarInSizeAlways;
  }
}

- (void)showViewForRefererAppLink:(FBSDKAppLink *)refererAppLink
{
  self.view.refererAppLink = refererAppLink;

  [_view sizeToFit];

  if (_navigationController) {
    if (!_view.closed) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [self moveNavigationBar];
      });
    }
  }
}

- (void)showViewForRefererURL:(NSURL *)url
{
  FBSDKAppLink *appLink = [FBSDKURL URLForRenderBackToReferrerBarURL:url].appLinkReferer;
  [self showViewForRefererAppLink:appLink];
}

- (void)removeFromNavController
{
  if (_navigationController) {
    [_view removeFromSuperview];
    _navigationController = nil;
  }
}

 #pragma mark - FBSDKAppLinkReturnToRefererViewDelegate

- (void)returnToRefererViewDidTapInsideCloseButton:(FBSDKAppLinkReturnToRefererView *)view
{
  [self closeViewAnimated:YES explicitlyClosed:YES];
}

- (void)returnToRefererViewDidTapInsideLink:(FBSDKAppLinkReturnToRefererView *)view
                                       link:(FBSDKAppLink *)link
{
  [self openRefererAppLink:link];
  [self closeViewAnimated:NO explicitlyClosed:NO];
}

 #pragma mark - Private

- (void)statusBarFrameWillChange:(NSNotification *)notification
{
  NSValue *rectValue = [notification.userInfo valueForKey:UIApplicationStatusBarFrameUserInfoKey];
  CGRect newFrame;
  [rectValue getValue:&newFrame];

  if (_navigationController && !_view.closed) {
    if (CGRectGetHeight(newFrame) == 40) {
      UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState;
      [UIView animateWithDuration:kFBSDKViewAnimationDuration delay:0.0 options:options animations:^{
                                                                                          self->_view.frame = CGRectMake(0.0, 0.0, CGRectGetWidth(self->_view.bounds), 0.0);
                                                                                        } completion:nil];
    }
  }
}

- (void)statusBarFrameDidChange:(NSNotification *)notification
{
  NSValue *rectValue = [notification.userInfo valueForKey:UIApplicationStatusBarFrameUserInfoKey];
  CGRect newFrame;
  [rectValue getValue:&newFrame];

  if (_navigationController && !_view.closed) {
    if (CGRectGetHeight(newFrame) == 40) {
      UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState;
      [UIView animateWithDuration:kFBSDKViewAnimationDuration delay:0.0 options:options animations:^{
                                                                                          [self->_view sizeToFit];
                                                                                          [self moveNavigationBar];
                                                                                        } completion:nil];
    }
  }
}

- (void)orientationDidChange:(NSNotificationCenter *)notification
{
  if (_navigationController && !_view.closed && CGRectGetHeight(_view.bounds) > 0) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self moveNavigationBar];
    });
  }
}

- (void)moveNavigationBar
{
  if (_view.closed || !_view.refererAppLink) {
    return;
  }

  [self updateNavigationBarY:CGRectGetHeight(_view.bounds)];
}

- (void)updateNavigationBarY:(CGFloat)y
{
  UINavigationBar *navigationBar = _navigationController.navigationBar;
  CGRect navigationBarFrame = navigationBar.frame;
  CGFloat oldContainerViewY = CGRectGetMaxY(navigationBarFrame);
  navigationBarFrame.origin.y = y;
  navigationBar.frame = navigationBarFrame;

  CGFloat dy = CGRectGetMaxY(navigationBarFrame) - oldContainerViewY;
  UIView *containerView = _navigationController.visibleViewController.view.superview;
  containerView.frame = UIEdgeInsetsInsetRect(containerView.frame, UIEdgeInsetsMake(dy, 0.0, 0.0, 0.0));
}

- (void)closeViewAnimated:(BOOL)animated
{
  [self closeViewAnimated:animated explicitlyClosed:YES];
}

- (void)closeViewAnimated:(BOOL)animated explicitlyClosed:(BOOL)explicitlyClosed
{
  void (^closer)(void) = ^{
    if (self->_navigationController) {
      [self updateNavigationBarY:self->_view.statusBarHeight];
    }

    CGRect frame = self->_view.frame;
    frame.size.height = 0.0;
    self->_view.frame = frame;
  };

  if (animated) {
    [UIView animateWithDuration:kFBSDKViewAnimationDuration animations:^{
                                                              closer();
                                                            } completion:^(BOOL finished) {
                                                              if (explicitlyClosed) {
                                                                self->_view.closed = YES;
                                                              }
                                                            }];
  } else {
    closer();
    if (explicitlyClosed) {
      self->_view.closed = YES;
    }
  }
}

- (void)openRefererAppLink:(FBSDKAppLink *)refererAppLink
{
  if (refererAppLink) {
    id<FBSDKAppLinkReturnToRefererControllerDelegate> delegate = _delegate;
    if ([delegate respondsToSelector:@selector(returnToRefererController:willNavigateToAppLink:)]) {
      [delegate returnToRefererController:self willNavigateToAppLink:refererAppLink];
    }

    NSError *error = nil;
    FBSDKAppLinkNavigationType type = [FBSDKAppLinkNavigation navigateToAppLink:refererAppLink error:&error];

    if ([delegate respondsToSelector:@selector(returnToRefererController:didNavigateToAppLink:type:)]) {
      [delegate returnToRefererController:self didNavigateToAppLink:refererAppLink type:type];
    }
  }
}

@end
 #pragma clang diagnostic pop
#endif
