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

#import <FBSDKCoreKit/FBSDKAppEvents.h>
#import <FBSDKCoreKit/FBSDKMacros.h>

#import "FBSDKAppEventsUtility.h"

@class FBSDKGraphRequest;

// Internally known event names

FBSDK_EXTERN NSString *const FBSDKAppEventNamePurchased;

/** Use to log that the share dialog was launched */
FBSDK_EXTERN NSString *const FBSDKAppEventNameShareSheetLaunch;

/** Use to log that the share dialog was dismissed */
FBSDK_EXTERN NSString *const FBSDKAppEventNameShareSheetDismiss;

/** Use to log that the permissions UI was launched */
FBSDK_EXTERN NSString *const FBSDKAppEventNamePermissionsUILaunch;

/** Use to log that the permissions UI was dismissed */
FBSDK_EXTERN NSString *const FBSDKAppEventNamePermissionsUIDismiss;

/** Use to log that the login view was used */
FBSDK_EXTERN NSString *const FBSDKAppEventNameLoginViewUsage;

/*! Use to log that the share tray launched. */
FBSDK_EXTERN NSString *const FBSDKAppEventNameShareTrayDidLaunch;

/*! Use to log that the person selected a sharing target. */
FBSDK_EXTERN NSString *const FBSDKAppEventNameShareTrayDidSelectActivity;

// Internally known event parameters

/** String parameter specifying the outcome of a dialog invocation */
FBSDK_EXTERN NSString *const FBSDKAppEventParameterDialogOutcome;

/** Parameter key used to specify which application launches this application. */
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLaunchSource;

/** Use to log the result of a call to FBDialogs presentShareDialogWithParams: */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsPresentShareDialog;

/** Use to log the result of a call to FBDialogs presentShareDialogWithOpenGraphActionParams: */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsPresentShareDialogOG;

/** Use to log the result of a call to FBDialogs presentLikeDialogWithLikeParams: */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsPresentLikeDialogOG;

FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsPresentShareDialogPhoto;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsPresentMessageDialog;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsPresentMessageDialogPhoto;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsPresentMessageDialogOG;

/** Use to log the start of an auth request that cannot be fulfilled by the token cache */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSessionAuthStart;

/** Use to log the end of an auth request that was not fulfilled by the token cache */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSessionAuthEnd;

/** Use to log the start of a specific auth method as part of an auth request */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSessionAuthMethodStart;

/** Use to log the end of the last tried auth method as part of an auth request */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSessionAuthMethodEnd;

/** Use to log the timestamp for the transition to the Facebook native login dialog */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsNativeLoginDialogStart;

/** Use to log the timestamp for the transition back to the app after the Facebook native login dialog */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsNativeLoginDialogEnd;

/** Use to log the e2e timestamp metrics for web login */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBDialogsWebLoginCompleted;

/** Use to log the result of the App Switch OS AlertView. Only available on OS >= iOS10 */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSessionFASLoginDialogResult;

/** Use to log the live streaming events from sdk */
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingStart;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingStop;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingPause;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingResume;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingError;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingUpdateStatus;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingVideoID;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingMic;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingCamera;

/** Use to log the results of a share dialog */
FBSDK_EXTERN NSString *const FBSDLAppEventNameFBSDKEventShareDialogResult;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKEventMessengerShareDialogResult;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKEventAppInviteShareDialogResult;

FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKEventShareDialogShow;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKEventMessengerShareDialogShow;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKEventAppInviteShareDialogShow;

FBSDK_EXTERN NSString *const FBSDKAppEventParameterDialogMode;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterDialogShareContentType;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterDialogShareContentUUID;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterDialogShareContentPageID;

/*! Use to log parameters for share tray use */
FBSDK_EXTERN NSString *const FBSDKAppEventParameterShareTrayActivityName;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterShareTrayResult;

/*! Use to log parameters for live streaming*/
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLiveStreamingPrevStatus;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLiveStreamingStatus;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLiveStreamingError;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLiveStreamingVideoID;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLiveStreamingMicEnabled;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLiveStreamingCameraEnabled;

// Internally known event parameter values

FBSDK_EXTERN NSString *const FBSDKAppEventsDialogOutcomeValue_Completed;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogOutcomeValue_Cancelled;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogOutcomeValue_Failed;

FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeOpenGraph;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeStatus;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypePhoto;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeVideo;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeCamera;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeMessengerGenericTemplate;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeMessengerMediaTemplate;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeMessengerOpenGraphMusicTemplate;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareContentTypeUnknown;


FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeAutomatic;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeBrowser;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeNative;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeShareSheet;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeWeb;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeFeedBrowser;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeFeedWeb;
FBSDK_EXTERN NSString *const FBSDKAppEventsDialogShareModeUnknown;

FBSDK_EXTERN NSString *const FBSDKAppEventsNativeLoginDialogStartTime;
FBSDK_EXTERN NSString *const FBSDKAppEventsNativeLoginDialogEndTime;

FBSDK_EXTERN NSString *const FBSDKAppEventsWebLoginE2E;

FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeButtonImpression;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLoginButtonImpression;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKSendButtonImpression;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKShareButtonImpression;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingButtonImpression;

FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKSmartLoginService;

FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeButtonDidTap;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLoginButtonDidTap;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKSendButtonDidTap;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKShareButtonDidTap;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLiveStreamingButtonDidTap;

FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlDidDisable;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlDidLike;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlDidPresentDialog;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlDidTap;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlDidUnlike;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlError;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlImpression;
FBSDK_EXTERN NSString *const FBSDKAppEventNameFBSDKLikeControlNetworkUnavailable;

FBSDK_EXTERN NSString *const FBSDKAppEventParameterDialogErrorMessage;
FBSDK_EXTERN NSString *const FBSDKAppEventParameterLogTime;

FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesHandlerKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesActionKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesEventKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesParamsKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackCustomKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackSingleKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackSingleCustomKey;
FBSDK_EXTERN NSString *const FBSDKAppEventsWKWebViewMessagesPixelIDKey;

@interface FBSDKAppEvents (Internal)

+ (void)logImplicitEvent:(NSString *)eventName
              valueToSum:(NSNumber *)valueToSum
              parameters:(NSDictionary *)parameters
             accessToken:(FBSDKAccessToken *)accessToken;

+ (FBSDKAppEvents *)singleton;
- (void)flushForReason:(FBSDKAppEventsFlushReason)flushReason;

@end
