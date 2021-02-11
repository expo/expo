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

#if SWIFT_PACKAGE
 #import "FBSDKGraphRequest.h"
#else
 #import <FBSDKCoreKit/FBSDKGraphRequest.h>
#endif

typedef NS_OPTIONS(NSUInteger, FBSDKGraphRequestFlags) {
  FBSDKGraphRequestFlagNone = 0,
  // indicates this request should not use a client token as its token parameter
  FBSDKGraphRequestFlagSkipClientToken = 1 << 1,
  // indicates this request should not close the session if its response is an oauth error
  FBSDKGraphRequestFlagDoNotInvalidateTokenOnError = 1 << 2,
  // indicates this request should not perform error recovery
  FBSDKGraphRequestFlagDisableErrorRecovery = 1 << 3,
};
@interface FBSDKGraphRequest (Internal)

- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                            flags:(FBSDKGraphRequestFlags)flags;
- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                      tokenString:(NSString *)tokenString
                       HTTPMethod:(NSString *)HTTPMethod
                            flags:(FBSDKGraphRequestFlags)flags;
// Generally, requests automatically issued by the SDK
// should not invalidate the token and should disableErrorRecovery
// so that we don't cause a sudden change in token state or trigger recovery
// out of context of any user action.
@property (nonatomic, assign) FBSDKGraphRequestFlags flags;
@property (nonatomic, readonly, getter = isGraphErrorRecoveryDisabled) BOOL graphErrorRecoveryDisabled;
@property (nonatomic, readonly) BOOL hasAttachments;

+ (BOOL)isAttachment:(id)item;
+ (NSString *)serializeURL:(NSString *)baseUrl
                    params:(NSDictionary *)params
                httpMethod:(NSString *)httpMethod
                  forBatch:(BOOL)forBatch;

@end
