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

#import <AudioToolbox/AudioToolbox.h>
#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

#import <FBSDKCoreKit/FBSDKMacros.h>

/**

  This class provides a way to load constants and methods from Apple Frameworks in a dynamic
 fashion.  It allows the SDK to be just dragged into a project without having to specify additional
 frameworks to link against.  It is an internal class and not to be used by 3rd party developers.

 As new types are needed, they should be added and strongly typed.
 */
@interface FBSDKDynamicFrameworkLoader : NSObject

#pragma mark - Security Constants

/**
  Load the kSecRandomDefault value from the Security Framework

 @return The kSecRandomDefault value or nil.
 */
+ (SecRandomRef)loadkSecRandomDefault;

/**
  Load the kSecAttrAccessible value from the Security Framework

 @return The kSecAttrAccessible value or nil.
 */
+ (CFTypeRef)loadkSecAttrAccessible;

/**
  Load the kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly value from the Security Framework

 @return The kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly value or nil.
 */
+ (CFTypeRef)loadkSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;

/**
  Load the kSecAttrAccount value from the Security Framework

 @return The kSecAttrAccount value or nil.
 */
+ (CFTypeRef)loadkSecAttrAccount;

/**
  Load the kSecAttrService value from the Security Framework

 @return The kSecAttrService value or nil.
 */
+ (CFTypeRef)loadkSecAttrService;

/**
  Load the kSecAttrGeneric value from the Security Framework

 @return The kSecAttrGeneric value or nil.
 */
+ (CFTypeRef)loadkSecAttrGeneric;

/**
  Load the kSecValueData value from the Security Framework

 @return The kSecValueData value or nil.
 */
+ (CFTypeRef)loadkSecValueData;

/**
  Load the kSecClassGenericPassword value from the Security Framework

 @return The kSecClassGenericPassword value or nil.
 */
+ (CFTypeRef)loadkSecClassGenericPassword;

/**
  Load the kSecAttrAccessGroup value from the Security Framework

 @return The kSecAttrAccessGroup value or nil.
 */
+ (CFTypeRef)loadkSecAttrAccessGroup;

/**
  Load the kSecMatchLimitOne value from the Security Framework

 @return The kSecMatchLimitOne value or nil.
 */
+ (CFTypeRef)loadkSecMatchLimitOne;

/**
  Load the kSecMatchLimit value from the Security Framework

 @return The kSecMatchLimit value or nil.
 */
+ (CFTypeRef)loadkSecMatchLimit;

/**
  Load the kSecReturnData value from the Security Framework

 @return The kSecReturnData value or nil.
 */
+ (CFTypeRef)loadkSecReturnData;

/**
  Load the kSecClass value from the Security Framework

 @return The kSecClass value or nil.
 */
+ (CFTypeRef)loadkSecClass;

@end

#pragma mark - Security APIs

// These are local wrappers around the corresponding methods in Security/SecRandom.h
FBSDK_EXTERN int fbsdkdfl_SecRandomCopyBytes(SecRandomRef rnd, size_t count, uint8_t *bytes);

// These are local wrappers around Keychain API
FBSDK_EXTERN OSStatus fbsdkdfl_SecItemUpdate(CFDictionaryRef query, CFDictionaryRef attributesToUpdate);
FBSDK_EXTERN OSStatus fbsdkdfl_SecItemAdd(CFDictionaryRef attributes, CFTypeRef *result);
FBSDK_EXTERN OSStatus fbsdkdfl_SecItemCopyMatching(CFDictionaryRef query, CFTypeRef *result);
FBSDK_EXTERN OSStatus fbsdkdfl_SecItemDelete(CFDictionaryRef query);

#pragma mark - Social Constants

FBSDK_EXTERN NSString *fbsdkdfl_SLServiceTypeFacebook(void);
FBSDK_EXTERN NSString *fbsdkdfl_SLServiceTypeTwitter(void);

#pragma mark - Social Classes

FBSDK_EXTERN Class fbsdkdfl_SLComposeViewControllerClass(void);

#pragma mark - MessageUI Classes

FBSDK_EXTERN Class fbsdkdfl_MFMailComposeViewControllerClass(void);
FBSDK_EXTERN Class fbsdkdfl_MFMessageComposeViewControllerClass(void);

#pragma mark - QuartzCore Classes

FBSDK_EXTERN Class fbsdkdfl_CATransactionClass(void);

#pragma mark - QuartzCore APIs

// These are local wrappers around the corresponding transform methods from QuartzCore.framework/CATransform3D.h
FBSDK_EXTERN CATransform3D fbsdkdfl_CATransform3DMakeScale (CGFloat sx, CGFloat sy, CGFloat sz);
FBSDK_EXTERN CATransform3D fbsdkdfl_CATransform3DMakeTranslation (CGFloat tx, CGFloat ty, CGFloat tz);
FBSDK_EXTERN CATransform3D fbsdkdfl_CATransform3DConcat (CATransform3D a, CATransform3D b);

FBSDK_EXTERN const CATransform3D fbsdkdfl_CATransform3DIdentity;

#pragma mark - AudioToolbox APIs

// These are local wrappers around the corresponding methods in AudioToolbox/AudioToolbox.h
FBSDK_EXTERN OSStatus fbsdkdfl_AudioServicesCreateSystemSoundID(CFURLRef inFileURL, SystemSoundID *outSystemSoundID);
FBSDK_EXTERN OSStatus fbsdkdfl_AudioServicesDisposeSystemSoundID(SystemSoundID inSystemSoundID);
FBSDK_EXTERN void fbsdkdfl_AudioServicesPlaySystemSound(SystemSoundID inSystemSoundID);

#pragma mark - AdSupport Classes

FBSDK_EXTERN Class fbsdkdfl_ASIdentifierManagerClass(void);

#pragma mark - SafariServices Classes

FBSDK_EXTERN Class fbsdkdfl_SFSafariViewControllerClass(void);
FBSDK_EXTERN Class fbsdkdfl_SFAuthenticationSessionClass(void);

#pragma mark - Accounts Constants

FBSDK_EXTERN NSString *fbsdkdfl_ACFacebookAppIdKey(void);
FBSDK_EXTERN NSString *fbsdkdfl_ACFacebookAudienceEveryone(void);
FBSDK_EXTERN NSString *fbsdkdfl_ACFacebookAudienceFriends(void);
FBSDK_EXTERN NSString *fbsdkdfl_ACFacebookAudienceKey(void);
FBSDK_EXTERN NSString *fbsdkdfl_ACFacebookAudienceOnlyMe(void);
FBSDK_EXTERN NSString *fbsdkdfl_ACFacebookPermissionsKey(void);

#pragma mark - Accounts Classes

FBSDK_EXTERN Class fbsdkdfl_ACAccountStoreClass(void);

#pragma mark - StoreKit classes

FBSDK_EXTERN Class fbsdkdfl_SKPaymentQueueClass(void);
FBSDK_EXTERN Class fbsdkdfl_SKProductsRequestClass(void);

#pragma mark - AssetsLibrary Classes

FBSDK_EXTERN Class fbsdkdfl_ALAssetsLibraryClass(void);

#pragma mark - CoreTelephony Classes

FBSDK_EXTERN Class fbsdkdfl_CTTelephonyNetworkInfoClass(void);

#pragma mark - CoreImage

FBSDK_EXTERN Class fbsdkdfl_CIImageClass(void);
FBSDK_EXTERN Class fbsdkdfl_CIFilterClass(void);
FBSDK_EXTERN NSString *fbsdkdfl_kCIInputImageKey(void);
FBSDK_EXTERN NSString *fbsdkdfl_kCIInputRadiusKey(void);
FBSDK_EXTERN NSString *fbsdkdfl_kCIOutputImageKey(void);

#pragma mark - Photos.framework

FBSDK_EXTERN Class fbsdkdfl_PHPhotoLibrary(void);
FBSDK_EXTERN Class fbsdkdfl_PHAssetChangeRequest(void);

#pragma mark - MobileCoreServices

FBSDK_EXTERN CFStringRef fbsdkdfl_UTTypeCopyPreferredTagWithClass(CFStringRef inUTI,
                                                                  CFStringRef inTagClass);
FBSDK_EXTERN CFStringRef fbsdkdfl_kUTTagClassMIMEType(void);
FBSDK_EXTERN CFStringRef fbsdkdfl_kUTTypeJPEG(void);
FBSDK_EXTERN CFStringRef fbsdkdfl_kUTTypePNG(void);

#pragma mark - WebKit Classes

FBSDK_EXTERN Class fbsdkdfl_WKWebViewClass(void);
FBSDK_EXTERN Class fbsdkdfl_WKUserScriptClass(void);
