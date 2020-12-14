/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *const kGULKeychainUtilsErrorDomain;

/// Helper functions to access Keychain.
@interface GULKeychainUtils : NSObject

/** Fetches a keychain item data matching to the provided query.
 *  @param query A dictionary with Keychain query parameters. See docs for `SecItemCopyMatching` for
 * details.
 *  @param outError A pointer to `NSError` instance or `NULL`. The instance at `outError` will be
 * assigned with an error if there is.
 *  @returns Data for the first Keychain Item matching the provided query or `nil` if there is not
 * such an item (`outError` will be `nil` in this case) or an error occurred.
 */
+ (nullable NSData *)getItemWithQuery:(NSDictionary *)query
                                error:(NSError *_Nullable *_Nullable)outError;

/** Stores data to a Keychain Item matching to the provided query. An existing Keychain Item
 * matching the query parameters will be updated or a new will be created.
 *  @param item A Keychain Item data to store.
 *  @param query A dictionary with Keychain query parameters. See docs for `SecItemAdd` and
 * `SecItemUpdate` for details.
 *  @param outError A pointer to `NSError` instance or `NULL`. The instance at `outError` will be
 * assigned with an error if there is.
 *  @returns `YES` when data was successfully stored, `NO` otherwise.
 */
+ (BOOL)setItem:(NSData *)item
      withQuery:(NSDictionary *)query
          error:(NSError *_Nullable *_Nullable)outError;

/** Removes a Keychain Item matching to the provided query.
 *  @param query A dictionary with Keychain query parameters. See docs for `SecItemDelete` for
 * details.
 *  @param outError A pointer to `NSError` instance or `NULL`. The instance at `outError` will be
 * assigned with an error if there is.
 *  @returns `YES` if the item was removed successfully or doesn't exist, `NO` otherwise.
 */
+ (BOOL)removeItemWithQuery:(NSDictionary *)query error:(NSError *_Nullable *_Nullable)outError;

@end

NS_ASSUME_NONNULL_END
