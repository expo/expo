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

#if SWIFT_PACKAGE
 #import "FBSDKCoreKit.h"
#else
 #import <FBSDKCoreKit/FBSDKCoreKit.h>
#endif

#if defined FBSDKCOCOAPODS
 #import <FBSDKCoreKit/FBSDKCoreKit_Basics.h>
#elif defined BUCK
 #import <FBSDKCoreKit_Basics/FBSDKCoreKit_Basics.h>
#endif

#if defined FBSDKCOCOAPODS || defined BUCK

 #import "FBSDKCoreKit+Internal.h"

 #if !TARGET_OS_TV
  #import "FBSDKAudioResourceLoader.h"
  #import "FBSDKAuthenticationStatusUtility.h"
  #import "FBSDKBridgeAPI.h"
  #import "FBSDKBridgeAPI+Internal.h"
  #import "FBSDKCloseIcon.h"
  #import "FBSDKCodelessIndexer.h"
  #import "FBSDKColor.h"
  #import "FBSDKContainerViewController.h"
  #import "FBSDKCrypto.h"
  #import "FBSDKHumanSilhouetteIcon.h"
  #import "FBSDKMetadataIndexer.h"
  #import "FBSDKMonotonicTime.h"
  #import "FBSDKSKAdNetworkReporter.h"
  #import "FBSDKSuggestedEventsIndexer.h"
  #import "FBSDKUIUtility.h"
  #import "FBSDKViewHierarchy.h"
  #import "FBSDKViewHierarchyMacros.h"
  #import "FBSDKViewImpressionTracker.h"
  #import "FBSDKWebDialog.h"
 #else
  #import "FBSDKDeviceButton+Internal.h"
  #import "FBSDKDeviceDialogView.h"
  #import "FBSDKDeviceViewControllerBase+Internal.h"
  #import "FBSDKModalFormPresentationController.h"
  #import "FBSDKSmartDeviceDialogView.h"
 #endif

 #import "FBSDKAccessToken+Internal.h"
 #import "FBSDKAppEvents+Internal.h"
 #import "FBSDKAppEventsConfiguration.h"
 #import "FBSDKAppEventsConfigurationManager.h"
 #import "FBSDKAppEventsState.h"
 #import "FBSDKAppEventsStateManager.h"
 #import "FBSDKAppEventsUtility.h"
 #import "FBSDKApplicationDelegate+Internal.h"
 #import "FBSDKApplicationObserving.h"
 #import "FBSDKAuthenticationStatusUtility.h"
 #import "FBSDKAuthenticationToken+Internal.h"
 #import "FBSDKAuthenticationTokenClaims.h"
 #import "FBSDKAuthenticationTokenFactory.h"
 #import "FBSDKAuthenticationTokenHeader.h"
 #import "FBSDKBase64.h"
 #import "FBSDKButton+Subclass.h"
 #import "FBSDKDeviceRequestsHelper.h"
 #import "FBSDKDialogConfiguration.h"
 #import "FBSDKDynamicFrameworkLoader.h"
 #import "FBSDKError.h"
 #import "FBSDKErrorRecoveryAttempter.h"
 #import "FBSDKGateKeeperManager.h"
 #import "FBSDKGraphRequest+Internal.h"
 #import "FBSDKGraphRequestBody.h"
 #import "FBSDKGraphRequestConnection+Internal.h"
 #import "FBSDKGraphRequestMetadata.h"
 #import "FBSDKGraphRequestPiggybackManager.h"
 #import "FBSDKIcon.h"
 #import "FBSDKImageDownloader.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKKeychainStore.h"
 #import "FBSDKKeychainStoreViaBundleID.h"
 #import "FBSDKLogger.h"
 #import "FBSDKLogo.h"
 #import "FBSDKMath.h"
 #import "FBSDKProfile+Internal.h"
 #import "FBSDKProfilePictureView+Internal.h"
 #import "FBSDKRestrictiveDataFilterManager.h"
 #import "FBSDKServerConfiguration.h"
 #import "FBSDKServerConfiguration+Internal.h"
 #import "FBSDKServerConfigurationManager.h"
 #import "FBSDKServerConfigurationManager+Internal.h"
 #import "FBSDKSettings+Internal.h"
 #import "FBSDKSwizzler.h"
 #import "FBSDKTimeSpentData.h"
 #import "FBSDKTokenCache.h"
 #import "FBSDKTokenCaching.h"

#else

 #if !TARGET_OS_TV
  #import "../AppEvents/Internal/AAM/FBSDKMetadataIndexer.h"
  #import "../AppEvents/Internal/Codeless/FBSDKCodelessIndexer.h"
  #import "../AppEvents/Internal/SKAdNetwork/FBSDKSKAdNetworkReporter.h"
  #import "../AppEvents/Internal/SuggestedEvents/FBSDKSuggestedEventsIndexer.h"
  #import "../AppEvents/Internal/ViewHierarchy/FBSDKViewHierarchy.h"
  #import "../AppEvents/Internal/ViewHierarchy/FBSDKViewHierarchyMacros.h"
  #import "BridgeAPI/FBSDKBridgeAPI.h"
  #import "BridgeAPI/FBSDKBridgeAPI+Internal.h"
  #import "Cryptography/FBSDKCrypto.h"
  #import "FBSDKAudioResourceLoader.h"
  #import "FBSDKAuthenticationStatusUtility.h"
  #import "FBSDKContainerViewController.h"
  #import "FBSDKMonotonicTime.h"
  #import "UI/FBSDKCloseIcon.h"
  #import "UI/FBSDKColor.h"
  #import "UI/FBSDKHumanSilhouetteIcon.h"
  #import "UI/FBSDKUIUtility.h"
  #import "UI/FBSDKViewImpressionTracker.h"
  #import "WebDialog/FBSDKWebDialog.h"
 #else
  #import "Device/FBSDKDeviceButton+Internal.h"
  #import "Device/FBSDKDeviceDialogView.h"
  #import "Device/FBSDKDeviceViewControllerBase+Internal.h"
  #import "Device/FBSDKModalFormPresentationController.h"
  #import "Device/FBSDKSmartDeviceDialogView.h"
 #endif

 #import "../../../Sources/FBSDKCoreKit_Basics/include/FBSDKCoreKit_Basics.h"
 #import "../AppEvents/Internal/FBSDKAppEvents+Internal.h"
 #import "../AppEvents/Internal/FBSDKAppEventsConfiguration.h"
 #import "../AppEvents/Internal/FBSDKAppEventsConfigurationManager.h"
 #import "../AppEvents/Internal/FBSDKAppEventsState.h"
 #import "../AppEvents/Internal/FBSDKAppEventsStateManager.h"
 #import "../AppEvents/Internal/FBSDKAppEventsUtility.h"
 #import "../AppEvents/Internal/FBSDKTimeSpentData.h"
 #import "../AppEvents/Internal/Integrity/FBSDKRestrictiveDataFilterManager.h"
 #import "Base64/FBSDKBase64.h"
 #import "ErrorRecovery/FBSDKErrorRecoveryAttempter.h"
 #import "FBSDKAccessToken+Internal.h"
 #import "FBSDKApplicationDelegate+Internal.h"
 #import "FBSDKApplicationObserving.h"
 #import "FBSDKAuthenticationToken+Internal.h"
 #import "FBSDKAuthenticationTokenClaims.h"
 #import "FBSDKAuthenticationTokenFactory.h"
 #import "FBSDKAuthenticationTokenHeader.h"
 #import "FBSDKDeviceRequestsHelper.h"
 #import "FBSDKDynamicFrameworkLoader.h"
 #import "FBSDKError.h"
 #import "FBSDKImageDownloader.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKLogger.h"
 #import "FBSDKMath.h"
 #import "FBSDKProfile+Internal.h"
 #import "FBSDKProfilePictureView+Internal.h"
 #import "FBSDKSettings+Internal.h"
 #import "FBSDKSwizzler.h"
 #import "Network/FBSDKGraphRequest+Internal.h"
 #import "Network/FBSDKGraphRequestBody.h"
 #import "Network/FBSDKGraphRequestConnection+Internal.h"
 #import "Network/FBSDKGraphRequestMetadata.h"
 #import "Network/FBSDKGraphRequestPiggybackManager.h"
 #import "ServerConfiguration/FBSDKDialogConfiguration.h"
 #import "ServerConfiguration/FBSDKGateKeeperManager.h"
 #import "ServerConfiguration/FBSDKServerConfiguration.h"
 #import "ServerConfiguration/FBSDKServerConfiguration+Internal.h"
 #import "ServerConfiguration/FBSDKServerConfigurationManager.h"
 #import "ServerConfiguration/FBSDKServerConfigurationManager+Internal.h"
 #import "TokenCaching/FBSDKKeychainStore.h"
 #import "TokenCaching/FBSDKKeychainStoreViaBundleID.h"
 #import "TokenCaching/FBSDKTokenCache.h"
 #import "TokenCaching/FBSDKTokenCaching.h"
 #import "UI/FBSDKButton+Subclass.h"
 #import "UI/FBSDKIcon.h"
 #import "UI/FBSDKLogo.h"

#endif
