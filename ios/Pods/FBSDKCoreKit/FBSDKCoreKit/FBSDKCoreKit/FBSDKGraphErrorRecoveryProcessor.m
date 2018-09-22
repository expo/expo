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
#import "FBSDKGraphErrorRecoveryProcessor.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKErrorRecoveryAttempter.h"

@interface FBSDKGraphErrorRecoveryProcessor()<UIAlertViewDelegate>
{
  FBSDKErrorRecoveryAttempter *_recoveryAttempter;
  NSError *_error;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  UIAlertView *_alertView;
#pragma clang diagnostic pop
}

@property (nonatomic, strong, readwrite) id<FBSDKGraphErrorRecoveryProcessorDelegate>delegate;

@end

@implementation FBSDKGraphErrorRecoveryProcessor

- (void)dealloc
{
  if (_alertView) {
    _alertView.delegate = nil;
  }
}

- (BOOL)processError:(NSError *)error request:(FBSDKGraphRequest *)request delegate:(id<FBSDKGraphErrorRecoveryProcessorDelegate>) delegate
{
  self.delegate = delegate;
  if ([self.delegate respondsToSelector:@selector(processorWillProcessError:error:)]) {
    if (![self.delegate processorWillProcessError:self error:error]) {
      return NO;
    }
  }

  FBSDKGraphRequestErrorCategory errorCategory = [error.userInfo[FBSDKGraphRequestErrorCategoryKey] unsignedIntegerValue];
  switch (errorCategory) {
    case FBSDKGraphRequestErrorCategoryTransient :
      [self.delegate processorDidAttemptRecovery:self didRecover:YES error:nil];
      self.delegate = nil;
      return YES;
    case FBSDKGraphRequestErrorCategoryRecoverable :
      if ([request.tokenString isEqualToString:[FBSDKAccessToken currentAccessToken].tokenString]) {
        _recoveryAttempter = error.recoveryAttempter;
        BOOL isLoginRecoveryAttempter = [_recoveryAttempter isKindOfClass:NSClassFromString(@"_FBSDKLoginRecoveryAttempter")];

        // Set up a block to do the typical recovery work so that we can chain it for ios auth special cases.
        // the block returns YES if recovery UI is started (meaning we wait for the alertviewdelegate to resume control flow).
        BOOL (^standardRecoveryWork)(void) = ^BOOL{
          NSArray *recoveryOptionsTitles = error.userInfo[NSLocalizedRecoveryOptionsErrorKey];
          if (recoveryOptionsTitles.count > 0 && _recoveryAttempter) {
            NSString *recoverySuggestion = error.userInfo[NSLocalizedRecoverySuggestionErrorKey];
            _error = error;
            dispatch_async(dispatch_get_main_queue(), ^{
              [self displayAlertWithRecoverySuggestion:recoverySuggestion recoveryOptionsTitles:recoveryOptionsTitles];
            });
            return YES;
          }
          return NO;
        };

        if ([request.tokenString isEqualToString:[[FBSDKSystemAccountStoreAdapter sharedInstance] accessTokenString]] &&
            isLoginRecoveryAttempter) {
          // special system auth case: if user has granted permissions we can simply renew. On a successful
          // renew, treat this as immediately recovered without the standard alert prompty.
          // (for example, this can repair expired tokens seamlessly)
          [[FBSDKSystemAccountStoreAdapter sharedInstance]
           renewSystemAuthorization:^(ACAccountCredentialRenewResult result, NSError *renewError) {
             dispatch_async(dispatch_get_main_queue(), ^{
               if (result == ACAccountCredentialRenewResultRenewed) {
                 [self.delegate processorDidAttemptRecovery:self didRecover:YES error:nil];
                 self.delegate = nil;
               } else if (!standardRecoveryWork()) {
                 [self.delegate processorDidAttemptRecovery:self didRecover:NO error:_error];
               };
             });
           }];
          // short-circuit YES so that the renew callback resumes the control flow.
          return YES;
        }

        return standardRecoveryWork();
      }
      return NO;
    case FBSDKGraphRequestErrorCategoryOther :
      if ([request.tokenString isEqualToString:[FBSDKAccessToken currentAccessToken].tokenString]) {
        NSString *message = error.userInfo[FBSDKErrorLocalizedDescriptionKey];
        NSString *title = error.userInfo[FBSDKErrorLocalizedTitleKey];
        if (message) {
          dispatch_async(dispatch_get_main_queue(), ^{
            NSString *localizedOK =
            NSLocalizedStringWithDefaultValue(@"ErrorRecovery.Alert.OK", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                              @"OK",
                                              @"The title of the label to dismiss the alert when presenting user facing error messages");
            [self displayAlertWithTitle:title message:message cancelButtonTitle:localizedOK];
          });
        }
      }
      return NO;
  }
  return NO;
}

#pragma mark - UIAlertView and UIAlertController support

- (void)displayAlertWithRecoverySuggestion:(NSString *)recoverySuggestion recoveryOptionsTitles:(NSArray<NSString *> *)recoveryOptionsTitles
{
  if ([UIAlertController class]) {
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:nil
                                                                             message:recoverySuggestion
                                                                      preferredStyle:UIAlertControllerStyleAlert];
    for (NSUInteger i = 0; i < recoveryOptionsTitles.count; i++) {
      NSString *title = recoveryOptionsTitles[i];
      UIAlertAction *option = [UIAlertAction actionWithTitle:title
                                                       style:UIAlertActionStyleDefault
                                                     handler:^(UIAlertAction * _Nonnull action) {
                                                       [_recoveryAttempter attemptRecoveryFromError:_error
                                                                                        optionIndex:i
                                                                                           delegate:self
                                                                                 didRecoverSelector:@selector(didPresentErrorWithRecovery:contextInfo:)
                                                                                        contextInfo:nil];
                                                     }];
      [alertController addAction:option];
    }
    UIViewController *topMostViewController = [FBSDKInternalUtility topMostViewController];
    [topMostViewController presentViewController:alertController
                                        animated:YES
                                      completion:nil];
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    _alertView = [[UIAlertView alloc] initWithTitle:nil
                                            message:recoverySuggestion
                                           delegate:self
                                  cancelButtonTitle:nil
                                  otherButtonTitles:nil];
#pragma clang diagnostic pop
    for (NSString *option in recoveryOptionsTitles) {
      [_alertView addButtonWithTitle:option];
    }
    [_alertView show];
  }
}

- (void)displayAlertWithTitle:(NSString *)title message:(NSString *)message cancelButtonTitle:(NSString *)localizedOK
{
  if ([UIAlertController class]) {
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:nil
                                                                             message:message
                                                                      preferredStyle:UIAlertControllerStyleAlert];
    UIAlertAction *OKAction = [UIAlertAction actionWithTitle:localizedOK
                                                       style:UIAlertActionStyleCancel
                                                     handler:^(UIAlertAction * _Nonnull action) {
                                                       [_recoveryAttempter attemptRecoveryFromError:_error
                                                                                        optionIndex:0
                                                                                           delegate:self
                                                                                 didRecoverSelector:@selector(didPresentErrorWithRecovery:contextInfo:)
                                                                                        contextInfo:nil];
                                                     }];
    [alertController addAction:OKAction];
    UIViewController *topMostViewController = [FBSDKInternalUtility topMostViewController];
    [topMostViewController presentViewController:alertController
                                        animated:YES
                                      completion:nil];
  } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[[UIAlertView alloc] initWithTitle:title
                                message:message
                               delegate:nil
                      cancelButtonTitle:localizedOK
                      otherButtonTitles:nil] show];
#pragma clang diagnostic pop
  }
}

#pragma mark - UIAlertViewDelegate

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)alertView:(UIAlertView *)alertView didDismissWithButtonIndex:(NSInteger)buttonIndex
{
  [_recoveryAttempter attemptRecoveryFromError:_error optionIndex:buttonIndex delegate:self didRecoverSelector:@selector(didPresentErrorWithRecovery:contextInfo:) contextInfo:nil];
  if (_alertView) {
    _alertView.delegate = nil;
    _alertView = nil;
  }
}
#pragma clang diagnostic pop

#pragma mark - FBSDKErrorRecoveryAttempting "delegate"

- (void)didPresentErrorWithRecovery:(BOOL)didRecover contextInfo:(void *)contextInfo
{
  [self.delegate processorDidAttemptRecovery:self didRecover:didRecover error:_error];
  self.delegate = nil;
}

@end
