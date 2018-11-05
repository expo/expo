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

#import <FBSDKCoreKit/FBSDKCoreKit.h>

#if !TARGET_OS_TV
#import "AppEvents/Codeless/FBSDKViewHierarchy.h"
#import "AppEvents/Codeless/FBSDKCodelessMacros.h"
#import "BridgeAPI/FBSDKBridgeAPIProtocol.h"
#import "BridgeAPI/FBSDKBridgeAPIProtocolType.h"
#import "BridgeAPI/FBSDKBridgeAPIRequest.h"
#import "BridgeAPI/FBSDKBridgeAPIResponse.h"
#import "BridgeAPI/FBSDKURLOpening.h"
#import "Cryptography/FBSDKCrypto.h"
#import "FBSDKAudioResourceLoader.h"
#import "FBSDKContainerViewController.h"
#import "FBSDKMonotonicTime.h"
#import "FBSDKSystemAccountStoreAdapter.h"
#import "FBSDKTriStateBOOL.h"
#import "UI/FBSDKCloseIcon.h"
#import "UI/FBSDKColor.h"
#import "UI/FBSDKMaleSilhouetteIcon.h"
#import "UI/FBSDKUIUtility.h"
#import "UI/FBSDKViewImpressionTracker.h"
#import "WebDialog/FBSDKWebDialog.h"
#else
#import "Device/FBSDKDeviceButton+Internal.h"
#import "Device/FBSDKDeviceDialogView.h"
#import "Device/FBSDKSmartDeviceDialogView.h"
#import "Device/FBSDKDeviceViewControllerBase+Internal.h"
#import "Device/FBSDKModalFormPresentationController.h"
#endif

#import "AppEvents/FBSDKAppEvents+Internal.h"
#import "AppEvents/FBSDKAppEventsState.h"
#import "AppEvents/FBSDKAppEventsStateManager.h"
#import "AppEvents/FBSDKAppEventsUtility.h"
#import "AppEvents/FBSDKTimeSpentData.h"
#import "Base64/FBSDKBase64.h"
#import "ErrorRecovery/FBSDKErrorRecoveryAttempter.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKApplicationDelegate+Internal.h"
#import "FBSDKDeviceRequestsHelper.h"
#import "FBSDKError.h"
#import "FBSDKImageDownloader.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKMath.h"
#import "FBSDKSettings+Internal.h"
#import "FBSDKSwizzler.h"
#import "FBSDKTypeUtility.h"
#import "Network/FBSDKGraphRequest+Internal.h"
#import "Network/FBSDKGraphRequestConnection+Internal.h"
#import "Network/FBSDKGraphRequestMetadata.h"
#import "ServerConfiguration/FBSDKDialogConfiguration.h"
#import "ServerConfiguration/FBSDKServerConfiguration+Internal.h"
#import "ServerConfiguration/FBSDKServerConfiguration.h"
#import "ServerConfiguration/FBSDKServerConfigurationManager+Internal.h"
#import "ServerConfiguration/FBSDKServerConfigurationManager.h"
#import "TokenCaching/FBSDKAccessTokenCache.h"
#import "TokenCaching/FBSDKAccessTokenCaching.h"
#import "TokenCaching/FBSDKKeychainStore.h"
#import "TokenCaching/FBSDKKeychainStoreViaBundleID.h"
#import "UI/FBSDKButton+Subclass.h"
#import "UI/FBSDKIcon.h"
#import "UI/FBSDKLogo.h"

