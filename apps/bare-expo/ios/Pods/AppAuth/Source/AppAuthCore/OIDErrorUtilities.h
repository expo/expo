/*! @file OIDErrorUtilities.h
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

#import "OIDError.h"

NS_ASSUME_NONNULL_BEGIN

/*! @brief Convenience methods for creating standardized \NSError instances.
 */
@interface OIDErrorUtilities : NSObject

/*! @brief Creates a standard \NSError from an @c ::OIDErrorCode and custom user info.
        Automatically populates the localized error description.
    @param code The error code.
    @param underlyingError The underlying error which occurred, if applicable.
    @param description A custom description, if applicable.
    @return An \NSError representing the error code.
 */
+ (NSError *)errorWithCode:(OIDErrorCode)code
           underlyingError:(nullable NSError *)underlyingError
               description:(nullable NSString *)description;

/*! @brief Creates a standard \NSError from an @c ::OIDErrorCode and custom user info.
        Automatically populates the localized error description.
    @param OAuthErrorDomain The OAuth error domain. Must be @c ::OIDOAuthAuthorizationErrorDomain or
        @c ::OIDOAuthTokenErrorDomain.
    @param errorResponse The dictionary from an OAuth error response (as per RFC6749 Section 5.2).
    @param underlyingError The underlying error which occurred, if applicable.
    @return An \NSError representing the OAuth error.
    @see https://tools.ietf.org/html/rfc6749#section-5.2
 */
+ (NSError *)OAuthErrorWithDomain:(NSString *)OAuthErrorDomain
                    OAuthResponse:(NSDictionary *)errorResponse
                  underlyingError:(nullable NSError *)underlyingError;

/*! @brief Creates a \NSError indicating that the resource server responded with an authorization
        error.
    @param code Your error code.
    @param errorResponse The resource server error response, if any.
    @param underlyingError The underlying error which occurred, if applicable.
    @return An \NSError representing the authorization error from the resource server.
 */
+ (NSError *)resourceServerAuthorizationErrorWithCode:(NSInteger)code
                                        errorResponse:(nullable NSDictionary *)errorResponse
                                      underlyingError:(nullable NSError *)underlyingError;


/*! @brief Creates a standard \NSError from an \NSHTTPURLResponse. Automatically
        populates the localized error description with the response data associated with the
        \NSHTTPURLResponse, if available.
    @param HTTPURLResponse The response which indicates an error occurred.
    @param data The response data associated with the response which should be converted to an
        @c NSString assuming a UTF-8 encoding, if available.
    @return An \NSError representing the error.
 */
+ (NSError *)HTTPErrorWithHTTPResponse:(NSHTTPURLResponse *)HTTPURLResponse
                                  data:(nullable NSData *)data;

/*! @brief Raises an exception with the given name as both the name, and the message.
    @param name The name of the exception.
 */
+ (void)raiseException:(NSString *)name;

/*! @brief Raises an exception with the given name and message.
    @param name The name of the exception.
    @param message The message of the exception.
 */
+ (void)raiseException:(NSString *)name message:(NSString *)message;

/*! @brief Converts an OAuth error code into an @c ::OIDErrorCodeOAuth error code.
    @param errorCode The OAuth error code.
    @discussion Returns @c ::OIDErrorCodeOAuthOther if the string is not in AppAuth's list.
    @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
    @see https://tools.ietf.org/html/rfc6749#section-5.2
 */
+ (OIDErrorCodeOAuth)OAuthErrorCodeFromString:(NSString *)errorCode;

/*! @brief Returns true if the given error domain is an OAuth error domain.
    @param errorDomain The error domain to test.
    @discussion An OAuth error domain is used for errors returned per RFC6749 sections 4.1.2.1 and
        5.2. Other errors, such as network errors can also occur but they will not have an OAuth
        error domain.
    @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
    @see https://tools.ietf.org/html/rfc6749#section-5.2
 */
+ (BOOL)isOAuthErrorDomain:(NSString*)errorDomain;

@end

NS_ASSUME_NONNULL_END
