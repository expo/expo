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

extern NSString *__nonnull const kFIRInstanceIDKeychainWildcardIdentifier;

NS_ASSUME_NONNULL_BEGIN

/**
 *  Wrapper around storing FCM auth data in iOS keychain.
 */
@interface FIRInstanceIDAuthKeychain : NSObject

/**
 *  Designated Initializer. Init a generic `SecClassGenericPassword` keychain with `identifier`
 *  as the `kSecAttrGeneric`.
 *
 *  @param identifier The generic attribute to be used by the keychain.
 *
 *  @return A Keychain object with `kSecAttrGeneric` attribute set to identifier.
 */
- (instancetype)initWithIdentifier:(NSString *)identifier;

/**
 *  Get keychain items matching the given service and account. The service and/or account
 *  can be a wildcard (`kFIRInstanceIDKeychainWildcardIdentifier`), which case the query
 *  will include all items matching any services and/or accounts.
 *
 *  @param service The kSecAttrService used to save the password. Can be wildcard.
 *  @param account The kSecAttrAccount used to save the password. Can be wildcard.
 *
 *  @return An array of |NSData|s matching the provided inputs.
 */
- (NSArray<NSData *> *)itemsMatchingService:(NSString *)service account:(NSString *)account;

/**
 *  Get keychain item for a given service and account.
 *
 *  @param service The kSecAttrService used to save the password.
 *  @param account The kSecAttrAccount used to save the password.
 *
 *  @return A cached keychain item for a given account and service, or nil if it was not
 *          found or could not be retrieved.
 */
- (NSData *)dataForService:(NSString *)service account:(NSString *)account;

/**
 *  Remove the cached items from the keychain matching the service, account and access group.
 *  In case the items do not exist, YES is returned but with a valid error object with code
 *  `errSecItemNotFound`.
 *
 *  @param service The kSecAttrService used to save the password.
 *  @param account The kSecAttrAccount used to save the password.
 *  @param handler The callback handler which is invoked when the remove operation is complete, with
 *                 an error if there is any.
 */
- (void)removeItemsMatchingService:(NSString *)service
                           account:(NSString *)account
                           handler:(nullable void (^)(NSError *error))handler;

/**
 *  Set the data for a given service and account.
 *  We use `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` which
 *  prevents backup and restore to iCloud, and works for app extension that can
 *  execute right after a device is restarted (and not unlocked).
 *
 *  @param data          The data to save.
 *  @param service       The `kSecAttrService` used to save the password.
 *  @param account       The `kSecAttrAccount` used to save the password.
 *  @param handler       The callback handler which is invoked when the add operation is complete,
 *                       with an error if there is any.
 *
 */
- (void)setData:(NSData *)data
     forService:(NSString *)service
        account:(NSString *)account
        handler:(nullable void (^)(NSError *))handler;

@end

NS_ASSUME_NONNULL_END
