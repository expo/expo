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

#import "FBSDKDynamicFrameworkLoader.h"

#import <dlfcn.h>

#import <MobileCoreServices/MobileCoreServices.h>
#import <Security/Security.h>
#import <StoreKit/StoreKit.h>

#import "FBSDKLogger.h"
#import "FBSDKSettings.h"

static NSString *const g_frameworkPathTemplate = @"/System/Library/Frameworks/%@.framework/%@";

#pragma mark - Library and Symbol Loading

struct FBSDKDFLLoadSymbolContext
{
  void *(*library)(void); // function to retrieve the library handle (it's a function instead of void * so it can be staticlly bound)
  const char *name;       // name of the symbol to retrieve
  void **address;         // [out] address of the symbol in the process address space
};

// Retrieves the handle for a library for framework. The paths for each are constructed
// differently so the loading function passed to dispatch_once() calls this.
static void *fbsdkdfl_load_library_once(const char *path)
{
  void *handle = dlopen(path, RTLD_LAZY);
  if (handle) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational formatString:@"Dynamically loaded library at %s", path];
  } else {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational formatString:@"Failed to load library at %s", path];
  }
  return handle;
}

// Constructs the path for a system framework with the given name and returns the handle for dlsym
static void *fbsdkdfl_load_framework_once(NSString *framework)
{
  NSString *path = [NSString stringWithFormat:g_frameworkPathTemplate, framework, framework];
  return fbsdkdfl_load_library_once(path.fileSystemRepresentation);
}

// Implements the callback for dispatch_once() that loads the handle for specified framework name
#define _fbsdkdfl_load_framework_once_impl_(FRAMEWORK) \
  static void fbsdkdfl_load_##FRAMEWORK##_once(void *context) { \
    *(void **)context = fbsdkdfl_load_framework_once(@#FRAMEWORK); \
  }

// Implements the framework/library retrieval function for the given name.
// It calls the loading function once and caches the handle in a local static variable
#define _fbsdkdfl_handle_get_impl_(LIBRARY) \
  static void *fbsdkdfl_handle_get_##LIBRARY(void) { \
    static void *LIBRARY##_handle; \
    static dispatch_once_t LIBRARY##_once; \
    dispatch_once_f(&LIBRARY##_once, &LIBRARY##_handle, &fbsdkdfl_load_##LIBRARY##_once); \
    return LIBRARY##_handle;\
  }

// Callback from dispatch_once() to load a specific symbol
static void fbsdkdfl_load_symbol_once(void *context)
{
  struct FBSDKDFLLoadSymbolContext *ctx = context;
  *ctx->address = dlsym(ctx->library(), ctx->name);
}

// The boilerplate code for loading a symbol from a given library once and caching it in a static local
#define _fbsdkdfl_symbol_get(LIBRARY, PREFIX, SYMBOL, TYPE, VARIABLE_NAME) \
  static TYPE VARIABLE_NAME; \
  static dispatch_once_t SYMBOL##_once; \
  static struct FBSDKDFLLoadSymbolContext ctx = { .library = &fbsdkdfl_handle_get_##LIBRARY, .name = PREFIX #SYMBOL, .address = (void **)&VARIABLE_NAME }; \
  dispatch_once_f(&SYMBOL##_once, &ctx, &fbsdkdfl_load_symbol_once)

#define _fbsdkdfl_symbol_get_c(LIBRARY, SYMBOL) _fbsdkdfl_symbol_get(LIBRARY, "OBJC_CLASS_$_", SYMBOL, Class, c) // convenience symbol retrieval macro for getting an Objective-C class symbol and storing it in the local static c
#define _fbsdkdfl_symbol_get_f(LIBRARY, SYMBOL) _fbsdkdfl_symbol_get(LIBRARY, "", SYMBOL, SYMBOL##_type, f)      // convenience symbol retrieval macro for getting a function pointer and storing it in the local static f
#define _fbsdkdfl_symbol_get_k(LIBRARY, SYMBOL, TYPE) _fbsdkdfl_symbol_get(LIBRARY, "", SYMBOL, TYPE, k)         // convenience symbol retrieval macro for getting a pointer to a named variable and storing it in the local static k

// convenience macro for verifying a pointer to a named variable was successfully loaded and returns the value
#define _fbsdkdfl_return_k(FRAMEWORK, SYMBOL) \
  NSCAssert(k != NULL, @"Failed to load constant %@ in the %@ framework", @#SYMBOL, @#FRAMEWORK); \
  return *k

// convenience macro for getting a pointer to a named NSString, verifying it loaded correctly, and returning it
#define _fbsdkdfl_get_and_return_NSString(LIBRARY, SYMBOL) \
  _fbsdkdfl_symbol_get_k(LIBRARY, SYMBOL, NSString **); \
  NSCAssert([*k isKindOfClass:[NSString class]], @"Loaded symbol %@ is not of type NSString *", @#SYMBOL); \
  _fbsdkdfl_return_k(LIBRARY, SYMBOL)

#pragma mark - Security Framework

_fbsdkdfl_load_framework_once_impl_(Security)
_fbsdkdfl_handle_get_impl_(Security)

#pragma mark - Security Constants

@implementation FBSDKDynamicFrameworkLoader

#define _fbsdkdfl_Security_get_k(SYMBOL) _fbsdkdfl_symbol_get_k(Security, SYMBOL, CFTypeRef *)

#define _fbsdkdfl_Security_get_and_return_k(SYMBOL) \
  _fbsdkdfl_Security_get_k(SYMBOL); \
  _fbsdkdfl_return_k(Security, SYMBOL)

+ (SecRandomRef)loadkSecRandomDefault
{
  _fbsdkdfl_symbol_get_k(Security, kSecRandomDefault, SecRandomRef *);
  _fbsdkdfl_return_k(Security, kSecRandomDefault);
}

+ (CFTypeRef)loadkSecAttrAccessible
{
  _fbsdkdfl_Security_get_and_return_k(kSecAttrAccessible);
}

+ (CFTypeRef)loadkSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
{
  _fbsdkdfl_Security_get_and_return_k(kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly);
}

+ (CFTypeRef)loadkSecAttrAccount
{
  _fbsdkdfl_Security_get_and_return_k(kSecAttrAccount);
}

+ (CFTypeRef)loadkSecAttrService
{
  _fbsdkdfl_Security_get_and_return_k(kSecAttrService);
}

+ (CFTypeRef)loadkSecAttrGeneric
{
  _fbsdkdfl_Security_get_and_return_k(kSecAttrGeneric);
}

+ (CFTypeRef)loadkSecValueData
{
  _fbsdkdfl_Security_get_and_return_k(kSecValueData);
}

+ (CFTypeRef)loadkSecClassGenericPassword
{
  _fbsdkdfl_Security_get_and_return_k(kSecClassGenericPassword);
}

+ (CFTypeRef)loadkSecAttrAccessGroup
{
  _fbsdkdfl_Security_get_and_return_k(kSecAttrAccessGroup);
}

+ (CFTypeRef)loadkSecMatchLimitOne
{
  _fbsdkdfl_Security_get_and_return_k(kSecMatchLimitOne);
}

+ (CFTypeRef)loadkSecMatchLimit
{
  _fbsdkdfl_Security_get_and_return_k(kSecMatchLimit);
}

+ (CFTypeRef)loadkSecReturnData
{
  _fbsdkdfl_Security_get_and_return_k(kSecReturnData);
}

+ (CFTypeRef)loadkSecClass
{
  _fbsdkdfl_Security_get_and_return_k(kSecClass);
}

@end

#pragma mark - Security APIs

#define _fbsdkdfl_Security_get_f(SYMBOL) _fbsdkdfl_symbol_get_f(Security, SYMBOL)

typedef int (*SecRandomCopyBytes_type)(SecRandomRef, size_t, uint8_t *);
typedef OSStatus (*SecItemUpdate_type)(CFDictionaryRef, CFDictionaryRef);
typedef OSStatus (*SecItemAdd_type)(CFDictionaryRef, CFTypeRef);
typedef OSStatus (*SecItemCopyMatching_type)(CFDictionaryRef, CFTypeRef);
typedef OSStatus (*SecItemDelete_type)(CFDictionaryRef);

int fbsdkdfl_SecRandomCopyBytes(SecRandomRef rnd, size_t count, uint8_t *bytes)
{
  _fbsdkdfl_Security_get_f(SecRandomCopyBytes);
  return f(rnd, count, bytes);
}

OSStatus fbsdkdfl_SecItemUpdate(CFDictionaryRef query, CFDictionaryRef attributesToUpdate)
{
  _fbsdkdfl_Security_get_f(SecItemUpdate);
  return f(query, attributesToUpdate);
}

OSStatus fbsdkdfl_SecItemAdd(CFDictionaryRef attributes, CFTypeRef *result)
{
  _fbsdkdfl_Security_get_f(SecItemAdd);
  return f(attributes, result);
}

OSStatus fbsdkdfl_SecItemCopyMatching(CFDictionaryRef query, CFTypeRef *result)
{
  _fbsdkdfl_Security_get_f(SecItemCopyMatching);
  return f(query, result);
}

OSStatus fbsdkdfl_SecItemDelete(CFDictionaryRef query)
{
  _fbsdkdfl_Security_get_f(SecItemDelete);
  return f(query);
}

#pragma mark - Social Constants

_fbsdkdfl_load_framework_once_impl_(Social)
_fbsdkdfl_handle_get_impl_(Social)

#define _fbsdkdfl_Social_get_and_return_constant(SYMBOL) _fbsdkdfl_get_and_return_NSString(Social, SYMBOL)

NSString *fbsdkdfl_SLServiceTypeFacebook(void)
{
  _fbsdkdfl_Social_get_and_return_constant(SLServiceTypeFacebook);
}

NSString *fbsdkdfl_SLServiceTypeTwitter(void)
{
  _fbsdkdfl_Social_get_and_return_constant(SLServiceTypeTwitter);
}

#pragma mark - Social Classes

#define _fbsdkdfl_Social_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(Social, SYMBOL)

Class fbsdkdfl_SLComposeViewControllerClass(void)
{
  _fbsdkdfl_Social_get_c(SLComposeViewController);
  return c;
}

#pragma mark - MessageUI Classes

_fbsdkdfl_load_framework_once_impl_(MessageUI)
_fbsdkdfl_handle_get_impl_(MessageUI)

#define _fbsdkdfl_MessageUI_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(MessageUI, SYMBOL)

Class fbsdkdfl_MFMailComposeViewControllerClass(void)
{
  _fbsdkdfl_MessageUI_get_c(MFMailComposeViewController);
  return c;
}

Class fbsdkdfl_MFMessageComposeViewControllerClass(void)
{
  _fbsdkdfl_MessageUI_get_c(MFMessageComposeViewController);
  return c;
}

#pragma mark - QuartzCore Classes

_fbsdkdfl_load_framework_once_impl_(QuartzCore)
_fbsdkdfl_handle_get_impl_(QuartzCore)

#define _fbsdkdfl_QuartzCore_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(QuartzCore, SYMBOL);

Class fbsdkdfl_CATransactionClass(void)
{
  _fbsdkdfl_QuartzCore_get_c(CATransaction);
  return c;
}

#pragma mark - QuartzCore APIs

#define _fbsdkdfl_QuartzCore_get_f(SYMBOL) _fbsdkdfl_symbol_get_f(QuartzCore, SYMBOL)

typedef CATransform3D (*CATransform3DMakeScale_type)(CGFloat, CGFloat, CGFloat);
typedef CATransform3D (*CATransform3DMakeTranslation_type)(CGFloat, CGFloat, CGFloat);
typedef CATransform3D (*CATransform3DConcat_type)(CATransform3D, CATransform3D);

const CATransform3D fbsdkdfl_CATransform3DIdentity = {1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1};

CATransform3D fbsdkdfl_CATransform3DMakeScale(CGFloat sx, CGFloat sy, CGFloat sz)
{
  _fbsdkdfl_QuartzCore_get_f(CATransform3DMakeScale);
  return f(sx, sy, sz);
}

CATransform3D fbsdkdfl_CATransform3DMakeTranslation(CGFloat tx, CGFloat ty, CGFloat tz)
{
  _fbsdkdfl_QuartzCore_get_f(CATransform3DMakeTranslation);
  return f(tx, ty, tz);
}

CATransform3D fbsdkdfl_CATransform3DConcat(CATransform3D a, CATransform3D b)
{
  _fbsdkdfl_QuartzCore_get_f(CATransform3DConcat);
  return f(a, b);
}

#pragma mark - AudioToolbox APIs

_fbsdkdfl_load_framework_once_impl_(AudioToolbox)
_fbsdkdfl_handle_get_impl_(AudioToolbox)

#define _fbsdkdfl_AudioToolbox_get_f(SYMBOL) _fbsdkdfl_symbol_get_f(AudioToolbox, SYMBOL)

typedef OSStatus (*AudioServicesCreateSystemSoundID_type)(CFURLRef, SystemSoundID *);
typedef OSStatus (*AudioServicesDisposeSystemSoundID_type)(SystemSoundID);
typedef void (*AudioServicesPlaySystemSound_type)(SystemSoundID);

OSStatus fbsdkdfl_AudioServicesCreateSystemSoundID(CFURLRef inFileURL, SystemSoundID *outSystemSoundID)
{
  _fbsdkdfl_AudioToolbox_get_f(AudioServicesCreateSystemSoundID);
  return f(inFileURL, outSystemSoundID);
}

OSStatus fbsdkdfl_AudioServicesDisposeSystemSoundID(SystemSoundID inSystemSoundID)
{
  _fbsdkdfl_AudioToolbox_get_f(AudioServicesDisposeSystemSoundID);
  return f(inSystemSoundID);
}

void fbsdkdfl_AudioServicesPlaySystemSound(SystemSoundID inSystemSoundID)
{
  _fbsdkdfl_AudioToolbox_get_f(AudioServicesPlaySystemSound);
  return f(inSystemSoundID);
}

#pragma mark - Ad Support Classes

_fbsdkdfl_load_framework_once_impl_(AdSupport)
_fbsdkdfl_handle_get_impl_(AdSupport)

#define _fbsdkdfl_AdSupport_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(AdSupport, SYMBOL);

Class fbsdkdfl_ASIdentifierManagerClass(void)
{
  _fbsdkdfl_AdSupport_get_c(ASIdentifierManager);
  return c;
}

#pragma mark - Safari Services
_fbsdkdfl_load_framework_once_impl_(SafariServices)
_fbsdkdfl_handle_get_impl_(SafariServices)

#define _fbsdkdfl_SafariServices_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(SafariServices, SYMBOL);

Class fbsdkdfl_SFSafariViewControllerClass(void)
{
  _fbsdkdfl_SafariServices_get_c(SFSafariViewController);
  return c;
}

Class fbsdkdfl_SFAuthenticationSessionClass(void)
{
  _fbsdkdfl_SafariServices_get_c(SFAuthenticationSession);
  return c;
}

#pragma mark - Authentication Services
_fbsdkdfl_load_framework_once_impl_(AuthenticationServices)
_fbsdkdfl_handle_get_impl_(AuthenticationServices)

#define _fbsdkdfl_AuthenticationServices_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(AuthenticationServices, SYMBOL);

Class fbsdkdfl_ASWebAuthenticationSessionClass(void)
{
  _fbsdkdfl_AuthenticationServices_get_c(ASWebAuthenticationSession);
  return c;
}

#pragma mark - Accounts Constants

_fbsdkdfl_load_framework_once_impl_(Accounts)
_fbsdkdfl_handle_get_impl_(Accounts)

#define _fbsdkdfl_Accounts_get_and_return_NSString(SYMBOL) _fbsdkdfl_get_and_return_NSString(Accounts, SYMBOL)

NSString *fbsdkdfl_ACFacebookAppIdKey(void)
{
  _fbsdkdfl_Accounts_get_and_return_NSString(ACFacebookAppIdKey);
}

NSString *fbsdkdfl_ACFacebookAudienceEveryone(void)
{
  _fbsdkdfl_Accounts_get_and_return_NSString(ACFacebookAudienceEveryone);
}

NSString *fbsdkdfl_ACFacebookAudienceFriends(void)
{
  _fbsdkdfl_Accounts_get_and_return_NSString(ACFacebookAudienceFriends);
}

NSString *fbsdkdfl_ACFacebookAudienceKey(void)
{
  _fbsdkdfl_Accounts_get_and_return_NSString(ACFacebookAudienceKey);
}

NSString *fbsdkdfl_ACFacebookAudienceOnlyMe(void)
{
  _fbsdkdfl_Accounts_get_and_return_NSString(ACFacebookAudienceOnlyMe);
}

NSString *fbsdkdfl_ACFacebookPermissionsKey(void)
{
  _fbsdkdfl_Accounts_get_and_return_NSString(ACFacebookPermissionsKey);
}

#pragma mark - Accounts Classes

#define _fbsdkdfl_Accounts_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(Accounts, SYMBOL);

Class fbsdkdfl_ACAccountStoreClass(void)
{
  _fbsdkdfl_Accounts_get_c(ACAccountStore);
  return c;
}

#pragma mark - StoreKit Classes

_fbsdkdfl_load_framework_once_impl_(StoreKit)
_fbsdkdfl_handle_get_impl_(StoreKit)

#define _fbsdkdfl_StoreKit_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(StoreKit, SYMBOL);

Class fbsdkdfl_SKPaymentQueueClass(void)
{
  _fbsdkdfl_StoreKit_get_c(SKPaymentQueue);
  return c;
}

Class fbsdkdfl_SKProductsRequestClass(void)
{
  _fbsdkdfl_StoreKit_get_c(SKProductsRequest);
  return c;
}

#pragma mark - AssetsLibrary Classes

_fbsdkdfl_load_framework_once_impl_(AssetsLibrary)
_fbsdkdfl_handle_get_impl_(AssetsLibrary)

#define _fbsdkdfl_AssetsLibrary_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(AssetsLibrary, SYMBOL);

Class fbsdkdfl_ALAssetsLibraryClass(void)
{
  _fbsdkdfl_AssetsLibrary_get_c(ALAssetsLibrary);
  return c;
}

#pragma mark - CoreTelephony Classes

_fbsdkdfl_load_framework_once_impl_(CoreTelephony)
_fbsdkdfl_handle_get_impl_(CoreTelephony)

#define _fbsdkdfl_CoreTelephonyLibrary_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(CoreTelephony, SYMBOL);

Class fbsdkdfl_CTTelephonyNetworkInfoClass(void)
{
    _fbsdkdfl_CoreTelephonyLibrary_get_c(CTTelephonyNetworkInfo);
    return c;
}

#pragma mark - CoreImage

_fbsdkdfl_load_framework_once_impl_(CoreImage)
_fbsdkdfl_handle_get_impl_(CoreImage)

#define _fbsdkdfl_CoreImage_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(CoreImage, SYMBOL);
#define _fbsdkdfl_CoreImage_get_and_return_NSString(SYMBOL) _fbsdkdfl_get_and_return_NSString(CoreImage, SYMBOL)


Class fbsdkdfl_CIImageClass(void)
{
  _fbsdkdfl_CoreImage_get_c(CIImage);
  return c;
}

Class fbsdkdfl_CIFilterClass(void)
{
  _fbsdkdfl_CoreImage_get_c(CIFilter);
  return c;
}

NSString *fbsdkdfl_kCIInputImageKey(void)
{
  _fbsdkdfl_CoreImage_get_and_return_NSString(kCIInputImageKey);
}

NSString *fbsdkdfl_kCIInputRadiusKey(void)
{
  _fbsdkdfl_CoreImage_get_and_return_NSString(kCIInputRadiusKey);
}

NSString *fbsdkdfl_kCIOutputImageKey(void)
{
  _fbsdkdfl_CoreImage_get_and_return_NSString(kCIOutputImageKey);
}

#pragma mark - Photos.framework

_fbsdkdfl_load_framework_once_impl_(Photos)
_fbsdkdfl_handle_get_impl_(Photos)

#define _fbsdkdfl_Photos_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(Photos, SYMBOL);
#define _fbsdkdfl_Photos_get_and_return_NSString(SYMBOL) _fbsdkdfl_get_and_return_NSString(Photos, SYMBOL)

Class fbsdkdfl_PHPhotoLibrary(void)
{
  _fbsdkdfl_Photos_get_c(PHPhotoLibrary);
  return c;
}

Class fbsdkdfl_PHAssetChangeRequest(void)
{
  _fbsdkdfl_Photos_get_c(PHAssetChangeRequest);
  return c;
}

#pragma mark - MobileCoreServices

_fbsdkdfl_load_framework_once_impl_(MobileCoreServices)
_fbsdkdfl_handle_get_impl_(MobileCoreServices)

#define _fbsdkdfl_MobileCoreServices_get_k(SYMBOL) _fbsdkdfl_symbol_get_k(MobileCoreServices, SYMBOL, CFStringRef *)

#define _fbsdkdfl_MobileCoreServices_get_and_return_k(SYMBOL) \
_fbsdkdfl_MobileCoreServices_get_k(SYMBOL); \
_fbsdkdfl_return_k(MobileCoreServices, SYMBOL)

#define _fbsdkdfl_MobileCoreServices_get_f(SYMBOL) _fbsdkdfl_symbol_get_f(MobileCoreServices, SYMBOL)

typedef CFStringRef (*UTTypeCopyPreferredTagWithClass_type)(CFStringRef inUTI, CFStringRef inTagClass);

CFStringRef fbsdkdfl_UTTypeCopyPreferredTagWithClass(CFStringRef inUTI,
                                                     CFStringRef inTagClass)
{
  _fbsdkdfl_MobileCoreServices_get_f(UTTypeCopyPreferredTagWithClass);
  return f(inUTI, inTagClass);
}

CFStringRef fbsdkdfl_kUTTagClassMIMEType(void)
{
  _fbsdkdfl_MobileCoreServices_get_and_return_k(kUTTagClassMIMEType);
}

CFStringRef fbsdkdfl_kUTTypeJPEG(void)
{
  _fbsdkdfl_MobileCoreServices_get_and_return_k(kUTTypeJPEG);
}

CFStringRef fbsdkdfl_kUTTypePNG(void)
{
  _fbsdkdfl_MobileCoreServices_get_and_return_k(kUTTypePNG);
}

#pragma mark - WebKit Classes
_fbsdkdfl_load_framework_once_impl_(WebKit)
_fbsdkdfl_handle_get_impl_(WebKit)

#define _fbsdkdfl_WebKit_get_c(SYMBOL) _fbsdkdfl_symbol_get_c(WebKit, SYMBOL);

Class fbsdkdfl_WKWebViewClass(void)
{
  _fbsdkdfl_WebKit_get_c(WKWebView);
  return c;
}

Class fbsdkdfl_WKUserScriptClass(void)
{
  _fbsdkdfl_WebKit_get_c(WKUserScript);
  return c;
}
