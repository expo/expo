/*! @file OIDScopes.h
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

/*! @brief Scope that indicates this request is an OpenID Connect request.
    @see http://openid.net/specs/openid-connect-core-1_0.html#AuthRequestValidation
 */
extern NSString *const OIDScopeOpenID;

/*! @brief This scope value requests access to the End-User's default profile Claims, which are:
        name, family_name, given_name, middle_name, nickname, preferred_username, profile, picture,
        website, gender, birthdate, zoneinfo, locale, and updated_at.
    @see http://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims
 */
extern NSString *const OIDScopeProfile;

/*! @brief This scope value requests access to the email and email_verified Claims.
    @see http://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims
 */
extern NSString *const OIDScopeEmail;

/*! @brief This scope value requests access to the address Claim.
    @see http://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims
 */
extern NSString *const OIDScopeAddress;

/*! @brief This scope value requests access to the phone_number and phone_number_verified Claims.
    @see http://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims
 */
extern NSString *const OIDScopePhone;
