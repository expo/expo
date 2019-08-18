/*! @file OIDIDToken.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2017 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/*! @brief A convenience class that parses an ID Token and extracts the claims _but does not_
           verify its signature. AppAuth only supports the OpenID Code flow, meaning ID Tokens
           received by AppAuth are sent from the token endpoint on a TLS protected channel,
           offering some assurances as to the origin of the token. You may wish to additionally
           verify the ID Token signature using a JWT signature verification library of your
           choosing.
    @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
    @see https://tools.ietf.org/html/rfc7519
    @see https://jwt.io/
 */
@interface OIDIDToken : NSObject {
  // property variables
  NSDictionary *_header;
  NSDictionary *_claims;
  NSURL *_issuer;
  NSString *_subject;
  NSArray *_audience;
  NSDate *_expiresAt;
  NSDate *_issuedAt;
  NSString *_nonce;
}

/*! @internal
    @brief Unavailable. Please use @c initWithAuthorizationResponse:.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Parses the given ID Token string.
    @param idToken The ID Token spring.
 */
- (nullable instancetype)initWithIDTokenString:(NSString *)idToken;

/*! @brief The header JWT values.
 */
@property(nonatomic, readonly) NSDictionary *header;

/*! @brief All ID Token claims.
 */
@property(nonatomic, readonly) NSDictionary *claims;

/*! @brief Issuer Identifier for the Issuer of the response.
    @remarks iss
    @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
@property(nonatomic, readonly) NSURL *issuer;

/*! @brief Subject Identifier.
    @remarks sub
    @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
@property(nonatomic, readonly) NSString *subject;

/*! @brief Audience(s) that this ID Token is intended for.
    @remarks aud
    @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
@property(nonatomic, readonly) NSArray *audience;

/*! @brief Expiration time on or after which the ID Token MUST NOT be accepted for processing.
    @remarks exp
    @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
@property(nonatomic, readonly) NSDate *expiresAt;

/*! @brief Time at which the JWT was issued.
    @remarks iat
    @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
@property(nonatomic, readonly) NSDate *issuedAt;

/*! @brief String value used to associate a Client session with an ID Token, and to mitigate replay
        attacks.
    @remarks nonce
    @see http://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
@property(nonatomic, readonly, nullable) NSString *nonce;

@end

NS_ASSUME_NONNULL_END
