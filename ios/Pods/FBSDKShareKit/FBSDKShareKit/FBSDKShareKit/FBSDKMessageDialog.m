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

#import "FBSDKMessageDialog.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareCameraEffectContent.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareDefines.h"
#import "FBSDKShareMessengerGenericTemplateContent.h"
#import "FBSDKShareMessengerMediaTemplateContent.h"
#import "FBSDKShareMessengerOpenGraphMusicTemplateContent.h"
#import "FBSDKShareOpenGraphContent.h"
#import "FBSDKShareUtility.h"
#import "FBSDKShareVideoContent.h"

#define FBSDK_MESSAGE_DIALOG_APP_SCHEME @"fb-messenger-share-api"

@implementation FBSDKMessageDialog

#pragma mark - Class Methods

+ (void)initialize
{
  if ([FBSDKMessageDialog class] == self) {
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_MESSENGER];
    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:NULL];
  }
}

+ (instancetype)showWithContent:(id<FBSDKSharingContent>)content delegate:(id<FBSDKSharingDelegate>)delegate
{
  FBSDKMessageDialog *dialog = [[self alloc] init];
  dialog.shareContent = content;
  dialog.delegate = delegate;
  [dialog show];
  return dialog;
}

#pragma mark - Properties

@synthesize delegate = _delegate;
@synthesize shareContent = _shareContent;
@synthesize shouldFailOnDataError = _shouldFailOnDataError;

#pragma mark - Public Methods

- (BOOL)canShow
{
  return [self _canShowNative];
}

- (BOOL)show
{
  NSError *error;
  if (!self.canShow) {
    error = [NSError fbErrorWithDomain:FBSDKShareErrorDomain
                                  code:FBSDKShareErrorDialogNotAvailable
                               message:@"Message dialog is not available."];
    [self _invokeDelegateDidFailWithError:error];
    return NO;
  }
  if (![self validateWithError:&error]) {
    [self _invokeDelegateDidFailWithError:error];
    return NO;
  }

  id<FBSDKSharingContent> shareContent = self.shareContent;
  NSDictionary *parameters = [FBSDKShareUtility parametersForShareContent:shareContent
                                                            bridgeOptions:FBSDKShareBridgeOptionsDefault
                                                    shouldFailOnDataError:self.shouldFailOnDataError];
  NSString *methodName = ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]] ?
                          FBSDK_SHARE_OPEN_GRAPH_METHOD_NAME :
                          FBSDK_SHARE_METHOD_NAME);
  FBSDKBridgeAPIRequest *request;
  request = [FBSDKBridgeAPIRequest bridgeAPIRequestWithProtocolType:FBSDKBridgeAPIProtocolTypeNative
                                                             scheme:FBSDK_MESSAGE_DIALOG_APP_SCHEME
                                                         methodName:methodName
                                                      methodVersion:nil
                                                         parameters:parameters
                                                           userInfo:nil];
  FBSDKServerConfiguration *configuration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  BOOL useSafariViewController = [configuration useSafariViewControllerForDialogName:FBSDKDialogConfigurationNameMessage];
  FBSDKBridgeAPICallbackBlock completionBlock = ^(FBSDKBridgeAPIResponse *response) {
    [self _handleCompletionWithDialogResults:response.responseParameters response:response];
    [FBSDKInternalUtility unregisterTransientObject:self];
  };
  [[FBSDKApplicationDelegate sharedInstance] openBridgeAPIRequest:request
                                          useSafariViewController:useSafariViewController
                                               fromViewController:nil
                                                  completionBlock:completionBlock];

  [self _logDialogShow];
  [FBSDKInternalUtility registerTransientObject:self];
  return YES;
}

- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef
{
  if (self.shareContent) {
    if ([self.shareContent isKindOfClass:[FBSDKShareLinkContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKShareMessengerGenericTemplateContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKShareMessengerMediaTemplateContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKShareMessengerOpenGraphMusicTemplateContent class]]) {
    } else {
      if (errorRef != NULL) {
        NSString *message = [NSString stringWithFormat:@"Message dialog does not support %@.",
                                                       NSStringFromClass(self.shareContent.class)];
        *errorRef = [NSError fbRequiredArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                          name:@"shareContent"
                                                       message:message];
      }
      return NO;
    }
  }
  return [FBSDKShareUtility validateShareContent:self.shareContent
                                   bridgeOptions:FBSDKShareBridgeOptionsDefault
                                           error:errorRef];
}

#pragma mark - Helper Methods

- (BOOL)_canShowNative
{
  FBSDKServerConfiguration *configuration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  BOOL useNativeDialog = [configuration useNativeDialogForDialogName:FBSDKDialogConfigurationNameMessage];
  return (useNativeDialog && [FBSDKInternalUtility isMessengerAppInstalled]);
}

- (void)_handleCompletionWithDialogResults:(NSDictionary *)results response:(FBSDKBridgeAPIResponse *)response
{
  NSString *completionGesture = results[FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY];
  if ([completionGesture isEqualToString:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_CANCEL] ||
      response.isCancelled) {
    [self _invokeDelegateDidCancel];
  } else if (response.error) {
    [self _invokeDelegateDidFailWithError:response.error];
  } else {
    [self _invokeDelegateDidCompleteWithResults:results];
  }
}

- (void)_invokeDelegateDidCancel
{
  NSDictionary * parameters =@{
                               FBSDKAppEventParameterDialogOutcome : FBSDKAppEventsDialogOutcomeValue_Cancelled,
                               };

  [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKEventMessengerShareDialogResult
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];

  if (!_delegate) {
    return;
  }

  [_delegate sharerDidCancel:self];
}

- (void)_invokeDelegateDidCompleteWithResults:(NSDictionary *)results
{
  NSDictionary * parameters =@{
                               FBSDKAppEventParameterDialogOutcome : FBSDKAppEventsDialogOutcomeValue_Completed,
                               };

  [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKEventMessengerShareDialogResult
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];

  if (!_delegate) {
    return;
  }

  [_delegate sharer:self didCompleteWithResults:[results copy]];
}

- (void)_invokeDelegateDidFailWithError:(NSError *)error
{
  NSMutableDictionary * parameters = [NSMutableDictionary dictionaryWithObjectsAndKeys:FBSDKAppEventsDialogOutcomeValue_Failed, FBSDKAppEventParameterDialogOutcome, nil];
  if (error) {
    parameters[FBSDKAppEventParameterDialogErrorMessage] = [NSString stringWithFormat:@"%@", error];
  }

  [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKEventMessengerShareDialogResult
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];

  if (!_delegate) {
    return;
  }

  [_delegate sharer:self didFailWithError:error];
}

- (void)_logDialogShow
{
  NSString *contentType;
  if([self.shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeOpenGraph;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeStatus;
  } else if ([self.shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypePhoto;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeVideo;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareMessengerGenericTemplateContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeMessengerGenericTemplate;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareMessengerMediaTemplateContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeMessengerMediaTemplate;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareMessengerOpenGraphMusicTemplateContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeMessengerOpenGraphMusicTemplate;
  } else {
    contentType = FBSDKAppEventsDialogShareContentTypeUnknown;
  }

  NSDictionary *parameters = @{FBSDKAppEventParameterDialogShareContentType : contentType,
                               FBSDKAppEventParameterDialogShareContentUUID : self.shareContent.shareUUID ?: [NSNull null],
                               FBSDKAppEventParameterDialogShareContentPageID : self.shareContent.pageID ?: [NSNull null]};

  [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKEventMessengerShareDialogShow
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];
}

@end
