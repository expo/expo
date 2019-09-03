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

@interface FBSDKGraphErrorRecoveryProcessor()
{
  FBSDKErrorRecoveryAttempter *_recoveryAttempter;
  NSError *_error;
}

@property (nonatomic, strong, nullable) id<FBSDKGraphErrorRecoveryProcessorDelegate>delegate;

@end

@implementation FBSDKGraphErrorRecoveryProcessor

- (BOOL)processError:(NSError *)error request:(FBSDKGraphRequest *)request delegate:(id<FBSDKGraphErrorRecoveryProcessorDelegate>)delegate
{
  self.delegate = delegate;
  if ([self.delegate respondsToSelector:@selector(processorWillProcessError:error:)]) {
    if (![self.delegate processorWillProcessError:self error:error]) {
      return NO;
    }
  }

  FBSDKGraphRequestError errorCategory = [error.userInfo[FBSDKGraphRequestErrorKey] unsignedIntegerValue];
  switch (errorCategory) {
    case FBSDKGraphRequestErrorTransient :
      [self.delegate processorDidAttemptRecovery:self didRecover:YES error:nil];
      self.delegate = nil;
      return YES;
    case FBSDKGraphRequestErrorRecoverable :
      if ([request.tokenString isEqualToString:[FBSDKAccessToken currentAccessToken].tokenString]) {
        _recoveryAttempter = error.recoveryAttempter;

        // Set up a block to do the typical recovery work so that we can chain it for ios auth special cases.
        // the block returns YES if recovery UI is started (meaning we wait for the alertviewdelegate to resume control flow).
        BOOL (^standardRecoveryWork)(void) = ^BOOL{
          NSArray *recoveryOptionsTitles = error.userInfo[NSLocalizedRecoveryOptionsErrorKey];
          if (recoveryOptionsTitles.count > 0 && self->_recoveryAttempter) {
            NSString *recoverySuggestion = error.userInfo[NSLocalizedRecoverySuggestionErrorKey];
            self->_error = error;
            dispatch_async(dispatch_get_main_queue(), ^{
              [self displayAlertWithRecoverySuggestion:recoverySuggestion recoveryOptionsTitles:recoveryOptionsTitles];
            });
            return YES;
          }
          return NO;
        };

        return standardRecoveryWork();
      }
      return NO;
    case FBSDKGraphRequestErrorOther :
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

#pragma mark - UIAlertController support

- (void)displayAlertWithRecoverySuggestion:(NSString *)recoverySuggestion recoveryOptionsTitles:(NSArray<NSString *> *)recoveryOptionsTitles
{
  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:nil
                                                                           message:recoverySuggestion
                                                                    preferredStyle:UIAlertControllerStyleAlert];
  for (NSUInteger i = 0; i < recoveryOptionsTitles.count; i++) {
    NSString *title = recoveryOptionsTitles[i];
    UIAlertAction *option = [UIAlertAction actionWithTitle:title
                                                     style:UIAlertActionStyleDefault
                                                   handler:^(UIAlertAction * _Nonnull action) {
                                                     [self->_recoveryAttempter attemptRecoveryFromError:self->_error
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
}

- (void)displayAlertWithTitle:(NSString *)title message:(NSString *)message cancelButtonTitle:(NSString *)localizedOK
{
  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:nil
                                                                           message:message
                                                                    preferredStyle:UIAlertControllerStyleAlert];
  UIAlertAction *OKAction = [UIAlertAction actionWithTitle:localizedOK
                                                     style:UIAlertActionStyleCancel
                                                   handler:^(UIAlertAction * _Nonnull action) {
                                                     [self->_recoveryAttempter attemptRecoveryFromError:self->_error
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
}

#pragma mark - FBSDKErrorRecoveryAttempting "delegate"

- (void)didPresentErrorWithRecovery:(BOOL)didRecover contextInfo:(void *)contextInfo
{
  [self.delegate processorDidAttemptRecovery:self didRecover:didRecover error:_error];
  self.delegate = nil;
}

@end
