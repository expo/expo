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

#import "FBSDKCopying.h"

NS_ASSUME_NONNULL_BEGIN

/**
 Represent an AuthenticationToken used for a login attempt
*/
NS_SWIFT_NAME(AuthenticationToken)
@interface FBSDKAuthenticationToken : NSObject<FBSDKCopying, NSSecureCoding>

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
  The "global" authentication token that represents the currently logged in user.

 The `currentAuthenticationToken` represents the authentication token of the
 current user and can be used by a client to verify an authentication attempt.
 */
@property (class, nonatomic, copy, nullable) FBSDKAuthenticationToken *currentAuthenticationToken;

/**
 The raw token string from the authentication response
 */
@property (nonatomic, copy, readonly) NSString *tokenString;

/**
 The nonce from the decoded authentication response
 */
@property (nonatomic, copy, readonly) NSString *nonce;

/**
  The graph domain where the user is authenticated.
 */
@property (nonatomic, copy, readonly) NSString *graphDomain;

@end

NS_ASSUME_NONNULL_END
