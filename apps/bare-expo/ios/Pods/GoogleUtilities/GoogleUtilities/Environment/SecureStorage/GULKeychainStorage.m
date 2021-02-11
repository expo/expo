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

#import "GoogleUtilities/Environment/Private/GULKeychainStorage.h"
#import <Security/Security.h>

#if __has_include(<FBLPromises/FBLPromises.h>)
#import <FBLPromises/FBLPromises.h>
#else
#import "FBLPromises.h"
#endif

#import "GoogleUtilities/Environment/Private/GULKeychainUtils.h"
#import "GoogleUtilities/Environment/Private/GULSecureCoding.h"

@interface GULKeychainStorage ()
@property(nonatomic, readonly) dispatch_queue_t keychainQueue;
@property(nonatomic, readonly) dispatch_queue_t inMemoryCacheQueue;
@property(nonatomic, readonly) NSString *service;
@property(nonatomic, readonly) NSCache<NSString *, id<NSSecureCoding>> *inMemoryCache;
@end

@implementation GULKeychainStorage

- (instancetype)initWithService:(NSString *)service {
  NSCache *cache = [[NSCache alloc] init];
  // Cache up to 5 installations.
  cache.countLimit = 5;
  return [self initWithService:service cache:cache];
}

- (instancetype)initWithService:(NSString *)service cache:(NSCache *)cache {
  self = [super init];
  if (self) {
    _keychainQueue =
        dispatch_queue_create("com.gul.KeychainStorage.Keychain", DISPATCH_QUEUE_SERIAL);
    _inMemoryCacheQueue =
        dispatch_queue_create("com.gul.KeychainStorage.InMemoryCache", DISPATCH_QUEUE_SERIAL);
    _service = [service copy];
    _inMemoryCache = cache;
  }
  return self;
}

#pragma mark - Public

- (FBLPromise<id<NSSecureCoding>> *)getObjectForKey:(NSString *)key
                                        objectClass:(Class)objectClass
                                        accessGroup:(nullable NSString *)accessGroup {
  return [FBLPromise onQueue:self.inMemoryCacheQueue
                          do:^id _Nullable {
                            // Return cached object or fail otherwise.
                            id object = [self.inMemoryCache objectForKey:key];
                            return object
                                       ?: [[NSError alloc]
                                              initWithDomain:FBLPromiseErrorDomain
                                                        code:FBLPromiseErrorCodeValidationFailure
                                                    userInfo:nil];
                          }]
      .recover(^id _Nullable(NSError *error) {
        // Look for the object in the keychain.
        return [self getObjectFromKeychainForKey:key
                                     objectClass:objectClass
                                     accessGroup:accessGroup];
      });
}

- (FBLPromise<NSNull *> *)setObject:(id<NSSecureCoding>)object
                             forKey:(NSString *)key
                        accessGroup:(nullable NSString *)accessGroup {
  return [FBLPromise onQueue:self.inMemoryCacheQueue
                          do:^id _Nullable {
                            // Save to the in-memory cache first.
                            [self.inMemoryCache setObject:object forKey:[key copy]];
                            return [NSNull null];
                          }]
      .thenOn(self.keychainQueue, ^id(id result) {
        // Then store the object to the keychain.
        NSDictionary *query = [self keychainQueryWithKey:key accessGroup:accessGroup];
        NSError *error;
        NSData *encodedObject = [GULSecureCoding archivedDataWithRootObject:object error:&error];
        if (!encodedObject) {
          return error;
        }

        if (![GULKeychainUtils setItem:encodedObject withQuery:query error:&error]) {
          return error;
        }

        return [NSNull null];
      });
}

- (FBLPromise<NSNull *> *)removeObjectForKey:(NSString *)key
                                 accessGroup:(nullable NSString *)accessGroup {
  return [FBLPromise onQueue:self.inMemoryCacheQueue
                          do:^id _Nullable {
                            [self.inMemoryCache removeObjectForKey:key];
                            return nil;
                          }]
      .thenOn(self.keychainQueue, ^id(id result) {
        NSDictionary *query = [self keychainQueryWithKey:key accessGroup:accessGroup];

        NSError *error;
        if (![GULKeychainUtils removeItemWithQuery:query error:&error]) {
          return error;
        }

        return [NSNull null];
      });
}

#pragma mark - Private

- (FBLPromise<id<NSSecureCoding>> *)getObjectFromKeychainForKey:(NSString *)key
                                                    objectClass:(Class)objectClass
                                                    accessGroup:(nullable NSString *)accessGroup {
  // Look for the object in the keychain.
  return [FBLPromise
             onQueue:self.keychainQueue
                  do:^id {
                    NSDictionary *query = [self keychainQueryWithKey:key accessGroup:accessGroup];
                    NSError *error;
                    NSData *encodedObject = [GULKeychainUtils getItemWithQuery:query error:&error];

                    if (error) {
                      return error;
                    }
                    if (!encodedObject) {
                      return nil;
                    }
                    id object = [GULSecureCoding unarchivedObjectOfClass:objectClass
                                                                fromData:encodedObject
                                                                   error:&error];
                    if (error) {
                      return error;
                    }

                    return object;
                  }]
      .thenOn(self.inMemoryCacheQueue,
              ^id<NSSecureCoding> _Nullable(id<NSSecureCoding> _Nullable object) {
                // Save object to the in-memory cache if exists and return the object.
                if (object) {
                  [self.inMemoryCache setObject:object forKey:[key copy]];
                }
                return object;
              });
}

- (void)resetInMemoryCache {
  [self.inMemoryCache removeAllObjects];
}

#pragma mark - Keychain

- (NSMutableDictionary<NSString *, id> *)keychainQueryWithKey:(NSString *)key
                                                  accessGroup:(nullable NSString *)accessGroup {
  NSMutableDictionary<NSString *, id> *query = [NSMutableDictionary dictionary];

  query[(__bridge NSString *)kSecClass] = (__bridge NSString *)kSecClassGenericPassword;
  query[(__bridge NSString *)kSecAttrService] = self.service;
  query[(__bridge NSString *)kSecAttrAccount] = key;

  if (accessGroup) {
    query[(__bridge NSString *)kSecAttrAccessGroup] = accessGroup;
  }

#if TARGET_OS_OSX
  if (self.keychainRef) {
    query[(__bridge NSString *)kSecUseKeychain] = (__bridge id)(self.keychainRef);
    query[(__bridge NSString *)kSecMatchSearchList] = @[ (__bridge id)(self.keychainRef) ];
  }
#endif  // TARGET_OSX

  return query;
}

@end
