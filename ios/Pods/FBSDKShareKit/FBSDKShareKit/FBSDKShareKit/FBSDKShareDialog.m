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

#import "FBSDKShareDialog.h"

#import <Social/Social.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareCameraEffectContent.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareDefines.h"
#import "FBSDKShareError.h"
#import "FBSDKShareLinkContent.h"
#import "FBSDKShareMediaContent.h"
#import "FBSDKShareOpenGraphAction.h"
#import "FBSDKShareOpenGraphContent.h"
#import "FBSDKShareOpenGraphObject.h"
#import "FBSDKSharePhoto.h"
#import "FBSDKSharePhotoContent.h"
#import "FBSDKShareUtility.h"
#import "FBSDKShareVideo.h"
#import "FBSDKShareVideoContent.h"

#define FBSDK_SHARE_FEED_METHOD_NAME @"feed"
#define FBSDK_SHARE_METHOD_CAMERA_MIN_VERSION @"20170417"
#define FBSDK_SHARE_METHOD_MIN_VERSION @"20130410"
#define FBSDK_SHARE_METHOD_OG_MIN_VERSION @"20130214"
#define FBSDK_SHARE_METHOD_OG_IMAGE_MIN_VERSION @"20130410"
#define FBSDK_SHARE_METHOD_PHOTOS_MIN_VERSION @"20140116"
#define FBSDK_SHARE_METHOD_VIDEO_MIN_VERSION @"20150313"
#define FBSDK_SHARE_METHOD_ATTRIBUTED_SHARE_SHEET_MIN_VERSION @"20150629"
#define FBSDK_SHARE_METHOD_QUOTE_MIN_VERSION @"20160328"
#define FBSDK_SHARE_METHOD_MMP_MIN_VERSION @"20160328"

FBSDK_STATIC_INLINE void FBSDKShareDialogValidateAPISchemeRegisteredForCanOpenUrl()
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_FBAPI];
  });
}

FBSDK_STATIC_INLINE void FBSDKShareDialogValidateShareExtensionSchemeRegisteredForCanOpenUrl()
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_SHARE_EXTENSION];
  });
}


@interface FBSDKShareDialog () <FBSDKWebDialogDelegate>
@end

@implementation FBSDKShareDialog
{
  FBSDKWebDialog *_webDialog;
}

#pragma mark - Class Methods

+ (void)initialize
{
  if ([FBSDKShareDialog class] == self) {
    [FBSDKInternalUtility checkRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_FACEBOOK];
    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:NULL];
  }
}

+ (instancetype)showFromViewController:(UIViewController *)viewController
                           withContent:(id<FBSDKSharingContent>)content
                              delegate:(id<FBSDKSharingDelegate>)delegate
{
  FBSDKShareDialog *dialog = [[self alloc] init];
  dialog.fromViewController = viewController;
  dialog.shareContent = content;
  dialog.delegate = delegate;
  [dialog show];
  return dialog;
}

#pragma mark - Object Lifecycle

- (void)dealloc
{
  _webDialog.delegate = nil;
}

#pragma mark - Properties

@synthesize delegate = _delegate;
@synthesize shareContent = _shareContent;
@synthesize shouldFailOnDataError = _shouldFailOnDataError;

#pragma mark - Public Methods

- (BOOL)canShow
{
  if (self.shareContent) {
    // Validate this content
    NSError *error = nil;
    return [self _validateWithError:&error];
  } else {
    // Launch an empty dialog for sharing a status message.
    switch (self.mode) {
      case FBSDKShareDialogModeAutomatic:
      case FBSDKShareDialogModeBrowser:
      case FBSDKShareDialogModeFeedBrowser:
      case FBSDKShareDialogModeFeedWeb:
      case FBSDKShareDialogModeWeb:{
        return YES;
      }
      case FBSDKShareDialogModeNative:{
        return [self _canShowNative];
      }
      case FBSDKShareDialogModeShareSheet:{
        return [self _canShowShareSheet];
      }
    }
  }
}

- (BOOL)show
{
  BOOL didShow = NO;
  NSError *error = nil;

  if ([self _validateWithError:&error]) {
    switch (self.mode) {
      case FBSDKShareDialogModeAutomatic:{
        didShow = [self _showAutomatic:&error];
        break;
      }
      case FBSDKShareDialogModeBrowser:{
        didShow = [self _showBrowser:&error];
        break;
      }
      case FBSDKShareDialogModeFeedBrowser:{
        didShow = [self _showFeedBrowser:&error];
        break;
      }
      case FBSDKShareDialogModeFeedWeb:{
        didShow = [self _showFeedWeb:&error];
        break;
      }
      case FBSDKShareDialogModeNative:{
        didShow = [self _showNativeWithCanShowError:&error validationError:&error];
        break;
      }
      case FBSDKShareDialogModeShareSheet:{
        didShow = [self _showShareSheetWithCanShowError:&error validationError:&error];
        break;
      }
      case FBSDKShareDialogModeWeb:{
        didShow = [self _showWeb:&error];
        break;
      }
    }
  }
  if (!didShow) {
    [self _invokeDelegateDidFailWithError:error];
  } else {
    [self _logDialogShow];
    [FBSDKInternalUtility registerTransientObject:self];
  }
  return didShow;
}

- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef
{
  return [self _validateWithError:errorRef] && [self _validateFullyCompatibleWithError:errorRef];
}

#pragma mark - FBSDKWebDialogDelegate

- (void)webDialog:(FBSDKWebDialog *)webDialog didCompleteWithResults:(NSDictionary *)results
{
  if (_webDialog != webDialog) {
    return;
  }
  [self _cleanUpWebDialog];
  NSInteger errorCode = [results[@"error_code"] integerValue];
  if (errorCode == 4201) {
    [self _invokeDelegateDidCancel];
  } else if (errorCode != 0) {
    NSError *error = [FBSDKShareError errorWithCode:FBSDKShareUnknownErrorCode
                                           userInfo:@{
                                                      FBSDKGraphRequestErrorGraphErrorCode : @(errorCode)
                                                      }
                                            message:results[@"error_message"]
                                    underlyingError:nil];
    [self _handleWebResponseParameters:nil error:error cancelled: NO];
  } else {
    // not all web dialogs report cancellation, so assume that the share has completed with no additional information
    [self _handleWebResponseParameters:results error:nil cancelled: NO];
  }
  [FBSDKInternalUtility unregisterTransientObject:self];
}

- (void)webDialog:(FBSDKWebDialog *)webDialog didFailWithError:(NSError *)error
{
  if (_webDialog != webDialog) {
    return;
  }
  [self _cleanUpWebDialog];
  [self _invokeDelegateDidFailWithError:error];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

- (void)webDialogDidCancel:(FBSDKWebDialog *)webDialog
{
  if (_webDialog != webDialog) {
    return;
  }
  [self _cleanUpWebDialog];
  [self _invokeDelegateDidCancel];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

#pragma mark - Helper Methods

-(BOOL)_isDefaultToShareSheet
{
  if ([self.shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    return NO;
  }
  FBSDKServerConfiguration *configuration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  return [configuration.defaultShareMode isEqualToString:@"share_sheet"];
}

- (BOOL)_isOpenGraphURLShare:(FBSDKShareOpenGraphContent *)shareContent
{
  __block BOOL hasOGURL = NO;
  [shareContent.action enumerateKeysAndObjectsUsingBlock:^(NSString *key, id object, BOOL *stop) {
    if ([object isKindOfClass:[NSURL class]]) {
      hasOGURL = YES;
    }
  }];
  return hasOGURL;
}

-(BOOL)_showAutomatic:(NSError *__autoreleasing *)errorRef
{
  BOOL isDefaultToShareSheet = [self _isDefaultToShareSheet];
  BOOL useNativeDialog = [self _useNativeDialog];
  return ((isDefaultToShareSheet && [self _showShareSheetWithCanShowError:NULL validationError:errorRef]) ||
          (useNativeDialog && [self _showNativeWithCanShowError:NULL validationError:errorRef]) ||
          (!isDefaultToShareSheet && [self _showShareSheetWithCanShowError:NULL validationError:errorRef]) ||
          [self _showFeedBrowser:errorRef] ||
          [self _showFeedWeb:errorRef] ||
          [self _showBrowser:errorRef] ||
          [self _showWeb:errorRef] ||
          (!useNativeDialog && [self _showNativeWithCanShowError:NULL validationError:errorRef]));
}

- (void)_loadNativeMethodName:(NSString **)methodNameRef methodVersion:(NSString **)methodVersionRef
{
  if (methodNameRef != NULL) {
    *methodNameRef = nil;
  }
  if (methodVersionRef != NULL) {
    *methodVersionRef = nil;
  }

  id<FBSDKSharingContent> shareContent = self.shareContent;
  if (!shareContent) {
    return;
  }

  // if there is shareContent on the receiver already, we can check the minimum app version, otherwise we can only check
  // for an app that can handle the native share dialog
  NSString *methodName = nil;
  NSString *methodVersion = nil;
  if ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    methodName = FBSDK_SHARE_OPEN_GRAPH_METHOD_NAME;
    BOOL containsMedia = NO;
    [FBSDKShareUtility testShareContent:shareContent containsMedia:&containsMedia containsPhotos:NULL containsVideos:NULL];
    if (containsMedia) {
      methodVersion = FBSDK_SHARE_METHOD_OG_IMAGE_MIN_VERSION;
    } else {
      methodVersion = FBSDK_SHARE_METHOD_OG_MIN_VERSION;
    }
  } else if ([shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    methodName = FBSDK_SHARE_CAMERA_METHOD_NAME;
    methodVersion = FBSDK_SHARE_METHOD_CAMERA_MIN_VERSION;
  } else {
    methodName = FBSDK_SHARE_METHOD_NAME;
    if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
      methodVersion = FBSDK_SHARE_METHOD_PHOTOS_MIN_VERSION;
    } else if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
      methodVersion = FBSDK_SHARE_METHOD_VIDEO_MIN_VERSION;
    } else {
      methodVersion = FBSDK_SHARE_METHOD_MIN_VERSION;
    }
  }
  if (methodNameRef != NULL) {
    *methodNameRef = methodName;
  }
  if (methodVersionRef != NULL) {
    *methodVersionRef = methodVersion;
  }
}

- (BOOL)_canShowNative
{
  return [FBSDKInternalUtility isFacebookAppInstalled];
}

- (BOOL)_canShowShareSheet
{
  if (![FBSDKInternalUtility isFacebookAppInstalled]) {
    return NO;
  }

  Class composeViewControllerClass = [fbsdkdfl_SLComposeViewControllerClass() class];
  if (!composeViewControllerClass) {
    return NO;
  }
  // iOS 11 returns NO for `isAvailableForServiceType` but it will still work
  NSString *facebookServiceType = fbsdkdfl_SLServiceTypeFacebook();
  NSOperatingSystemVersion iOS11Version = { .majorVersion = 11, .minorVersion = 0, .patchVersion = 0 };
  if (![FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS11Version] && ![composeViewControllerClass isAvailableForServiceType:facebookServiceType]) {
    return NO;
  }
  return YES;
}

- (BOOL)_canAttributeThroughShareSheet
{
  NSOperatingSystemVersion iOS8Version = { .majorVersion = 8, .minorVersion = 0, .patchVersion = 0 };
  if (![FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS8Version]) {
    return NO;
  }
  FBSDKShareDialogValidateAPISchemeRegisteredForCanOpenUrl();
  NSString *scheme = FBSDK_CANOPENURL_FBAPI;
  NSString *minimumVersion = FBSDK_SHARE_METHOD_ATTRIBUTED_SHARE_SHEET_MIN_VERSION;
  NSURLComponents *components = [[NSURLComponents alloc] init];
  components.scheme = [scheme stringByAppendingString:minimumVersion];
  components.path = @"/";
  return ([[UIApplication sharedApplication] canOpenURL:components.URL] ||
          [self _canUseFBShareSheet]);
}

- (BOOL)_canUseFBShareSheet
{
  NSOperatingSystemVersion iOS8Version = { .majorVersion = 8, .minorVersion = 0, .patchVersion = 0 };
  if (![FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS8Version]) {
    return NO;
  }
  FBSDKShareDialogValidateShareExtensionSchemeRegisteredForCanOpenUrl();
  NSURLComponents *components = [[NSURLComponents alloc] init];
  components.scheme = FBSDK_CANOPENURL_SHARE_EXTENSION;
  components.path = @"/";
  return [[UIApplication sharedApplication] canOpenURL:components.URL];
}

- (BOOL)_canUseQuoteInShareSheet
{
  return [self _canUseFBShareSheet] && [self _supportsShareSheetMinimumVersion:FBSDK_SHARE_METHOD_QUOTE_MIN_VERSION];
}

- (BOOL)_canUseMMPInShareSheet
{
  return [self _canUseFBShareSheet] && [self _supportsShareSheetMinimumVersion:FBSDK_SHARE_METHOD_MMP_MIN_VERSION];
}

- (BOOL)_supportsShareSheetMinimumVersion:(NSString *)minimumVersion
{
  NSOperatingSystemVersion iOS8Version = { .majorVersion = 8, .minorVersion = 0, .patchVersion = 0 };
  if (![FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS8Version]) {
    return NO;
  }
  FBSDKShareDialogValidateAPISchemeRegisteredForCanOpenUrl();
  NSString *scheme = FBSDK_CANOPENURL_FBAPI;
  NSURLComponents *components = [[NSURLComponents alloc] init];
  components.scheme = [scheme stringByAppendingString:minimumVersion];
  components.path = @"/";
  return [[UIApplication sharedApplication] canOpenURL:components.URL];
}

- (void)_cleanUpWebDialog
{
  _webDialog.delegate = nil;
  _webDialog = nil;
}

- (NSArray *)_contentImages
{
  NSMutableArray *ret = [NSMutableArray new];
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    [ret addObjectsFromArray:[((FBSDKSharePhotoContent *)shareContent).photos valueForKeyPath:@"@distinctUnionOfObjects.image"]];
  } else if ([shareContent isKindOfClass:[FBSDKShareMediaContent class]]) {
    for (id media in ((FBSDKShareMediaContent *)shareContent).media) {
      if ([media isKindOfClass:[FBSDKSharePhoto class]]) {
        UIImage *image = ((FBSDKSharePhoto *)media).image;
        if (image != nil) {
          [ret addObject:image];
        }
      }
    }
  }
  return [ret copy];
}

- (NSArray *)_contentVideoURLs
{
  NSMutableArray *ret = [NSMutableArray new];
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    NSURL *videoURL = ((FBSDKShareVideoContent *)shareContent).video.videoURL;
    if (videoURL != nil) {
      [ret addObject:videoURL];
    }
  } else if ([shareContent isKindOfClass:[FBSDKShareMediaContent class]]) {
    for (id media in ((FBSDKShareMediaContent *)shareContent).media) {
      if ([media isKindOfClass:[FBSDKShareVideo class]]) {
        NSURL *videoURL = ((FBSDKShareVideo *)media).videoURL;
        if (videoURL != nil) {
          [ret addObject:videoURL];
        }
      }
    }
  }
  return [ret copy];
}

- (NSArray *)_contentURLs
{
  NSArray *URLs = nil;
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    FBSDKShareLinkContent *linkContent = (FBSDKShareLinkContent *)shareContent;
    URLs = (linkContent.contentURL ? @[linkContent.contentURL] : nil);
  } else if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    FBSDKSharePhotoContent *photoContent = (FBSDKSharePhotoContent *)shareContent;
    URLs = (photoContent.contentURL ? @[photoContent.contentURL] : nil);
  }
  return URLs;
}

- (void)_handleWebResponseParameters:(NSDictionary *)webResponseParameters
                               error:(NSError *)error
                           cancelled:(BOOL)isCancelled
{
  if (error) {
    [self _invokeDelegateDidFailWithError:error];
    return;
  } else {
    NSString *completionGesture = webResponseParameters[FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY];
    if ([completionGesture isEqualToString:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_CANCEL] || isCancelled) {
      [self _invokeDelegateDidCancel];
    } else {
      // not all web dialogs report cancellation, so assume that the share has completed with no additional information
      NSMutableDictionary *results = [[NSMutableDictionary alloc] init];
      // the web response comes back with a different payload, so we need to translate it
      [FBSDKInternalUtility dictionary:results
                             setObject:webResponseParameters[FBSDK_SHARE_WEB_PARAM_POST_ID_KEY]
                                forKey:FBSDK_SHARE_RESULT_POST_ID_KEY];
      [self _invokeDelegateDidCompleteWithResults:results];
    }
  }
}

- (BOOL)_photoContentHasAtLeastOneImage:(FBSDKSharePhotoContent *)photoContent
{
  for (FBSDKSharePhoto *photo in photoContent.photos) {
    if (photo.image != nil) {
      return YES;
    }
  }
  return NO;
}

- (BOOL)_showBrowser:(NSError **)errorRef
{
  if (![self _validateShareContentForBrowserWithOptions:FBSDKShareBridgeOptionsDefault error:errorRef]) {
    return NO;
  }
  id<FBSDKSharingContent> shareContent = self.shareContent;
  NSString *methodName;
  NSDictionary *parameters;

  if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]] && [self _photoContentHasAtLeastOneImage:(FBSDKSharePhotoContent *)shareContent]) {
    void(^completion)(BOOL, NSString *, NSDictionary *) = ^(BOOL successfullyBuilt, NSString *cMethodName, NSDictionary *cParameters) {
      if (successfullyBuilt) {
        FBSDKBridgeAPICallbackBlock completionBlock = ^(FBSDKBridgeAPIResponse *response) {
          [self _handleWebResponseParameters:response.responseParameters error:response.error cancelled: response.isCancelled];
          [FBSDKInternalUtility unregisterTransientObject:self];
        };
        FBSDKBridgeAPIRequest *request;
        request = [FBSDKBridgeAPIRequest bridgeAPIRequestWithProtocolType:FBSDKBridgeAPIProtocolTypeWeb
                                                                   scheme:FBSDK_SHARE_WEB_SCHEME
                                                               methodName:cMethodName
                                                            methodVersion:nil
                                                               parameters:cParameters
                                                                 userInfo:nil];
        [[FBSDKApplicationDelegate sharedInstance] openBridgeAPIRequest:request
                                                useSafariViewController:[self _useSafariViewController]
                                                     fromViewController:self.fromViewController
                                                        completionBlock:completionBlock];
      }
    };

    [FBSDKShareUtility buildAsyncWebPhotoContent:shareContent
                               completionHandler:completion];
  } else {
    if (![FBSDKShareUtility buildWebShareContent:shareContent
                                      methodName:&methodName
                                      parameters:&parameters
                                           error:errorRef]) {
      return NO;
    }
    FBSDKBridgeAPICallbackBlock completionBlock = ^(FBSDKBridgeAPIResponse *response) {
      [self _handleWebResponseParameters:response.responseParameters error:response.error cancelled: response.isCancelled];
      [FBSDKInternalUtility unregisterTransientObject:self];
    };
    FBSDKBridgeAPIRequest *request;
    request = [FBSDKBridgeAPIRequest bridgeAPIRequestWithProtocolType:FBSDKBridgeAPIProtocolTypeWeb
                                                               scheme:FBSDK_SHARE_WEB_SCHEME
                                                           methodName:methodName
                                                        methodVersion:nil
                                                           parameters:parameters
                                                             userInfo:nil];
    [[FBSDKApplicationDelegate sharedInstance] openBridgeAPIRequest:request
                                            useSafariViewController:[self _useSafariViewController]
                                                 fromViewController:self.fromViewController
                                                    completionBlock:completionBlock];
  }
  return YES;
}

- (BOOL)_showFeedBrowser:(NSError **)errorRef
{
  if (![self _validateShareContentForFeed:errorRef]) {
    return NO;
  }
  id<FBSDKSharingContent> shareContent = self.shareContent;
  NSDictionary *parameters = [FBSDKShareUtility feedShareDictionaryForContent:shareContent];
  FBSDKBridgeAPICallbackBlock completionBlock = ^(FBSDKBridgeAPIResponse *response) {
    [self _handleWebResponseParameters:response.responseParameters error:response.error cancelled:response.isCancelled];
    [FBSDKInternalUtility unregisterTransientObject:self];
  };
  FBSDKBridgeAPIRequest *request;
  request = [FBSDKBridgeAPIRequest bridgeAPIRequestWithProtocolType:FBSDKBridgeAPIProtocolTypeWeb
                                                             scheme:FBSDK_SHARE_WEB_SCHEME
                                                         methodName:FBSDK_SHARE_FEED_METHOD_NAME
                                                      methodVersion:nil
                                                         parameters:parameters
                                                           userInfo:nil];
  [[FBSDKApplicationDelegate sharedInstance] openBridgeAPIRequest:request
                                          useSafariViewController:[self _useSafariViewController]
                                               fromViewController:self.fromViewController
                                                  completionBlock:completionBlock];
  return YES;
}

- (BOOL)_showFeedWeb:(NSError **)errorRef
{
  if (![self _validateShareContentForFeed:errorRef]) {
    return NO;
  }
  id<FBSDKSharingContent> shareContent = self.shareContent;
  NSDictionary *parameters = [FBSDKShareUtility feedShareDictionaryForContent:shareContent];
  _webDialog = [FBSDKWebDialog showWithName:FBSDK_SHARE_FEED_METHOD_NAME
                                 parameters:parameters
                                   delegate:self];
  return YES;
}

- (BOOL)_showNativeWithCanShowError:(NSError **)canShowErrorRef validationError:(NSError **)validationErrorRef
{
  if (![self _canShowNative]) {
    if (canShowErrorRef != NULL) {
      *canShowErrorRef = [FBSDKShareError errorWithCode:FBSDKShareDialogNotAvailableErrorCode
                                                message:@"Native share dialog is not available."];
    }
    return NO;
  }
  if (![self _validateShareContentForNative:validationErrorRef]) {
    return NO;
  }
  NSString *scheme = nil;
  if ([self.shareContent respondsToSelector:@selector(schemeForMode:)]) {
    scheme = [(id<FBSDKSharingScheme>)self.shareContent schemeForMode:FBSDKShareDialogModeNative];
  }
  if (!(scheme.length > 0)) {
    scheme = FBSDK_CANOPENURL_FACEBOOK;
  }
  NSString *methodName;
  NSString *methodVersion;
  [self _loadNativeMethodName:&methodName methodVersion:&methodVersion];
  NSDictionary *parameters = [FBSDKShareUtility parametersForShareContent:self.shareContent
                                                            bridgeOptions:FBSDKShareBridgeOptionsDefault
                                                    shouldFailOnDataError:self.shouldFailOnDataError];
  FBSDKBridgeAPIRequest *request;
  request = [FBSDKBridgeAPIRequest bridgeAPIRequestWithProtocolType:FBSDKBridgeAPIProtocolTypeNative
                                                             scheme:scheme
                                                         methodName:methodName
                                                      methodVersion:methodVersion
                                                         parameters:parameters
                                                           userInfo:nil];
  FBSDKBridgeAPICallbackBlock completionBlock = ^(FBSDKBridgeAPIResponse *response) {
    if (response.error.code == FBSDKAppVersionUnsupportedErrorCode) {
      NSError *fallbackError;
      if ([self _showShareSheetWithCanShowError:NULL validationError:&fallbackError] ||
          [self _showFeedBrowser:&fallbackError]) {
        return;
      }
    }
    NSDictionary *responseParameters = response.responseParameters;
    NSString *completionGesture = responseParameters[FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY];
    if ([completionGesture isEqualToString:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_CANCEL] ||
        response.isCancelled) {
      [self _invokeDelegateDidCancel];
    } else if (response.error) {
      [self _invokeDelegateDidFailWithError:response.error];
    } else {
      NSMutableDictionary *results = [[NSMutableDictionary alloc] init];
      [FBSDKInternalUtility dictionary:results
                             setObject:responseParameters[FBSDK_SHARE_RESULT_POST_ID_KEY]
                                forKey:FBSDK_SHARE_RESULT_POST_ID_KEY];
      [self _invokeDelegateDidCompleteWithResults:results];
    }
    [FBSDKInternalUtility unregisterTransientObject:self];
  };
  [[FBSDKApplicationDelegate sharedInstance] openBridgeAPIRequest:request
                                          useSafariViewController:[self _useSafariViewController]
                                               fromViewController:self.fromViewController
                                                  completionBlock:completionBlock];
  return YES;
}

- (BOOL)_showShareSheetWithCanShowError:(NSError **)canShowErrorRef validationError:(NSError **)validationErrorRef
{
  if (![self _canShowShareSheet]) {
    if (canShowErrorRef != NULL) {
      *canShowErrorRef = [FBSDKShareError errorWithCode:FBSDKShareDialogNotAvailableErrorCode
                                                message:@"Share sheet is not available."];
    }
    return NO;
  }
  if (![self _validateShareContentForShareSheet:validationErrorRef]) {
    return NO;
  }
  UIViewController *fromViewController = self.fromViewController;
  if (!fromViewController) {
    if (validationErrorRef != NULL) {
      *validationErrorRef = [FBSDKShareError requiredArgumentErrorWithName:@"fromViewController" message:nil];
    }
    return NO;
  }
  NSArray *images = [self _contentImages];
  NSArray *URLs = [self _contentURLs];
  NSArray *videoURLs = [self _contentVideoURLs];

  Class composeViewControllerClass = [fbsdkdfl_SLComposeViewControllerClass() class];
  NSString *facebookServiceType = fbsdkdfl_SLServiceTypeFacebook();
  SLComposeViewController *composeViewController;
  composeViewController = [composeViewControllerClass composeViewControllerForServiceType:facebookServiceType];

  if (!composeViewController) {
    if (canShowErrorRef != NULL) {
      *canShowErrorRef = [FBSDKShareError errorWithCode:FBSDKShareDialogNotAvailableErrorCode
                                                message:@"Error creating SLComposeViewController."];
    }
    return NO;
  }

  NSString *initialText = [self _calculateInitialText];
  if (initialText.length > 0) {
    [composeViewController setInitialText:initialText];
  }

  for (UIImage *image in images) {
    [composeViewController addImage:image];
  }
  for (NSURL *URL in URLs) {
    [composeViewController addURL:URL];
  }
  for (NSURL *videoURL in videoURLs) {
    [composeViewController addURL:videoURL];
  }
  composeViewController.completionHandler = ^(SLComposeViewControllerResult result) {
    switch (result) {
      case SLComposeViewControllerResultCancelled:{
        [self _invokeDelegateDidCancel];
        break;
      }
      case SLComposeViewControllerResultDone:{
        [self _invokeDelegateDidCompleteWithResults:@{}];
        break;
      }
    }
    dispatch_async(dispatch_get_main_queue(), ^{
      [FBSDKInternalUtility unregisterTransientObject:self];
    });
  };
  [fromViewController presentViewController:composeViewController animated:YES completion:nil];
  return YES;
}

- (BOOL)_showWeb:(NSError **)errorRef
{
  if (![self _validateShareContentForBrowserWithOptions:FBSDKShareBridgeOptionsPhotoImageURL error:errorRef]) {
    return NO;
  }
  id<FBSDKSharingContent> shareContent = self.shareContent;
  NSString *methodName;
  NSDictionary *parameters;
  if (![FBSDKShareUtility buildWebShareContent:shareContent
                                    methodName:&methodName
                                    parameters:&parameters
                                         error:errorRef]) {
    return NO;
  }
  _webDialog = [FBSDKWebDialog showWithName:methodName
                                 parameters:parameters
                                   delegate:self];
  return YES;
}

- (BOOL)_useNativeDialog
{
  if ([self.shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    return YES;
  }
  FBSDKServerConfiguration *configuration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  return [configuration useNativeDialogForDialogName:FBSDKDialogConfigurationNameShare];
}

- (BOOL)_useSafariViewController
{
  if ([self.shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    return NO;
  }
  FBSDKServerConfiguration *configuration = [FBSDKServerConfigurationManager cachedServerConfiguration];
  return [configuration useSafariViewControllerForDialogName:FBSDKDialogConfigurationNameShare];
}

- (BOOL)_validateWithError:(NSError *__autoreleasing *)errorRef
{
  if (errorRef != NULL) {
    *errorRef = nil;
  }

  if (self.shareContent) {
    if ([self.shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKShareLinkContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKShareMediaContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKSharePhotoContent class]] ||
        [self.shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    } else {
      if (errorRef != NULL) {
        NSString *message = [NSString stringWithFormat:@"Share dialog does not support %@.",
                             NSStringFromClass(self.shareContent.class)];
        *errorRef = [FBSDKShareError requiredArgumentErrorWithName:@"shareContent"
                                                           message:message];
      }
      return NO;
    }
  }

  if (![FBSDKShareUtility validateShareContent:self.shareContent
                                 bridgeOptions:FBSDKShareBridgeOptionsDefault
                                         error:errorRef]) {
    return NO;
  }

  switch (self.mode) {
    case FBSDKShareDialogModeAutomatic:{
      return (
              ([self _canShowNative] && [self _validateShareContentForNative:errorRef]) ||
              ([self _canShowShareSheet] && [self _validateShareContentForShareSheet:errorRef]) ||
              [self _validateShareContentForFeed:errorRef] ||
              [self _validateShareContentForBrowserWithOptions:FBSDKShareBridgeOptionsDefault error:errorRef]);
    }
    case FBSDKShareDialogModeNative:{
      return [self _validateShareContentForNative:errorRef];
    }
    case FBSDKShareDialogModeShareSheet:{
      return [self _validateShareContentForShareSheet:errorRef];
    }
    case FBSDKShareDialogModeBrowser:{
      return [self _validateShareContentForBrowserWithOptions:FBSDKShareBridgeOptionsDefault error:errorRef];
    }
    case FBSDKShareDialogModeWeb:{
      return [self _validateShareContentForBrowserWithOptions:FBSDKShareBridgeOptionsPhotoImageURL error:errorRef];
    }
    case FBSDKShareDialogModeFeedBrowser:
    case FBSDKShareDialogModeFeedWeb:{
      return [self _validateShareContentForFeed:errorRef];
    }
  }
  if (errorRef != NULL) {
    *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"FBSDKShareDialogMode"
                                                        value:@(self.mode)
                                                      message:nil];
  }
  return NO;
}

/**
 `validateWithError:` can be used by clients of this API to discover if certain features are
 available for a specific `mode`. However, these features could be optional for said `mode`, in which
 case `validateWithError:` should return NO but when calling `show`, the dialog must still show.

 ie: Quotes are only available if FB for iOS v52 or higher is installed. If the client adds a quote to
 the `ShareLinkContent` object and FB for iOS v52 or higher is not installed, `validateWithError:` will
 return NO if the `mode` is set to ShareSheet. However, calling `show` will actually show the shareSheet
 without the Quote.

 This method exists to enable the behavior described above and should only be called from `validateWithError:`.
 */
- (BOOL)_validateFullyCompatibleWithError:(NSError *__autoreleasing *)errorRef
{
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    FBSDKShareLinkContent *shareLinkContent = (FBSDKShareLinkContent *)shareContent;
    if (shareLinkContent.quote.length > 0 &&
        self.mode == FBSDKShareDialogModeShareSheet &&
        ![self _canUseQuoteInShareSheet]) {
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareLinkContent
                                                          message:@"Quotes are only supported if Facebook for iOS version 52 and above is installed"];
      }
      return NO;
    }
  }
  return YES;
}

- (BOOL)_validateShareContentForBrowserWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    // The parameter 'href' or 'media' is required
    FBSDKShareLinkContent *const linkContent = shareContent;
    if (!linkContent.contentURL) {
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareContent
                                                          message:@"FBSDKShareLinkContent contentURL is required."];
      }
      return NO;
    }
  }
  if ([shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    if ((errorRef != NULL) && !*errorRef) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                          value:shareContent
                                                        message:@"Camera Content must be shared in `Native` mode."];
    }
    return NO;
  }
  BOOL containsMedia;
  BOOL containsPhotos;
  BOOL containsVideos;
  [FBSDKShareUtility testShareContent:shareContent containsMedia:&containsMedia containsPhotos:&containsPhotos containsVideos:&containsVideos];
  if (containsPhotos) {
    if ([FBSDKAccessToken currentAccessToken] == nil) {
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareContent
                                                          message:@"The web share dialog needs a valid access token to stage photos."];
      }
      return NO;
    }
    if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
      if (![shareContent validateWithOptions:bridgeOptions error:errorRef]) {
        return NO;
      }
    } else {
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareContent
                                                          message:@"Web share dialogs cannot include photos."];
      }
      return NO;
    }
  }
  if (containsVideos) {
    if ([FBSDKAccessToken currentAccessToken] == nil) {
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareContent
                                                          message:@"The web share dialog needs a valid access token to stage videos."];
      }
      return NO;
    }
    if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
      if (![shareContent validateWithOptions:bridgeOptions error:errorRef]) {
        return NO;
      }
    }
  }
  if (containsMedia) {
    if (bridgeOptions & FBSDKShareBridgeOptionsPhotoImageURL) { // a web-based URL is required
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareContent
                                                          message:@"Web share dialogs cannot include local media."];
      }
      return NO;
    }
  }
  return YES;
}

- (BOOL)_validateShareContentForFeed:(NSError **)errorRef
{
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    // The parameter 'href' or 'media' is required
    FBSDKShareLinkContent *const linkContent = shareContent;
    if (!linkContent.contentURL) {
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareContent
                                                          message:@"FBSDKShareLinkContent contentURL is required."];
      }
      return NO;
    }
  } else {
    if ((errorRef != NULL) && !*errorRef) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                          value:shareContent
                                                        message:@"Feed share dialogs support FBSDKShareLinkContent."];
    }
    return NO;
  }
  return YES;
}

- (BOOL)_validateShareContentForNative:(NSError **)errorRef
{
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if ([shareContent isKindOfClass:[FBSDKShareMediaContent class]]) {
    if ([FBSDKShareUtility shareMediaContentContainsPhotosAndVideos:(FBSDKShareMediaContent *)shareContent]) {
      if ((errorRef != NULL) && !*errorRef) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                            value:shareContent
                                                          message:@"Multimedia Content is only available for mode `ShareSheet`"];
      }
      return NO;
    }
  }
  if (![shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    return YES;
  }
  return [(FBSDKShareVideoContent *)shareContent validateWithOptions:FBSDKShareBridgeOptionsDefault
                                                               error:errorRef];
}

- (BOOL)_validateShareContentForShareSheet:(NSError **)errorRef
{
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if (shareContent) {
    if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
      if ([self _contentImages].count != 0) {
        return YES;
      } else {
        if ((errorRef != NULL) && !*errorRef) {
          NSString *message = @"Share photo content must have UIImage photos in order to share with the share sheet";
          *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent" value:shareContent message:message];
        }
        return NO;
      }
    } else if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
      return ([self _canUseFBShareSheet] &&
              [(FBSDKShareVideoContent *)shareContent validateWithOptions:FBSDKShareBridgeOptionsDefault error:errorRef]);
    } else if ([shareContent isKindOfClass:[FBSDKShareMediaContent class]]) {
      return ([self _canUseFBShareSheet] &&
              [self _validateShareMediaContentAvailability:shareContent error:errorRef] &&
              [(FBSDKShareMediaContent *)shareContent validateWithOptions:FBSDKShareBridgeOptionsDefault error:errorRef]);
    } else if ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
      FBSDKShareOpenGraphContent *ogContent = (FBSDKShareOpenGraphContent *)shareContent;
      BOOL isOGURLShare = [self _isOpenGraphURLShare:ogContent];

      BOOL isValidOGShare = (isOGURLShare &&
                             [ogContent.action.actionType length] != 0 &&
                             [ogContent.previewPropertyName length] != 0);
      if (!isValidOGShare) {
        if ((errorRef != NULL) && !*errorRef) {
          NSString *message = @"Share content must include an URL in the action, an action type, and a preview property name in order to share with the share sheet.";
          *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent" value:shareContent message:message];
        }
      }
      return isValidOGShare;
    } else if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
      return YES;
    } else {
      if ((errorRef != NULL) && !*errorRef) {
        NSString *message = [NSString stringWithFormat:@"Share sheet does not support %@.",
                             NSStringFromClass(shareContent.class)];
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent" value:shareContent message:message];
      }
      return NO;
    }
  }
  return YES;
}

- (BOOL)_validateShareMediaContentAvailability:(FBSDKShareMediaContent *)shareContent error:(NSError **)errorRef
{
  if ([FBSDKShareUtility shareMediaContentContainsPhotosAndVideos:shareContent] &&
      self.mode == FBSDKShareDialogModeShareSheet &&
      ![self _canUseMMPInShareSheet]) {
    if ((errorRef != NULL) && !*errorRef) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent"
                                                          value:shareContent
                                                        message:@"Multimedia content (photos + videos) is only supported if Facebook for iOS version 52 and above is installed"];
    }
    return NO;
  }
  return YES;
}

- (void)_invokeDelegateDidCancel
{
  NSDictionary * parameters = @{
                               FBSDKAppEventParameterDialogOutcome : FBSDKAppEventsDialogOutcomeValue_Cancelled,
                               };

  [FBSDKAppEvents logImplicitEvent:FBSDLAppEventNameFBSDKEventShareDialogResult
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];

  [_delegate sharerDidCancel:self];
}

- (void)_invokeDelegateDidCompleteWithResults:(NSDictionary *)results
{
  NSDictionary * parameters = @{
                               FBSDKAppEventParameterDialogOutcome : FBSDKAppEventsDialogOutcomeValue_Completed
                               };

  [FBSDKAppEvents logImplicitEvent:FBSDLAppEventNameFBSDKEventShareDialogResult
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];

  [_delegate sharer:self didCompleteWithResults:[results copy]];
}

- (void)_invokeDelegateDidFailWithError:(NSError *)error
{
  NSDictionary * parameters = @{
                               FBSDKAppEventParameterDialogOutcome : FBSDKAppEventsDialogOutcomeValue_Failed,
                               FBSDKAppEventParameterDialogErrorMessage : [NSString stringWithFormat:@"%@", error]
                               };

  [FBSDKAppEvents logImplicitEvent:FBSDLAppEventNameFBSDKEventShareDialogResult
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];

  [_delegate sharer:self didFailWithError:error];
}

- (void)_logDialogShow
{
  NSString *shareMode = NSStringFromFBSDKShareDialogMode(self.mode);

  NSString *contentType;
  if([self.shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeOpenGraph;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeStatus;
  } else if ([self.shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypePhoto;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeVideo;
  } else if ([self.shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    contentType = FBSDKAppEventsDialogShareContentTypeCamera;
  } else {
    contentType = FBSDKAppEventsDialogShareContentTypeUnknown;
  }

  NSDictionary *parameters = @{
                               FBSDKAppEventParameterDialogMode : shareMode,
                               FBSDKAppEventParameterDialogShareContentType : contentType,

                               };

  [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKEventShareDialogShow
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];
}

- (NSString *)_calculateInitialText
{
  NSString *initialText;
  if ([self _canAttributeThroughShareSheet]) {
    NSMutableDictionary *initialTextDictionary = [NSMutableDictionary new];
    initialTextDictionary[@"app_id"] = [FBSDKSettings appID];
    NSString *hashtag = [FBSDKShareUtility hashtagStringFromHashtag:self.shareContent.hashtag];
    if (hashtag != nil) {
      initialTextDictionary[@"hashtags"] = @[hashtag];
    }
    if ([self.shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
      NSString *quote = [(FBSDKShareLinkContent *)self.shareContent quote];
      if (quote != nil) {
        initialTextDictionary[@"quotes"] = @[quote];
      }
    }
    if ([self.shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
      NSDictionary *ogData = [FBSDKShareUtility parametersForShareContent:self.shareContent
                                                            bridgeOptions:FBSDKShareBridgeOptionsDefault
                                                    shouldFailOnDataError:self.shouldFailOnDataError];
      initialTextDictionary[@"og_data"] = ogData;
    }

    NSError *error = nil;
    NSString *jsonString = [FBSDKInternalUtility JSONStringForObject:initialTextDictionary error:&error invalidObjectHandler:NULL];
    if (error != nil) {
      return nil;
    }

    NSString *JSONStartDelimiter = @"|";
    initialText = [NSString stringWithFormat:@"%@%@%@",
                   [self _calculatePreJSONInitialTextWithHashtag:hashtag],
                   JSONStartDelimiter,
                   jsonString];
  } else {
    NSString *hashtag = [FBSDKShareUtility hashtagStringFromHashtag:self.shareContent.hashtag];
    if (hashtag != nil) {
      initialText = hashtag;
    }
  }
  return initialText;
}

// Not all versions of the Share Extension support JSON. Adding this text before allows backward compatibility
- (NSString *)_calculatePreJSONInitialTextWithHashtag:(NSString *)hashtag
{
  NSMutableString *text = [NSMutableString new];
  [text appendString:[NSString stringWithFormat:@"fb-app-id:%@", [FBSDKSettings appID]]];
  if (hashtag != nil) {
    [text appendString:@" "];
    [text appendString:hashtag];
  }
  return [text copy];
}

@end
