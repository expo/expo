/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Foundation/Foundation.h>

#import <Bolts/BFAppLink.h>

/*!
 The result of calling navigate on a BFAppLinkNavigation
 */
typedef NS_ENUM(NSInteger, BFAppLinkNavigationType) {
    /*! Indicates that the navigation failed and no app was opened */
    BFAppLinkNavigationTypeFailure,
    /*! Indicates that the navigation succeeded by opening the URL in the browser */
    BFAppLinkNavigationTypeBrowser,
    /*! Indicates that the navigation succeeded by opening the URL in an app on the device */
    BFAppLinkNavigationTypeApp
};

@protocol BFAppLinkResolving;
@class BFTask;

/*!
 Represents a pending request to navigate to an App Link. Most developers will
 simply use navigateToURLInBackground: to open a URL, but developers can build
 custom requests with additional navigation and app data attached to them by
 creating BFAppLinkNavigations themselves.
 */
NS_EXTENSION_UNAVAILABLE_IOS("Not available in app extension")
@interface BFAppLinkNavigation : NSObject

/*!
 The extras for the AppLinkNavigation. This will generally contain application-specific
 data that should be passed along with the request, such as advertiser or affiliate IDs or
 other such metadata relevant on this device.
 */
@property (nonatomic, copy, readonly) NSDictionary *extras;

/*!
 The al_applink_data for the AppLinkNavigation. This will generally contain data common to
 navigation attempts such as back-links, user agents, and other information that may be used
 in routing and handling an App Link request.
 */
@property (nonatomic, copy, readonly) NSDictionary *appLinkData;

/*! The AppLink to navigate to */
@property (nonatomic, strong, readonly) BFAppLink *appLink;

/*! Creates an AppLinkNavigation with the given link, extras, and App Link data */
+ (instancetype)navigationWithAppLink:(BFAppLink *)appLink
                               extras:(NSDictionary *)extras
                          appLinkData:(NSDictionary *)appLinkData;

/*!
 Creates an NSDictionary with the correct format for iOS callback URLs,
 to be used as 'appLinkData' argument in the call to navigationWithAppLink:extras:appLinkData:
 */
+ (NSDictionary *)callbackAppLinkDataForAppWithName:(NSString *)appName url:(NSString *)url;

/*! Performs the navigation */
- (BFAppLinkNavigationType)navigate:(NSError **)error;

/*! Returns a BFAppLink for the given URL */
+ (BFTask *)resolveAppLinkInBackground:(NSURL *)destination;

/*! Returns a BFAppLink for the given URL using the given App Link resolution strategy */
+ (BFTask *)resolveAppLinkInBackground:(NSURL *)destination resolver:(id<BFAppLinkResolving>)resolver;

/*! Navigates to a BFAppLink and returns whether it opened in-app or in-browser */
+ (BFAppLinkNavigationType)navigateToAppLink:(BFAppLink *)link error:(NSError **)error;

/*!
 Returns a BFAppLinkNavigationType based on a BFAppLink.
 It's essentially a no-side-effect version of navigateToAppLink:error:,
 allowing apps to determine flow based on the link type (e.g. open an
 internal web view instead of going straight to the browser for regular links.)
 */
+ (BFAppLinkNavigationType)navigationTypeForLink:(BFAppLink *)link;

/*!
 Return navigation type for current instance.
 No-side-effect version of navigate:
 */
- (BFAppLinkNavigationType)navigationType;

/*! Navigates to a URL (an asynchronous action) and returns a BFNavigationType */
+ (BFTask *)navigateToURLInBackground:(NSURL *)destination;

/*!
 Navigates to a URL (an asynchronous action) using the given App Link resolution
 strategy and returns a BFNavigationType
 */
+ (BFTask *)navigateToURLInBackground:(NSURL *)destination resolver:(id<BFAppLinkResolving>)resolver;

/*!
 Gets the default resolver to be used for App Link resolution. If the developer has not set one explicitly,
 a basic, built-in resolver will be used.
 */
+ (id<BFAppLinkResolving>)defaultResolver;

/*!
 Sets the default resolver to be used for App Link resolution. Setting this to nil will revert the
 default resolver to the basic, built-in resolver provided by Bolts.
 */
+ (void)setDefaultResolver:(id<BFAppLinkResolving>)resolver;

@end
