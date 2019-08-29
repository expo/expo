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

NS_ASSUME_NONNULL_BEGIN

@class FBSDKAppLink;

/**
 Describes the callback for appLinkFromURLInBackground.
 @param appLink the FBSDKAppLink representing the deferred App Link
 @param error the error during the request, if any

 */
typedef void (^FBSDKAppLinkBlock)(FBSDKAppLink * _Nullable appLink, NSError * _Nullable error)
NS_SWIFT_NAME(AppLinkBlock);


/*!
 Implement this protocol to provide an alternate strategy for resolving
 App Links that may include pre-fetching, caching, or querying for App Link
 data from an index provided by a service provider.
 */
NS_SWIFT_NAME(AppLinkResolving)
@protocol FBSDKAppLinkResolving <NSObject>

/**
 Asynchronously resolves App Link data for a given URL.

 @param url The URL to resolve into an App Link.
 @param handler The completion block that will return an App Link for the given URL.
 */
- (void)appLinkFromURL:(NSURL *)url handler:(FBSDKAppLinkBlock)handler
NS_EXTENSION_UNAVAILABLE_IOS("Not available in app extension");

@end

NS_ASSUME_NONNULL_END
