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

#import "FBSDKAppLink.h"
#import "FBSDKAppLinkResolving.h"

NS_ASSUME_NONNULL_BEGIN

/**
 The result of calling navigate on a FBSDKAppLinkNavigation
 */
typedef NS_ENUM(NSInteger, FBSDKAppLinkNavigationType) {
    /** Indicates that the navigation failed and no app was opened */
    FBSDKAppLinkNavigationTypeFailure,
    /** Indicates that the navigation succeeded by opening the URL in the browser */
    FBSDKAppLinkNavigationTypeBrowser,
    /** Indicates that the navigation succeeded by opening the URL in an app on the device */
    FBSDKAppLinkNavigationTypeApp
} NS_SWIFT_NAME(AppLinkNavigation.Type);

/**
 Describes the callback for appLinkFromURLInBackground.
 @param navType the FBSDKAppLink representing the deferred App Link
 @param error the error during the request, if any

 */
typedef void (^FBSDKAppLinkNavigationBlock)(FBSDKAppLinkNavigationType navType, NSError * _Nullable error)
NS_SWIFT_NAME(AppLinkNavigationBlock);

/**
 Represents a pending request to navigate to an App Link. Most developers will
 simply use navigateToURLInBackground: to open a URL, but developers can build
 custom requests with additional navigation and app data attached to them by
 creating FBSDKAppLinkNavigations themselves.
 */
NS_EXTENSION_UNAVAILABLE_IOS("Not available in app extension")
NS_SWIFT_NAME(AppLinkNavigation)
@interface FBSDKAppLinkNavigation : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 The default resolver to be used for App Link resolution. If the developer has not set one explicitly,
 a basic, built-in FBSDKWebViewAppLinkResolver will be used.
 */
@property (class, nonatomic, strong) id<FBSDKAppLinkResolving> defaultResolver
NS_SWIFT_NAME(default);

/**
 The extras for the AppLinkNavigation. This will generally contain application-specific
 data that should be passed along with the request, such as advertiser or affiliate IDs or
 other such metadata relevant on this device.
 */
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *extras;

/**
 The al_applink_data for the AppLinkNavigation. This will generally contain data common to
 navigation attempts such as back-links, user agents, and other information that may be used
 in routing and handling an App Link request.
 */
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *appLinkData;

/** The AppLink to navigate to */
@property (nonatomic, strong, readonly) FBSDKAppLink *appLink;

/**
 Return navigation type for current instance.
 No-side-effect version of navigate:
 */
@property (nonatomic, readonly) FBSDKAppLinkNavigationType navigationType;

/** Creates an AppLinkNavigation with the given link, extras, and App Link data */
+ (instancetype)navigationWithAppLink:(FBSDKAppLink *)appLink
                               extras:(NSDictionary<NSString *, id> *)extras
                          appLinkData:(NSDictionary<NSString *, id> *)appLinkData
NS_SWIFT_NAME(init(appLink:extras:appLinkData:));

/**
 Creates an NSDictionary with the correct format for iOS callback URLs,
 to be used as 'appLinkData' argument in the call to navigationWithAppLink:extras:appLinkData:
 */
+ (NSDictionary<NSString *, NSDictionary<NSString *, NSString *> *> *)callbackAppLinkDataForAppWithName:(NSString *)appName
                                                                                                    url:(NSString *)url
NS_SWIFT_NAME(callbackAppLinkData(forApp:url:));

/** Performs the navigation */
- (FBSDKAppLinkNavigationType)navigate:(NSError **)error
__attribute__((swift_error(nonnull_error)));

/** Returns a FBSDKAppLink for the given URL */
+ (void)resolveAppLink:(NSURL *)destination handler:(FBSDKAppLinkBlock)handler;

/** Returns a FBSDKAppLink for the given URL using the given App Link resolution strategy */
+ (void)resolveAppLink:(NSURL *)destination
              resolver:(id<FBSDKAppLinkResolving>)resolver
               handler:(FBSDKAppLinkBlock)handler;

/** Navigates to a FBSDKAppLink and returns whether it opened in-app or in-browser */
+ (FBSDKAppLinkNavigationType)navigateToAppLink:(FBSDKAppLink *)link error:(NSError **)error
__attribute__((swift_error(nonnull_error)));

/**
 Returns a FBSDKAppLinkNavigationType based on a FBSDKAppLink.
 It's essentially a no-side-effect version of navigateToAppLink:error:,
 allowing apps to determine flow based on the link type (e.g. open an
 internal web view instead of going straight to the browser for regular links.)
 */
+ (FBSDKAppLinkNavigationType)navigationTypeForLink:(FBSDKAppLink *)link;

/** Navigates to a URL (an asynchronous action) and returns a FBSDKNavigationType */
+ (void)navigateToURL:(NSURL *)destination handler:(FBSDKAppLinkNavigationBlock)handler;

/**
 Navigates to a URL (an asynchronous action) using the given App Link resolution
 strategy and returns a FBSDKNavigationType
 */
+ (void)navigateToURL:(NSURL *)destination
             resolver:(id<FBSDKAppLinkResolving>)resolver
              handler:(FBSDKAppLinkNavigationBlock)handler;

@end

NS_ASSUME_NONNULL_END
