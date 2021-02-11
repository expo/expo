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
 #import "FBSDKAuthenticationToken.h"
#else
 #import <FBSDKCoreKit/FBSDKAuthenticationToken.h>
#endif

NS_ASSUME_NONNULL_BEGIN

typedef void (^FBSDKAuthenticationTokenBlock)(FBSDKAuthenticationToken *_Nullable token)
NS_SWIFT_NAME(AuthenticationTokenBlock);

/**
 Class responsible for generating an `AuthenticationToken` given a valid token string.
 An `AuthenticationToken` is verified based of the OpenID Connect Protocol.
 */
NS_SWIFT_NAME(AuthenticationTokenFactory)
@interface FBSDKAuthenticationTokenFactory : NSObject

 /**
  Create an `AuthenticationToken` given a valid token string.
  Returns nil to the completion handler if the token string is invalid
  An `AuthenticationToken` is verified based of the OpenID Connect Protocol.
  @param tokenString the raw ID token string
  @param nonce the nonce string used to associate a client session with the token
  @param graphDomain the graph domain where user is authenticated
  @param completion the completion handler
*/
- (void)createTokenFromTokenString:(NSString * _Nonnull)tokenString
                             nonce:(NSString * _Nonnull)nonce
                       graphDomain:(NSString * _Nonnull)graphDomain
                        completion:(FBSDKAuthenticationTokenBlock)completion;

/**
 Create an `AuthenticationToken` for facebook graph domain given a valid token string.
 Returns nil to the completion handler if the token string is invalid
 An `AuthenticationToken` is verified based of the OpenID Connect Protocol.
 @param tokenString the raw ID token string
 @param nonce the nonce string used to associate a client session with the token
 @param completion the completion handler
*/
- (void)createTokenFromTokenString:(NSString *_Nonnull)tokenString
                             nonce:(NSString *_Nonnull)nonce
                        completion:(FBSDKAuthenticationTokenBlock)completion;

@end

NS_ASSUME_NONNULL_END
