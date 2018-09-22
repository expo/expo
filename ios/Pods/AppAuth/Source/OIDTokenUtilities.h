/*! @file OIDTokenUtilities.h
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

NS_ASSUME_NONNULL_BEGIN

/*! @brief Provides data encoding/decoding methods, random string generators, etc.
 */
@interface OIDTokenUtilities : NSObject

/*! @internal
    @brief Unavailable. This class should not be initialized.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Base64url-nopadding encodes the given data.
    @param data The input data.
    @return The base64url encoded data as a NSString.
    @discussion Base64url-nopadding is used in several identity specs such as PKCE and
        OpenID Connect.
 */
+ (NSString *)encodeBase64urlNoPadding:(NSData *)data;

/*! @brief Generates a URL-safe string of random data.
    @param size The number of random bytes to encode. NB. the length of the output string will be
        greater than the number of random bytes, due to the URL-safe encoding.
    @return Random data encoded with base64url.
 */
+ (nullable NSString *)randomURLSafeStringWithSize:(NSUInteger)size;

/*! @brief SHA256 hashes the input string.
    @param inputString The input string.
    @return The SHA256 data.
 */
+ (NSData *)sha265:(NSString *)inputString;

@end

NS_ASSUME_NONNULL_END
