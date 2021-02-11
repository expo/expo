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

#import <UIKit/UIKit.h>

#ifdef BUCK

 #import <FBSDKCoreKit/FBSDKAccessToken.h>
 #import <FBSDKCoreKit/FBSDKAppEvents.h>
 #import <FBSDKCoreKit/FBSDKApplicationDelegate.h>
 #import <FBSDKCoreKit/FBSDKAuthenticationToken.h>
 #import <FBSDKCoreKit/FBSDKButton.h>
 #import <FBSDKCoreKit/FBSDKConstants.h>
 #import <FBSDKCoreKit/FBSDKCopying.h>
 #import <FBSDKCoreKit/FBSDKGraphRequest.h>
 #import <FBSDKCoreKit/FBSDKGraphRequestConnection.h>
 #import <FBSDKCoreKit/FBSDKGraphRequestDataAttachment.h>
 #import <FBSDKCoreKit/FBSDKSettings.h>
 #import <FBSDKCoreKit/FBSDKTestUsersManager.h>
 #import <FBSDKCoreKit/FBSDKUtility.h>

 #if !TARGET_OS_TV
  #import <FBSDKCoreKit/FBSDKAppLink.h>
  #import <FBSDKCoreKit/FBSDKAppLinkNavigation.h>
  #import <FBSDKCoreKit/FBSDKAppLinkResolver.h>
  #import <FBSDKCoreKit/FBSDKAppLinkResolverRequestBuilder.h>
  #import <FBSDKCoreKit/FBSDKAppLinkResolving.h>
  #import <FBSDKCoreKit/FBSDKAppLinkReturnToRefererController.h>
  #import <FBSDKCoreKit/FBSDKAppLinkReturnToRefererView.h>
  #import <FBSDKCoreKit/FBSDKAppLinkTarget.h>
  #import <FBSDKCoreKit/FBSDKAppLinkUtility.h>
  #import <FBSDKCoreKit/FBSDKGraphErrorRecoveryProcessor.h>
  #import <FBSDKCoreKit/FBSDKMeasurementEvent.h>
  #import <FBSDKCoreKit/FBSDKMutableCopying.h>
  #import <FBSDKCoreKit/FBSDKProfile.h>
  #import <FBSDKCoreKit/FBSDKProfilePictureView.h>
  #import <FBSDKCoreKit/FBSDKURL.h>
  #import <FBSDKCoreKit/FBSDKWebViewAppLinkResolver.h>
 #else
  #import <FBSDKCoreKit/FBSDKDeviceButton.h>
  #import <FBSDKCoreKit/FBSDKDeviceViewControllerBase.h>
 #endif

#else

 #import "FBSDKAccessToken.h"
 #import "FBSDKAppEvents.h"
 #import "FBSDKApplicationDelegate.h"
 #import "FBSDKAuthenticationToken.h"
 #import "FBSDKButton.h"
 #import "FBSDKConstants.h"
 #import "FBSDKCopying.h"
 #import "FBSDKGraphRequest.h"
 #import "FBSDKGraphRequestConnection.h"
 #import "FBSDKGraphRequestDataAttachment.h"
 #import "FBSDKSettings.h"
 #import "FBSDKTestUsersManager.h"
 #import "FBSDKUtility.h"

 #if !TARGET_OS_TV
  #import "FBSDKAppLink.h"
  #import "FBSDKAppLinkNavigation.h"
  #import "FBSDKAppLinkResolver.h"
  #import "FBSDKAppLinkResolverRequestBuilder.h"
  #import "FBSDKAppLinkResolving.h"
  #import "FBSDKAppLinkReturnToRefererController.h"
  #import "FBSDKAppLinkReturnToRefererView.h"
  #import "FBSDKAppLinkTarget.h"
  #import "FBSDKAppLinkUtility.h"
  #import "FBSDKGraphErrorRecoveryProcessor.h"
  #import "FBSDKMeasurementEvent.h"
  #import "FBSDKMutableCopying.h"
  #import "FBSDKProfile.h"
  #import "FBSDKProfilePictureView.h"
  #import "FBSDKURL.h"
  #import "FBSDKWebViewAppLinkResolver.h"
 #else
  #import "FBSDKDeviceButton.h"
  #import "FBSDKDeviceViewControllerBase.h"
 #endif

#endif

#define FBSDK_VERSION_STRING @"9.0.1"
#define FBSDK_TARGET_PLATFORM_VERSION @"v9.0"
