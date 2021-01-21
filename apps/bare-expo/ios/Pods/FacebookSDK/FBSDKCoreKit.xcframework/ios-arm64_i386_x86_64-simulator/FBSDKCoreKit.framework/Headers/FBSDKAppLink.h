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

#import "FBSDKAppLinkTarget.h"

NS_ASSUME_NONNULL_BEGIN

/** The version of the App Link protocol that this library supports */
FOUNDATION_EXPORT NSString *const FBSDKAppLinkVersion
NS_SWIFT_NAME(AppLinkVersion);

/**
 Contains App Link metadata relevant for navigation on this device
 derived from the HTML at a given URL.
 */
NS_SWIFT_NAME(AppLink)
@interface FBSDKAppLink : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 Creates a FBSDKAppLink with the given list of FBSDKAppLinkTargets and target URL.

 Generally, this will only be used by implementers of the FBSDKAppLinkResolving protocol,
 as these implementers will produce App Link metadata for a given URL.

 @param sourceURL the URL from which this App Link is derived
 @param targets an ordered list of FBSDKAppLinkTargets for this platform derived
 from App Link metadata.
 @param webURL the fallback web URL, if any, for the app link.
 */
+ (instancetype)appLinkWithSourceURL:(nullable NSURL *)sourceURL
                             targets:(NSArray<FBSDKAppLinkTarget *> *)targets
                              webURL:(nullable NSURL *)webURL
NS_SWIFT_NAME(init(sourceURL:targets:webURL:));

/** The URL from which this FBSDKAppLink was derived */
@property (nonatomic, strong, readonly, nullable) NSURL *sourceURL;

/**
 The ordered list of targets applicable to this platform that will be used
 for navigation.
 */
@property (nonatomic, copy, readonly) NSArray<FBSDKAppLinkTarget *> *targets;

/** The fallback web URL to use if no targets are installed on this device. */
@property (nonatomic, strong, readonly, nullable) NSURL *webURL;

@end

NS_ASSUME_NONNULL_END

#endif
