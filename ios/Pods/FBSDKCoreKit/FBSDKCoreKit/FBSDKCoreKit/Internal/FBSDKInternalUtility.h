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

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "FBSDKCoreKit+Internal.h"

NS_ASSUME_NONNULL_BEGIN

#define FBSDK_CANOPENURL_FACEBOOK @"fbauth2"
#define FBSDK_CANOPENURL_FBAPI @"fbapi"
#define FBSDK_CANOPENURL_MESSENGER @"fb-messenger-share-api"
#define FBSDK_CANOPENURL_MSQRD_PLAYER @"msqrdplayer"
#define FBSDK_CANOPENURL_SHARE_EXTENSION @"fbshareextension"

typedef NS_ENUM(int32_t, FBSDKUIKitVersion)
{
  FBSDKUIKitVersion_6_0 = 0x0944,
  FBSDKUIKitVersion_6_1 = 0x094C,
  FBSDKUIKitVersion_7_0 = 0x0B57,
  FBSDKUIKitVersion_7_1 = 0x0B77,
  FBSDKUIKitVersion_8_0 = 0x0CF6,
} NS_SWIFT_NAME(FBUIKit.Version);

/**
 Describes the callback for appLinkFromURLInBackground.
 @param object the FBSDKAppLink representing the deferred App Link
 @param stop the error during the request, if any

 */
typedef id _Nullable (^FBSDKInvalidObjectHandler)(id object, BOOL *stop)
NS_SWIFT_NAME(InvalidObjectHandler);



NS_SWIFT_NAME(InternalUtility)
@interface FBSDKInternalUtility : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
  Constructs the scheme for apps that come to the current app through the bridge.
 */
@property (class, nonatomic, copy, readonly) NSString *appURLScheme;

/**
 Returns bundle for returning localized strings

 We assume a convention of a bundle named FBSDKStrings.bundle, otherwise we
 return the main bundle.
 */
@property (class, nonatomic, strong, readonly) NSBundle *bundleForStrings;

/**
 Gets the milliseconds since the Unix Epoch.

 Changes in the system clock will affect this value.
 @return The number of milliseconds since the Unix Epoch.
 */
@property (class, nonatomic, assign, readonly) uint64_t currentTimeInMilliseconds;

/**
 The version of the operating system on which the process is executing.
 */
@property (class, nonatomic, assign, readonly) NSOperatingSystemVersion operatingSystemVersion;

/**
 Tests whether the orientation should be manually adjusted for views outside of the root view controller.

 With the legacy layout the developer must worry about device orientation when working with views outside of
 the window's root view controller and apply the correct rotation transform and/or swap a view's width and height
 values.  If the application was linked with UIKit on iOS 7 or earlier or the application is running on iOS 7 or earlier
 then we need to use the legacy layout code.  Otherwise if the application was linked with UIKit on iOS 8 or later and
 the application is running on iOS 8 or later, UIKit handles all of the rotation complexity and the origin is always in
 the top-left and no rotation transform is necessary.
 @return YES if if the orientation must be manually adjusted, otherwise NO.
 */
@property (class, nonatomic, assign, readonly) BOOL shouldManuallyAdjustOrientation;

/*
 Checks if the app is Unity.
 */
@property (class, nonatomic, assign, readonly) BOOL isUnity;

/**
  Constructs an URL for the current app.
 @param host The host for the URL.
 @param path The path for the URL.
 @param queryParameters The query parameters for the URL.  This will be converted into a query string.
 @param errorRef If an error occurs, upon return contains an NSError object that describes the problem.
 @return The app URL.
 */
+ (NSURL *)appURLWithHost:(NSString *)host
                     path:(NSString *)path
          queryParameters:(NSDictionary<NSString *, NSString *> *)queryParameters
                    error:(NSError *__autoreleasing *)errorRef;

/**
  Parses an FB url's query params (and potentially fragment) into a dictionary.
 @param url The FB url.
 @return A dictionary with the key/value pairs.
 */
+ (NSDictionary *)dictionaryFromFBURL:(NSURL *)url;

/**
  Constructs a Facebook URL.
 @param hostPrefix The prefix for the host, such as 'm', 'graph', etc.
 @param path The path for the URL.  This may or may not include a version.
 @param queryParameters The query parameters for the URL.  This will be converted into a query string.
 @param errorRef If an error occurs, upon return contains an NSError object that describes the problem.
 @return The Facebook URL.
 */
+ (NSURL *)facebookURLWithHostPrefix:(NSString *)hostPrefix
                                path:(NSString *)path
                     queryParameters:(NSDictionary<NSString *, NSString *> *)queryParameters
                               error:(NSError *__autoreleasing *)errorRef;

/**
  Constructs a Facebook URL.
 @param hostPrefix The prefix for the host, such as 'm', 'graph', etc.
 @param path The path for the URL.  This may or may not include a version.
 @param queryParameters The query parameters for the URL.  This will be converted into a query string.
 @param defaultVersion A version to add to the URL if none is found in the path.
 @param errorRef If an error occurs, upon return contains an NSError object that describes the problem.
 @return The Facebook URL.
 */
+ (NSURL *)facebookURLWithHostPrefix:(NSString *)hostPrefix
                                path:(NSString *)path
                     queryParameters:(NSDictionary<NSString *, NSString *> *)queryParameters
                      defaultVersion:(NSString *)defaultVersion
                               error:(NSError *__autoreleasing *)errorRef;

/**
  Tests whether the supplied URL is a valid URL for opening in the browser.
 @param URL The URL to test.
 @return YES if the URL refers to an http or https resource, otherwise NO.
 */
+ (BOOL)isBrowserURL:(NSURL *)URL;

/**
  Tests whether the supplied bundle identifier references a Facebook app.
 @param bundleIdentifier The bundle identifier to test.
 @return YES if the bundle identifier refers to a Facebook app, otherwise NO.
 */
+ (BOOL)isFacebookBundleIdentifier:(NSString *)bundleIdentifier;

/**
  Tests whether the operating system is at least the specified version.
 @param version The version to test against.
 @return YES if the operating system is greater than or equal to the specified version, otherwise NO.
 */
+ (BOOL)isOSRunTimeVersionAtLeast:(NSOperatingSystemVersion)version;

/**
  Tests whether the supplied bundle identifier references the Safari app.
 @param bundleIdentifier The bundle identifier to test.
 @return YES if the bundle identifier refers to the Safari app, otherwise NO.
 */
+ (BOOL)isSafariBundleIdentifier:(NSString *)bundleIdentifier;

/**
  Tests whether the UIKit version that the current app was linked to is at least the specified version.
 @param version The version to test against.
 @return YES if the linked UIKit version is greater than or equal to the specified version, otherwise NO.
 */
+ (BOOL)isUIKitLinkTimeVersionAtLeast:(FBSDKUIKitVersion)version;

/**
  Tests whether the UIKit version in the runtime is at least the specified version.
 @param version The version to test against.
 @return YES if the runtime UIKit version is greater than or equal to the specified version, otherwise NO.
 */
+ (BOOL)isUIKitRunTimeVersionAtLeast:(FBSDKUIKitVersion)version;

/**
  Checks equality between 2 objects.

 Checks for pointer equality, nils, isEqual:.
 @param object The first object to compare.
 @param other The second object to compare.
 @return YES if the objects are equal, otherwise NO.
 */
+ (BOOL)object:(id)object isEqualToObject:(id)other;

/**
  Constructs an NSURL.
 @param scheme The scheme for the URL.
 @param host The host for the URL.
 @param path The path for the URL.
 @param queryParameters The query parameters for the URL.  This will be converted into a query string.
 @param errorRef If an error occurs, upon return contains an NSError object that describes the problem.
 @return The URL.
 */
+ (NSURL *)URLWithScheme:(NSString *)scheme
                    host:(NSString *)host
                    path:(NSString *)path
         queryParameters:(NSDictionary *)queryParameters
                   error:(NSError *__autoreleasing *)errorRef;

/**
 *  Deletes all the cookies in the NSHTTPCookieStorage for Facebook web dialogs
 */
+ (void)deleteFacebookCookies;

/**
  Extracts permissions from a response fetched from me/permissions
 @param responseObject the response
 @param grantedPermissions the set to add granted permissions to
 @param declinedPermissions the set to add declined permissions to.
 */
+ (void)extractPermissionsFromResponse:(NSDictionary *)responseObject
                    grantedPermissions:(NSMutableSet *)grantedPermissions
                   declinedPermissions:(NSMutableSet *)declinedPermissions
                    expiredPermissions:(NSMutableSet *)expiredPermissions;

/**
  Registers a transient object so that it will not be deallocated until unregistered
 @param object The transient object
 */
+ (void)registerTransientObject:(id)object;

/**
  Unregisters a transient object that was previously registered with registerTransientObject:
 @param object The transient object
 */
+ (void)unregisterTransientObject:(__weak id)object;

/**
  validates that the app ID is non-nil, throws an NSException if nil.
 */
+ (void)validateAppID;

/**
 Validates that the client access token is non-nil, otherwise - throws an NSException otherwise.
 Returns the composed client access token.
 */
+ (NSString *)validateRequiredClientAccessToken;

/**
  validates that the right URL schemes are registered, throws an NSException if not.
 */
+ (void)validateURLSchemes;

/**
  validates that Facebook reserved URL schemes are not registered, throws an NSException if they are.
 */
+ (void)validateFacebookReservedURLSchemes;

/**
  Attempts to find the first UIViewController in the view's responder chain. Returns nil if not found.
 */
+ (UIViewController *)viewControllerForView:(UIView *)view;

/**
  returns true if the url scheme is registered in the CFBundleURLTypes
 */
+ (BOOL)isRegisteredURLScheme:(NSString *)urlScheme;

/**
 returns the current key window
 */
+ (UIWindow *)findWindow;

/**
  returns currently displayed top view controller.
 */
+ (UIViewController *)topMostViewController;

/**
  Converts NSData to a hexadecimal UTF8 String.
 */
+ (NSString *)hexadecimalStringFromData:(NSData *)data;

/*
  Checks if the permission is a publish permission.
 */
+ (BOOL)isPublishPermission:(NSString *)permission;

#pragma mark - FB Apps Installed

@property (class, nonatomic, assign, readonly) BOOL isFacebookAppInstalled;
@property (class, nonatomic, assign, readonly) BOOL isMessengerAppInstalled;
@property (class, nonatomic, assign, readonly) BOOL isMSQRDPlayerAppInstalled;

+ (void)checkRegisteredCanOpenURLScheme:(NSString *)urlScheme;
+ (BOOL)isRegisteredCanOpenURLScheme:(NSString *)urlScheme;

#define FBSDKConditionalLog(condition, loggingBehavior, desc, ...) \
{ \
  if (!(condition)) { \
    NSString *msg = [NSString stringWithFormat:(desc), ##__VA_ARGS__]; \
    [FBSDKLogger singleShotLogEntry:loggingBehavior logEntry:msg]; \
  } \
}

#define FB_BASE_URL @"facebook.com"

@end

NS_ASSUME_NONNULL_END
