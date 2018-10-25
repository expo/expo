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

/*!
 Represents a target defined in App Link metadata, consisting of at least
 a URL, and optionally an App Store ID and name.
 */
@interface FBSDKAppLinkTarget : NSObject

/*! Creates a FBSDKAppLinkTarget with the given app site and target URL. */
+ (instancetype)appLinkTargetWithURL:(NSURL *)url
                          appStoreId:(nullable NSString *)appStoreId
                             appName:(NSString *)appName;

/*! The URL prefix for this app link target */
@property (nonatomic, strong, readonly) NSURL *URL;

/*! The app ID for the app store */
@property (nonatomic, copy, readonly, nullable) NSString *appStoreId;

/*! The name of the app */
@property (nonatomic, copy, readonly) NSString *appName;

@end

NS_ASSUME_NONNULL_END
