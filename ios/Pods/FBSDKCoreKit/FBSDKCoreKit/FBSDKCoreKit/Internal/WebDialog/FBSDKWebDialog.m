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

#import "FBSDKWebDialog.h"

#import "FBSDKAccessToken.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"
#import "FBSDKTypeUtility.h"
#import "FBSDKWebDialogView.h"

#define FBSDK_WEB_DIALOG_SHOW_ANIMATION_DURATION 0.2
#define FBSDK_WEB_DIALOG_DISMISS_ANIMATION_DURATION 0.3

static FBSDKWebDialog *g_currentDialog = nil;

@interface FBSDKWebDialog () <FBSDKWebDialogViewDelegate>
@end

@implementation FBSDKWebDialog
{
  UIView *_backgroundView;
  FBSDKWebDialogView *_dialogView;
}

#pragma mark - Class Methods

+ (instancetype)showWithName:(NSString *)name
                  parameters:(NSDictionary *)parameters
                    delegate:(id<FBSDKWebDialogDelegate>)delegate
{
  FBSDKWebDialog *dialog = [[self alloc] init];
  dialog.name = name;
  dialog.parameters = parameters;
  dialog.delegate = delegate;
  [dialog show];
  return dialog;
}

#pragma mark - Object Lifecycle

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  _dialogView.delegate = nil;
  [_dialogView removeFromSuperview];
  [_backgroundView removeFromSuperview];
}

#pragma mark - Public Methods

- (BOOL)show
{
  if (g_currentDialog == self) {
    return NO;
  }
  [g_currentDialog _dismissAnimated:YES];

  NSError *error;
  NSURL *URL = [self _generateURL:&error];
  if (!URL) {
    [self _failWithError:error];
    return NO;
  }

  g_currentDialog = self;

  UIWindow *window = [FBSDKInternalUtility findWindow];
  if (!window) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                       formatString:@"There are no valid ViewController to present FBSDKWebDialog", nil];
    [self _failWithError:nil];
    return NO;
  }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  _dialogView = [[FBSDKWebDialogView alloc] initWithFrame:window.screen.applicationFrame];
#pragma clang diagnostic pop

  _dialogView.delegate = self;
  [_dialogView loadURL:URL];

  if (!_deferVisibility) {
    [self _showWebView];
  }

  return YES;
}

#pragma mark - FBSDKWebDialogViewDelegate

- (void)webDialogView:(FBSDKWebDialogView *)webDialogView didCompleteWithResults:(NSDictionary *)results
{
  [self _completeWithResults:results];
}

- (void)webDialogView:(FBSDKWebDialogView *)webDialogView didFailWithError:(NSError *)error
{
  [self _failWithError:error];
}

- (void)webDialogViewDidCancel:(FBSDKWebDialogView *)webDialogView
{
  [self _cancel];
}

- (void)webDialogViewDidFinishLoad:(FBSDKWebDialogView *)webDialogView
{
  if (_deferVisibility) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.05 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      if (_dialogView) {
        [self _showWebView];
      }
    });
  }
}

#pragma mark - Notifications

- (void)_addObservers
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc addObserver:self
         selector:@selector(_deviceOrientationDidChangeNotification:)
             name:UIDeviceOrientationDidChangeNotification
           object:nil];
}

- (void)_deviceOrientationDidChangeNotification:(NSNotification *)notification
{
  BOOL animated = [FBSDKTypeUtility boolValue:notification.userInfo[@"UIDeviceOrientationRotateAnimatedUserInfoKey"]];
  Class CATransactionClass = fbsdkdfl_CATransactionClass();
  CFTimeInterval animationDuration = (animated ? [CATransactionClass animationDuration] : 0.0);
  [self _updateViewsWithScale:1.0 alpha:1.0 animationDuration:animationDuration completion:^(BOOL finished) {
    if (finished) {
      [_dialogView setNeedsDisplay];
    }
  }];
}

- (void)_removeObservers
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
}

#pragma mark - Helper Methods

- (void)_cancel
{
  FBSDKWebDialog *dialog = self;
  [self _dismissAnimated:YES]; // may cause the receiver to be released
  [_delegate webDialogDidCancel:dialog];
}

- (void)_completeWithResults:(NSDictionary *)results
{
  FBSDKWebDialog *dialog = self;
  [self _dismissAnimated:YES]; // may cause the receiver to be released
  [_delegate webDialog:dialog didCompleteWithResults:results];
}

- (void)_dismissAnimated:(BOOL)animated
{
  [self _removeObservers];
  UIView *backgroundView = _backgroundView;
  _backgroundView = nil;
  FBSDKWebDialogView *dialogView = _dialogView;
  _dialogView.delegate = nil;
  _dialogView = nil;
  void(^didDismiss)(BOOL) = ^(BOOL finished){
    [backgroundView removeFromSuperview];
    [dialogView removeFromSuperview];
  };
  if (animated) {
    [UIView animateWithDuration:FBSDK_WEB_DIALOG_DISMISS_ANIMATION_DURATION animations:^{
      dialogView.alpha = 0.0;
      backgroundView.alpha = 0.0;
    } completion:didDismiss];
  } else {
    didDismiss(YES);
  }
  if (g_currentDialog == self) {
    g_currentDialog = nil;
  }
}

- (void)_failWithError:(NSError *)error
{
  // defer so that the consumer is guaranteed to have an opportunity to set the delegate before we fail
  dispatch_async(dispatch_get_main_queue(), ^{
    [self _dismissAnimated:YES];
    [_delegate webDialog:self didFailWithError:error];
  });
}

- (NSURL *)_generateURL:(NSError **)errorRef
{
  NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
  parameters[@"display"] = @"touch";
  parameters[@"sdk"] = [NSString stringWithFormat:@"ios-%@", [FBSDKSettings sdkVersion]];
  parameters[@"redirect_uri"] = @"fbconnect://success";
  [FBSDKInternalUtility dictionary:parameters setObject:[FBSDKSettings appID] forKey:@"app_id"];
  [FBSDKInternalUtility dictionary:parameters
                         setObject:[FBSDKAccessToken currentAccessToken].tokenString
                            forKey:@"access_token"];
  [parameters addEntriesFromDictionary:self.parameters];
  return [FBSDKInternalUtility facebookURLWithHostPrefix:@"m"
                                                    path:[@"/dialog/" stringByAppendingString:self.name]
                                         queryParameters:parameters
                                                   error:errorRef];
}

- (BOOL)_showWebView
{
  UIWindow *window = [FBSDKInternalUtility findWindow];
  if (!window) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                       formatString:@"There are no valid ViewController to present FBSDKWebDialog", nil];
    [self _failWithError:nil];
    return NO;
  }

  [self _addObservers];

  _backgroundView = [[UIView alloc] initWithFrame:window.bounds];
  _backgroundView.alpha = 0.0;
  _backgroundView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
  _backgroundView.backgroundColor = [UIColor colorWithWhite:0.3 alpha:0.8];
  [window addSubview:_backgroundView];

  [window addSubview:_dialogView];

  [_dialogView becomeFirstResponder]; // dismisses the keyboard if it there was another first responder with it
  [self _updateViewsWithScale:0.001 alpha:0.0 animationDuration:0.0 completion:NULL];
  [self _updateViewsWithScale:1.1 alpha:1.0 animationDuration:FBSDK_WEB_DIALOG_SHOW_ANIMATION_DURATION completion:^(BOOL finished1) {
    [self _updateViewsWithScale:0.9 alpha:1.0 animationDuration:FBSDK_WEB_DIALOG_SHOW_ANIMATION_DURATION completion:^(BOOL finished2) {
      [self _updateViewsWithScale:1.0 alpha:1.0 animationDuration:FBSDK_WEB_DIALOG_SHOW_ANIMATION_DURATION completion:NULL];
    }];
  }];
  return YES;
}

- (CGAffineTransform)_transformForOrientation
{
  // iOS 8 simply adjusts the application frame to adapt to the current orientation and deprecated the concept of
  // interface orientations
  if ([FBSDKInternalUtility shouldManuallyAdjustOrientation]) {
    switch ([UIApplication sharedApplication].statusBarOrientation) {
      case UIInterfaceOrientationLandscapeLeft:
        return CGAffineTransformMakeRotation(M_PI * 1.5);
      case UIInterfaceOrientationLandscapeRight:
        return CGAffineTransformMakeRotation(M_PI/2);
      case UIInterfaceOrientationPortraitUpsideDown:
        return CGAffineTransformMakeRotation(-M_PI);
      case UIInterfaceOrientationPortrait:
      case UIInterfaceOrientationUnknown:
        // don't adjust the orientation
        break;
    }
  }
  return CGAffineTransformIdentity;
}

- (CGRect)_applicationFrameForOrientation
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  CGRect applicationFrame = _dialogView.window.screen.applicationFrame;
#pragma clang diagnostic pop
  if ([FBSDKInternalUtility shouldManuallyAdjustOrientation]) {
    switch ([UIApplication sharedApplication].statusBarOrientation) {
      case UIInterfaceOrientationLandscapeLeft:
      case UIInterfaceOrientationLandscapeRight:
        return CGRectMake(0, 0, CGRectGetHeight(applicationFrame), CGRectGetWidth(applicationFrame));
      case UIInterfaceOrientationPortraitUpsideDown:
      case UIInterfaceOrientationPortrait:
      case UIInterfaceOrientationUnknown:
        return applicationFrame;
    }
  } else {
    return applicationFrame;
  }
}

- (void)_updateViewsWithScale:(CGFloat)scale
                        alpha:(CGFloat)alpha
            animationDuration:(CFTimeInterval)animationDuration
                   completion:(void(^)(BOOL finished))completion
{
  CGAffineTransform transform;
  CGRect applicationFrame = [self _applicationFrameForOrientation];
  if (scale == 1.0) {
    transform = _dialogView.transform;
    _dialogView.transform = CGAffineTransformIdentity;
    _dialogView.frame = applicationFrame;
    _dialogView.transform = transform;
  }
  transform = CGAffineTransformScale([self _transformForOrientation], scale, scale);
  void(^updateBlock)(void) = ^{
    _dialogView.transform = transform;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    CGRect mainFrame = _dialogView.window.screen.applicationFrame;
#pragma clang diagnostic pop
    _dialogView.center = CGPointMake(CGRectGetMidX(mainFrame),
                                     CGRectGetMidY(mainFrame));
    _backgroundView.alpha = alpha;
  };
  if (animationDuration == 0.0) {
    updateBlock();
  } else {
    [UIView animateWithDuration:animationDuration animations:updateBlock completion:completion];
  }
}

@end
