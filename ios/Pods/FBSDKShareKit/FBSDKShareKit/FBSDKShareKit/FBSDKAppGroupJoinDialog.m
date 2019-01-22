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

#import "FBSDKAppGroupJoinDialog.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareUtility.h"

@interface FBSDKAppGroupJoinDialog () <FBSDKWebDialogDelegate>
@end

@implementation FBSDKAppGroupJoinDialog
{
  FBSDKWebDialog *_webDialog;
}

#define FBSDK_APP_GROUP_JOIN_METHOD_NAME @"game_group_join"

#pragma mark - Class Methods

+ (instancetype)showWithGroupID:(NSString *)groupID
                       delegate:(id<FBSDKAppGroupJoinDialogDelegate>)delegate
{
  FBSDKAppGroupJoinDialog *dialog = [[self alloc] init];
  dialog.groupID = groupID;
  dialog.delegate = delegate;
  [dialog show];
  return dialog;
}

#pragma mark - Object Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {
    _webDialog = [[FBSDKWebDialog alloc] init];
    _webDialog.delegate = self;
    _webDialog.name = FBSDK_APP_GROUP_JOIN_METHOD_NAME;
  }
  return self;
}

- (void)dealloc
{
  _webDialog.delegate = nil;
}

#pragma mark - Public Methods

- (BOOL)canShow
{
  return YES;
}

- (BOOL)show
{
  NSError *error;
  if (![self canShow]) {
    error = [NSError fbErrorWithDomain:FBSDKShareErrorDomain
                                  code:FBSDKShareErrorDialogNotAvailable
                               message:@"App group join dialog is not available."];
    [_delegate appGroupJoinDialog:self didFailWithError:error];
    return NO;
  }
  if (![self validateWithError:&error]) {
    [_delegate appGroupJoinDialog:self didFailWithError:error];
    return NO;
  }

  NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
  [FBSDKInternalUtility dictionary:parameters setObject:self.groupID forKey:@"id"];

  _webDialog.parameters = parameters;
  [_webDialog show];
  [FBSDKInternalUtility registerTransientObject:self];
  return YES;
}

- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef
{
  if (!self.groupID.length) {
    if (errorRef != NULL) {
      *errorRef = [NSError fbRequiredArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                        name:@"groupID"
                                                     message:nil];
    }
    return NO;
  }
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  return YES;
}

#pragma mark - FBSDKWebDialogDelegate

- (void)webDialog:(FBSDKWebDialog *)webDialog didCompleteWithResults:(NSDictionary *)results
{
  if (_webDialog != webDialog) {
    return;
  }
  NSError *error = [NSError fbErrorWithCode:[FBSDKTypeUtility unsignedIntegerValue:results[@"error_code"]]
                                    message:[FBSDKTypeUtility stringValue:results[@"error_message"]]];
  [self _handleCompletionWithDialogResults:results error:error];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

- (void)webDialog:(FBSDKWebDialog *)webDialog didFailWithError:(NSError *)error
{
  if (_webDialog != webDialog) {
    return;
  }
  [self _handleCompletionWithDialogResults:nil error:error];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

- (void)webDialogDidCancel:(FBSDKWebDialog *)webDialog
{
  if (_webDialog != webDialog) {
    return;
  }
  [_delegate appGroupJoinDialogDidCancel:self];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

#pragma mark - Helper Methods

- (void)_handleCompletionWithDialogResults:(NSDictionary *)results error:(NSError *)error
{
  if (!_delegate) {
    return;
  }
  switch (error.code) {
    case 0:{
      [_delegate appGroupJoinDialog:self didCompleteWithResults:results];
      break;
    }
    case 4201:{
      [_delegate appGroupJoinDialogDidCancel:self];
      break;
    }
    default:{
      [_delegate appGroupJoinDialog:self didFailWithError:error];
      break;
    }
  }
  if (error) {
    return;
  } else {
  }
}

@end
