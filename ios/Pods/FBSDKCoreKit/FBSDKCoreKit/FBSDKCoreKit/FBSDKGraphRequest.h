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

#import <FBSDKCoreKit/FBSDKGraphRequestConnection.h>

@class FBSDKAccessToken;

/**
  Represents a request to the Facebook Graph API.


 `FBSDKGraphRequest` encapsulates the components of a request (the
 Graph API path, the parameters, error recovery behavior) and should be
 used in conjunction with `FBSDKGraphRequestConnection` to issue the request.

 Nearly all Graph APIs require an access token. Unless specified, the
 `[FBSDKAccessToken currentAccessToken]` is used. Therefore, most requests
 will require login first (see `FBSDKLoginManager` in FBSDKLoginKit.framework).

 A `- start` method is provided for convenience for single requests.

 By default, FBSDKGraphRequest will attempt to recover any errors returned from
 Facebook. You can disable this via `disableErrorRecovery:`.

 @see FBSDKGraphErrorRecoveryProcessor
 */
@interface FBSDKGraphRequest : NSObject

/**
  Initializes a new instance that use use `[FBSDKAccessToken currentAccessToken]`.
 @param graphPath the graph path (e.g., @"me").
 @param parameters the optional parameters dictionary.
 */
- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters;

/**
  Initializes a new instance that use use `[FBSDKAccessToken currentAccessToken]`.
 @param graphPath the graph path (e.g., @"me").
 @param parameters the optional parameters dictionary.
 @param HTTPMethod the optional HTTP method. nil defaults to @"GET".
 */
- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                       HTTPMethod:(NSString *)HTTPMethod;

/**
  Initializes a new instance.
 @param graphPath the graph path (e.g., @"me").
 @param parameters the optional parameters dictionary.
 @param tokenString the token string to use. Specifying nil will cause no token to be used.
 @param version the optional Graph API version (e.g., @"v2.0"). nil defaults to `[FBSDKSettings graphAPIVersion]`.
 @param HTTPMethod the optional HTTP method (e.g., @"POST"). nil defaults to @"GET".
 */
- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                      tokenString:(NSString *)tokenString
                          version:(NSString *)version
                       HTTPMethod:(NSString *)HTTPMethod
NS_DESIGNATED_INITIALIZER;

/**
  The request parameters.
 */
@property (nonatomic, strong, readonly) NSMutableDictionary *parameters;

/**
  The access token string used by the request.
 */
@property (nonatomic, copy, readonly) NSString *tokenString;

/**
  The Graph API endpoint to use for the request, for example "me".
 */
@property (nonatomic, copy, readonly) NSString *graphPath;

/**
  The HTTPMethod to use for the request, for example "GET" or "POST".
 */
@property (nonatomic, copy, readonly) NSString *HTTPMethod;

/**
  The Graph API version to use (e.g., "v2.0")
 */
@property (nonatomic, copy, readonly) NSString *version;

/**
  If set, disables the automatic error recovery mechanism.
 @param disable whether to disable the automatic error recovery mechanism

 By default, non-batched FBSDKGraphRequest instances will automatically try to recover
 from errors by constructing a `FBSDKGraphErrorRecoveryProcessor` instance that
 re-issues the request on successful recoveries. The re-issued request will call the same
 handler as the receiver but may occur with a different `FBSDKGraphRequestConnection` instance.

 This will override [FBSDKSettings setGraphErrorRecoveryDisabled:].
 */
- (void)setGraphErrorRecoveryDisabled:(BOOL)disable;

/**
  Starts a connection to the Graph API.
 @param handler The handler block to call when the request completes.
 */
- (FBSDKGraphRequestConnection *)startWithCompletionHandler:(FBSDKGraphRequestHandler)handler;

@end
