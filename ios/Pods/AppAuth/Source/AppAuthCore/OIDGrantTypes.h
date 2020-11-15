/*! @file OIDGrantTypes.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2015 Google Inc. All Rights Reserved.
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

/*! @brief For exchanging an authorization code for an access token.
    @see https://tools.ietf.org/html/rfc6749#section-4.1.3
 */
extern NSString *const OIDGrantTypeAuthorizationCode;

/*! @brief For refreshing an access token with a refresh token.
    @see https://tools.ietf.org/html/rfc6749#section-6
 */
extern NSString *const OIDGrantTypeRefreshToken;

/*! @brief For obtaining an access token with a username and password.
    @see https://tools.ietf.org/html/rfc6749#section-4.3.2
 */
extern NSString *const OIDGrantTypePassword;

/*! @brief For obtaining an access token from the token endpoint using client credentials.
    @see https://tools.ietf.org/html/rfc6749#section-3.2.1
    @see https://tools.ietf.org/html/rfc6749#section-4.4.2
 */
extern NSString *const OIDGrantTypeClientCredentials;
