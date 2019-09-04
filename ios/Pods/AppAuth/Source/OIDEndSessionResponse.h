/*! @file OIDEndSessionResponse.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2017 The AppAuth Authors. All Rights Reserved.
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

@class OIDEndSessionRequest;

NS_ASSUME_NONNULL_BEGIN

/*! @brief Represents the response to an End Session request.
    @see http://openid.net/specs/openid-connect-session-1_0.html#RPLogout
 */

@interface OIDEndSessionResponse : NSObject <NSCopying, NSSecureCoding>

/*! @brief The request which was serviced.
 */
@property(nonatomic, readonly) OIDEndSessionRequest *request;

/*! @brief REQUIRED if the "state" parameter was present in the client end-session request. The
        exact value received from the client.
    @remarks state
 */
@property(nonatomic, readonly, nullable) NSString *state;

/*! @brief Additional parameters returned from the end session endpoint.
 */
@property(nonatomic, readonly, nullable)
    NSDictionary<NSString *, NSObject<NSCopying> *> *additionalParameters;

/*! @internal
    @brief Unavailable. Please use initWithParameters:.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Designated initializer.
    @param request The serviced request.
    @param parameters The decoded parameters returned from the End Session Endpoint.
    @remarks Known parameters are extracted from the @c parameters parameter and the normative
        properties are populated. Non-normative parameters are placed in the
        @c #additionalParameters dictionary.
 */
- (instancetype)initWithRequest:(OIDEndSessionRequest *)request
                     parameters:(NSDictionary<NSString *, NSObject<NSCopying> *> *)parameters
    NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
