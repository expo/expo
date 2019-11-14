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

@class FBSDKLoginManager;
@class FBSDKLoginCompletionParameters;

/**
 Success Block
 */
typedef void (^FBSDKLoginCompletionParametersBlock)(FBSDKLoginCompletionParameters *parameters)
NS_SWIFT_NAME(LoginCompletionParametersBlock);

/**
  Structured interface for accessing the parameters used to complete a log in request.
 If \c accessTokenString is non-<code>nil</code>, the authentication succeeded. If \c error is
 non-<code>nil</code> the request failed. If both are \c nil, the request was cancelled.
 */
NS_SWIFT_NAME(LoginCompletionParameters)
@interface FBSDKLoginCompletionParameters : NSObject

- (instancetype)init NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithError:(NSError *)error;

@property (nonatomic, copy, readonly) NSString *accessTokenString;
@property (nonatomic, copy, readonly) NSString *nonceString;

@property (nonatomic, copy, readonly) NSSet *permissions;
@property (nonatomic, copy, readonly) NSSet *declinedPermissions;
@property (nonatomic, copy, readonly) NSSet *expiredPermissions;

@property (nonatomic, copy, readonly) NSString *appID;
@property (nonatomic, copy, readonly) NSString *userID;

@property (nonatomic, copy, readonly) NSError *error;

@property (nonatomic, copy, readonly) NSDate *expirationDate;
@property (nonatomic, copy, readonly) NSDate *dataAccessExpirationDate;

@property (nonatomic, copy, readonly) NSString *challenge;
@end

NS_SWIFT_NAME(LoginCompleting)
@protocol FBSDKLoginCompleting

/**
  Invoke \p handler with the login parameters derived from the authentication result.
 See the implementing class's documentation for whether it completes synchronously or asynchronously.
 */
- (void)completeLoginWithHandler:(FBSDKLoginCompletionParametersBlock)handler;

@end

#pragma mark - Completers

/**
  Extracts the log in completion parameters from the \p parameters dictionary,
 which must contain the parsed result of the return URL query string.

 The \c user_id key is first used to derive the User ID. If that fails, \c signed_request
 is used.

 Completion occurs synchronously.
 */
NS_SWIFT_NAME(LoginURLCompleter)
@interface FBSDKLoginURLCompleter : NSObject <FBSDKLoginCompleting>

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)initWithURLParameters:(NSDictionary *)parameters appID:(NSString *)appID NS_DESIGNATED_INITIALIZER;

@end

