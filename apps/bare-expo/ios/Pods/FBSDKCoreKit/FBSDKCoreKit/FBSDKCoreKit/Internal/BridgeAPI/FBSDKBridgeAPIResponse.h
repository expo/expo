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

#if SWIFT_PACKAGE
#import "FBSDKCopying.h"
#else
#import <FBSDKCoreKit/FBSDKCopying.h>
#endif

#import "FBSDKBridgeAPIRequest.h"

NS_SWIFT_NAME(BridgeAPIResponse)
@interface FBSDKBridgeAPIResponse : NSObject <FBSDKCopying>

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

+ (instancetype)bridgeAPIResponseWithRequest:(NSObject<FBSDKBridgeAPIRequestProtocol> *)request error:(NSError *)error;
+ (instancetype)bridgeAPIResponseWithRequest:(NSObject<FBSDKBridgeAPIRequestProtocol> *)request
                                 responseURL:(NSURL *)responseURL
                           sourceApplication:(NSString *)sourceApplication
                                       error:(NSError *__autoreleasing *)errorRef;
+ (instancetype)bridgeAPIResponseCancelledWithRequest:(NSObject<FBSDKBridgeAPIRequestProtocol> *)request;

@property (nonatomic, assign, readonly, getter=isCancelled) BOOL cancelled;
@property (nonatomic, copy, readonly) NSError *error;
@property (nonatomic, copy, readonly) NSObject<FBSDKBridgeAPIRequestProtocol> *request;
@property (nonatomic, copy, readonly) NSDictionary *responseParameters;

@end

#endif
