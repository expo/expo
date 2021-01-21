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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class FBSDKAppLink;

/**
 Provides a set of utilities for working with NSURLs, such as parsing of query parameters
 and handling for App Link requests.
 */
NS_SWIFT_NAME(AppLinkURL)
@interface FBSDKURL : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 Creates a link target from a raw URL.
 On success, this posts the FBSDKAppLinkParseEventName measurement event. If you are constructing the FBSDKURL within your application delegate's
 application:openURL:sourceApplication:annotation:, you should instead use URLWithInboundURL:sourceApplication:
 to support better FBSDKMeasurementEvent notifications
 @param url The instance of `NSURL` to create FBSDKURL from.
 */
+ (instancetype)URLWithURL:(NSURL *)url
NS_SWIFT_NAME(init(url:));

/**
 Creates a link target from a raw URL received from an external application. This is typically called from the app delegate's
 application:openURL:sourceApplication:annotation: and will post the FBSDKAppLinkNavigateInEventName measurement event.
 @param url The instance of `NSURL` to create FBSDKURL from.
 @param sourceApplication the bundle ID of the app that is requesting your app to open the URL. The same sourceApplication in application:openURL:sourceApplication:annotation:
 */
+ (instancetype)URLWithInboundURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication
NS_SWIFT_NAME(init(inboundURL:sourceApplication:));

/**
 Gets the target URL.  If the link is an App Link, this is the target of the App Link.
 Otherwise, it is the url that created the target.
 */
@property (nonatomic, strong, readonly) NSURL *targetURL;

/**
 Gets the query parameters for the target, parsed into an NSDictionary.
 */
@property (nonatomic, strong, readonly) NSDictionary<NSString *, id> *targetQueryParameters;

/**
 If this link target is an App Link, this is the data found in al_applink_data.
 Otherwise, it is nil.
 */
@property (nonatomic, strong, readonly, nullable) NSDictionary<NSString *, id> *appLinkData;

/**
 If this link target is an App Link, this is the data found in extras.
 */
@property (nonatomic, strong, readonly, nullable) NSDictionary<NSString *, id> *appLinkExtras;

/**
 The App Link indicating how to navigate back to the referer app, if any.
 */
@property (nonatomic, strong, readonly, nullable) FBSDKAppLink *appLinkReferer;

/**
 The URL that was used to create this FBSDKURL.
 */
@property (nonatomic, strong, readonly) NSURL *inputURL;

/**
 The query parameters of the inputURL, parsed into an NSDictionary.
 */
@property (nonatomic, strong, readonly) NSDictionary<NSString *, id> *inputQueryParameters;

/**
 The flag indicating whether the URL comes from auto app link
*/
@property (nonatomic, readonly, getter=isAutoAppLink) BOOL isAutoAppLink;

@end

NS_ASSUME_NONNULL_END

#endif
