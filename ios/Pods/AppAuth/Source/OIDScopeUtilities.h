/*! @file OIDScopeUtilities.h
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

/*! @brief Provides convenience methods for dealing with scope strings.
 */
@interface OIDScopeUtilities : NSObject

/*! @internal
    @brief Unavailable. This class should not be initialized.
 */
- (instancetype)init NS_UNAVAILABLE;

/*! @brief Converts an array of scope strings to a single scope string per the OAuth 2 spec.
    @param scopes An array of scope strings.
    @return A space-delimited string of scopes.
    @see https://tools.ietf.org/html/rfc6749#section-3.3
 */
+ (NSString *)scopesWithArray:(NSArray<NSString *> *)scopes;

/*! @brief Converts an OAuth 2 spec-compliant scope string to an array of scopes.
    @param scopes An OAuth 2 spec-compliant scope string.
    @return An array of scope strings.
    @see https://tools.ietf.org/html/rfc6749#section-3.3
 */
+ (NSArray<NSString *> *)scopesArrayWithString:(NSString *)scopes;

@end

NS_ASSUME_NONNULL_END
