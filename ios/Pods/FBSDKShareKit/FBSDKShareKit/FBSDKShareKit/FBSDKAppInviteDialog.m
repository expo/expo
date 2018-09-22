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

#import "FBSDKAppInviteDialog.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareDefines.h"
#import "FBSDKShareError.h"
#import "FBSDKShareUtility.h"

@implementation FBSDKAppInviteDialog

#define FBSDK_APP_INVITE_METHOD_MIN_VERSION @"20140410"
#define FBSDK_APP_INVITE_METHOD_NAME @"appinvites"

+ (void)initialize
{
  if ([FBSDKAppInviteDialog class] == self) {
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_FACEBOOK];
    // ensure that we have updated the dialog configs if we haven't already
    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:NULL];
  }
}

#pragma mark - Class Methods


+ (instancetype)showWithContent:(FBSDKAppInviteContent *)content delegate:(id<FBSDKAppInviteDialogDelegate>)delegate
{
  return [self showFromViewController:nil withContent:content delegate:delegate];
}


+ (instancetype)showFromViewController:(UIViewController *)viewController
                           withContent:(FBSDKAppInviteContent *)content
                              delegate:(id<FBSDKAppInviteDialogDelegate>)delegate;
{
  return nil;
}

#pragma mark - Public Methods

- (BOOL)canShow
{
  return NO;
}

- (BOOL)show
{
  return NO;
}

- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef
{
  return [FBSDKShareUtility validateAppInviteContent:self.content error:errorRef];
}

@end
