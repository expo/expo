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

@class BFAppLink;

/*!
 Provides a set of utilities for working with NSURLs, such as parsing of query parameters
 and handling for App Link requests.
 */
@interface BFURL : NSObject

/*!
 Creates a link target from a raw URL.
 On success, this posts the BFAppLinkParseEventName measurement event. If you are constructing the BFURL within your application delegate's
 application:openURL:sourceApplication:annotation:, you should instead use URLWithInboundURL:sourceApplication:
 to support better BFMeasurementEvent notifications
 @param url The instance of `NSURL` to create BFURL from.
 */
+ (BFURL *)URLWithURL:(NSURL *)url;

/*!
 Creates a link target from a raw URL received from an external application. This is typically called from the app delegate's
 application:openURL:sourceApplication:annotation: and will post the BFAppLinkNavigateInEventName measurement event.
 @param url The instance of `NSURL` to create BFURL from.
 @param sourceApplication the bundle ID of the app that is requesting your app to open the URL. The same sourceApplication in application:openURL:sourceApplication:annotation:
 */
+ (BFURL *)URLWithInboundURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication;

/*!
 Gets the target URL.  If the link is an App Link, this is the target of the App Link.
 Otherwise, it is the url that created the target.
 */
@property (nonatomic, strong, readonly) NSURL *targetURL;

/*!
 Gets the query parameters for the target, parsed into an NSDictionary.
 */
@property (nonatomic, strong, readonly) NSDictionary *targetQueryParameters;

/*!
 If this link target is an App Link, this is the data found in al_applink_data.
 Otherwise, it is nil.
 */
@property (nonatomic, strong, readonly) NSDictionary *appLinkData;

/*!
 If this link target is an App Link, this is the data found in extras.
 */
@property (nonatomic, strong, readonly) NSDictionary *appLinkExtras;

/*!
 The App Link indicating how to navigate back to the referer app, if any.
 */
@property (nonatomic, strong, readonly) BFAppLink *appLinkReferer;

/*!
 The URL that was used to create this BFURL.
 */
@property (nonatomic, strong, readonly) NSURL *inputURL;

/*!
 The query parameters of the inputURL, parsed into an NSDictionary.
 */
@property (nonatomic, strong, readonly) NSDictionary *inputQueryParameters;

@end
