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

@class FBLPromise<ValueType>;

NS_ASSUME_NONNULL_BEGIN

/// The class provides a convenient abstraction on top of the iOS Keychain API to save data.
@interface GULKeychainStorage : NSObject

- (instancetype)init NS_UNAVAILABLE;

/** Initializes the keychain storage with Keychain Service name.
 *  @param service A Keychain Service name that will be used to store and retrieve objects. See also
 * `kSecAttrService`.
 */
- (instancetype)initWithService:(NSString *)service;

/**
 * Get an object by key.
 * @param key The key.
 * @param objectClass The expected object class required by `NSSecureCoding`.
 * @param accessGroup The Keychain Access Group.
 *
 * @return Returns a promise. It is resolved with an object stored by key if exists. It is resolved
 * with `nil` when the object not found. It fails on a Keychain error.
 */
- (FBLPromise<id<NSSecureCoding>> *)getObjectForKey:(NSString *)key
                                        objectClass:(Class)objectClass
                                        accessGroup:(nullable NSString *)accessGroup;

/**
 * Saves the given object by the given key.
 * @param object The object to store.
 * @param key The key to store the object. If there is an existing object by the key, it will be
 * overridden.
 * @param accessGroup The Keychain Access Group.
 *
 * @return Returns which is resolved with `[NSNull null]` on success.
 */
- (FBLPromise<NSNull *> *)setObject:(id<NSSecureCoding>)object
                             forKey:(NSString *)key
                        accessGroup:(nullable NSString *)accessGroup;

/**
 * Removes the object by the given key.
 * @param key The key to store the object. If there is an existing object by the key, it will be
 * overridden.
 * @param accessGroup The Keychain Access Group.
 *
 * @return Returns which is resolved with `[NSNull null]` on success.
 */
- (FBLPromise<NSNull *> *)removeObjectForKey:(NSString *)key
                                 accessGroup:(nullable NSString *)accessGroup;

#if TARGET_OS_OSX
/// If not `nil`, then only this keychain will be used to save and read data (see
/// `kSecMatchSearchList` and `kSecUseKeychain`. It is mostly intended to be used by unit tests.
@property(nonatomic, nullable) SecKeychainRef keychainRef;
#endif  // TARGET_OSX

@end

NS_ASSUME_NONNULL_END
