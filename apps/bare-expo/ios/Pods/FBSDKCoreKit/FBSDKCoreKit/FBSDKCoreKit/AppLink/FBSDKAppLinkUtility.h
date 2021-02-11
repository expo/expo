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

/**
  Describes the callback for fetchDeferredAppLink.
 @param url the url representing the deferred App Link
 @param error the error during the request, if any


 The url may also have a fb_click_time_utc query parameter that
 represents when the click occurred that caused the deferred App Link to be created.
 */
typedef void (^FBSDKURLBlock)(NSURL *_Nullable url, NSError *_Nullable error)
NS_SWIFT_NAME(URLBlock);


/**
  Class containing App Links related utility methods.
 */
NS_SWIFT_NAME(AppLinkUtility)
@interface FBSDKAppLinkUtility : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
  Call this method from the main thread to fetch deferred applink data if you use Mobile App
 Engagement Ads (https://developers.facebook.com/docs/ads-for-apps/mobile-app-ads-engagement).
 This may require a network round trip. If successful, the handler is invoked  with the link
 data (this will only return a valid URL once, and future calls will result in a nil URL
 value in the callback).

 @param handler the handler to be invoked if there is deferred App Link data


 The handler may contain an NSError instance to capture any errors. In the
 common case where there simply was no app link data, the NSError instance will be nil.

 This method should only be called from a location that occurs after any launching URL has
 been processed (e.g., you should call this method from your application delegate's
 applicationDidBecomeActive:).
 */
+ (void)fetchDeferredAppLink:(nullable FBSDKURLBlock)handler;

/*
  Call this method to fetch promotion code from the url, if it's present.

 @param url App Link url that was passed to the app.

 @return Promotion code string.


 Call this method to fetch App Invite Promotion Code from applink if present.
 This can be used to fetch the promotion code that was associated with the invite when it
 was created. This method should be called with the url from the openURL method.
*/
+ (nullable NSString *)appInvitePromotionCodeFromURL:(NSURL *)url;

/**
 Check whether the scheme is defined in the app's URL schemes.
 @param scheme the scheme of App Link URL
 @return YES if the scheme is defined, otherwise NO.
*/
+ (BOOL)isMatchURLScheme:(NSString *)scheme;

@end

NS_ASSUME_NONNULL_END

#endif
