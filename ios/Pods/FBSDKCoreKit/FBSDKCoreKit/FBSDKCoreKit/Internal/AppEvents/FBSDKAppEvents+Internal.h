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

#import "FBSDKAppEventsUtility.h"

@class FBSDKGraphRequest;

// Internally known event names

FOUNDATION_EXPORT NSString *const FBSDKAppEventNamePurchased;

/** Use to log that the share dialog was launched */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameShareSheetLaunch;

/** Use to log that the share dialog was dismissed */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameShareSheetDismiss;

/** Use to log that the permissions UI was launched */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNamePermissionsUILaunch;

/** Use to log that the permissions UI was dismissed */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNamePermissionsUIDismiss;

/** Use to log that the login view was used */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameLoginViewUsage;

/*! Use to log that the share tray launched. */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameShareTrayDidLaunch;

/*! Use to log that the person selected a sharing target. */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameShareTrayDidSelectActivity;

// Internally known event parameters

/** String parameter specifying the outcome of a dialog invocation */
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterDialogOutcome;

/** Parameter key used to specify which application launches this application. */
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLaunchSource;

/** Use to log the result of a call to FBDialogs presentShareDialogWithParams: */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsPresentShareDialog;

/** Use to log the result of a call to FBDialogs presentShareDialogWithOpenGraphActionParams: */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsPresentShareDialogOG;

/** Use to log the result of a call to FBDialogs presentLikeDialogWithLikeParams: */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsPresentLikeDialogOG;

FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsPresentShareDialogPhoto;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsPresentMessageDialog;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsPresentMessageDialogPhoto;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsPresentMessageDialogOG;

/** Use to log the start of an auth request that cannot be fulfilled by the token cache */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSessionAuthStart;

/** Use to log the end of an auth request that was not fulfilled by the token cache */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSessionAuthEnd;

/** Use to log the start of a specific auth method as part of an auth request */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSessionAuthMethodStart;

/** Use to log the end of the last tried auth method as part of an auth request */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSessionAuthMethodEnd;

/** Use to log the timestamp for the transition to the Facebook native login dialog */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsNativeLoginDialogStart;

/** Use to log the timestamp for the transition back to the app after the Facebook native login dialog */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsNativeLoginDialogEnd;

/** Use to log the e2e timestamp metrics for web login */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBDialogsWebLoginCompleted;

/** Use to log the result of the App Switch OS AlertView. Only available on OS >= iOS10 */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSessionFASLoginDialogResult;

/** Use to log the live streaming events from sdk */
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingStart;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingStop;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingPause;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingResume;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingError;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingUpdateStatus;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingVideoID;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingMic;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingCamera;

/** Use to log the results of a share dialog */
FOUNDATION_EXPORT NSString *const FBSDLAppEventNameFBSDKEventShareDialogResult;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKEventMessengerShareDialogResult;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKEventAppInviteShareDialogResult;

FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKEventShareDialogShow;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKEventMessengerShareDialogShow;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKEventAppInviteShareDialogShow;

FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterDialogMode;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterDialogShareContentType;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterDialogShareContentUUID;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterDialogShareContentPageID;

/*! Use to log parameters for share tray use */
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterShareTrayActivityName;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterShareTrayResult;

/*! Use to log parameters for live streaming*/
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLiveStreamingPrevStatus;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLiveStreamingStatus;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLiveStreamingError;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLiveStreamingVideoID;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLiveStreamingMicEnabled;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLiveStreamingCameraEnabled;

// Internally known event parameter values

FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogOutcomeValue_Completed;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogOutcomeValue_Cancelled;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogOutcomeValue_Failed;

FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeOpenGraph;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeStatus;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypePhoto;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeVideo;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeCamera;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeMessengerGenericTemplate;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeMessengerMediaTemplate;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeMessengerOpenGraphMusicTemplate;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareContentTypeUnknown;


FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeAutomatic;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeBrowser;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeNative;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeShareSheet;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeWeb;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeFeedBrowser;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeFeedWeb;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsDialogShareModeUnknown;

FOUNDATION_EXPORT NSString *const FBSDKAppEventsNativeLoginDialogStartTime;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsNativeLoginDialogEndTime;

FOUNDATION_EXPORT NSString *const FBSDKAppEventsWebLoginE2E;

FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeButtonImpression;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLoginButtonImpression;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKSendButtonImpression;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKShareButtonImpression;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingButtonImpression;

FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKSmartLoginService;

FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeButtonDidTap;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLoginButtonDidTap;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKSendButtonDidTap;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKShareButtonDidTap;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLiveStreamingButtonDidTap;

FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlDidDisable;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlDidLike;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlDidPresentDialog;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlDidTap;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlDidUnlike;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlError;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlImpression;
FOUNDATION_EXPORT NSString *const FBSDKAppEventNameFBSDKLikeControlNetworkUnavailable;

FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterDialogErrorMessage;
FOUNDATION_EXPORT NSString *const FBSDKAppEventParameterLogTime;

FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesHandlerKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesActionKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesEventKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesParamsKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackCustomKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackSingleKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesPixelTrackSingleCustomKey;
FOUNDATION_EXPORT NSString *const FBSDKAppEventsWKWebViewMessagesPixelIDKey;

@interface FBSDKAppEvents (Internal)

+ (void)logImplicitEvent:(NSString *)eventName
              valueToSum:(NSNumber *)valueToSum
              parameters:(NSDictionary *)parameters
             accessToken:(FBSDKAccessToken *)accessToken;

+ (FBSDKAppEvents *)singleton;
- (void)flushForReason:(FBSDKAppEventsFlushReason)flushReason;
- (void)registerNotifications;

@end
