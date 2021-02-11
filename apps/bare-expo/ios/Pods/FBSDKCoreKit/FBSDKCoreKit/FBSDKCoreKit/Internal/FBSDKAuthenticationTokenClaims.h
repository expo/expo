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

@interface FBSDKAuthenticationTokenClaims : NSObject

/// A unique identifier for the token.
@property (nonatomic, readonly, strong) NSString *jti;

/// Issuer Identifier for the Issuer of the response.
@property (nonatomic, readonly, strong) NSString *iss;

/// Audience(s) that this ID Token is intended for.
@property (nonatomic, readonly, strong) NSString *aud;

/// String value used to associate a Client session with an ID Token, and to mitigate replay attacks.
@property (nonatomic, readonly, strong) NSString *nonce;

/// Expiration time on or after which the ID Token MUST NOT be accepted for processing.
@property (nonatomic, readonly, assign) long exp;

/// Time at which the JWT was issued.
@property (nonatomic, readonly, assign) long iat;

/// Subject - Identifier for the End-User at the Issuer.
@property (nonatomic, readonly, strong) NSString *sub;

/// End-User's full name in displayable form including all name parts.
@property (nullable, nonatomic, readonly, strong) NSString *name;

/// End-User's preferred e-mail address.
@property (nullable, nonatomic, readonly, strong) NSString *email;

/// URL of the End-User's profile picture.
@property (nullable, nonatomic, readonly, strong) NSString *picture;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 Returns a new instance, when one can be created from the parameters given, otherwise `nil`.
 @param encodedClaims Base64-encoded string of the claims.
 @param nonce The expected nonce string.
 */
+ (nullable FBSDKAuthenticationTokenClaims *)validatedClaimsWithEncodedString:(NSString *)encodedClaims nonce:(NSString *)nonce;

@end

NS_ASSUME_NONNULL_END
