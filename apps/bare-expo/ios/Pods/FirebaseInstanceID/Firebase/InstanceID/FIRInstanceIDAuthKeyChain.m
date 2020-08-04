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

#import "FIRInstanceIDAuthKeyChain.h"
#import "FIRInstanceIDKeychain.h"
#import "FIRInstanceIDLogger.h"

/**
 *  The error type representing why we couldn't read data from the keychain.
 */
typedef NS_ENUM(int, FIRInstanceIDKeychainErrorType) {
  kFIRInstanceIDKeychainErrorBadArguments = -1301,
};

NSString *const kFIRInstanceIDKeychainWildcardIdentifier = @"*";

@interface FIRInstanceIDAuthKeychain ()

@property(nonatomic, copy) NSString *generic;
// cachedKeychainData is keyed by service and account, the value is an array of NSData.
// It is used to cache the tokens per service, per account, as well as checkin data per service,
// per account inside the keychain.
@property(nonatomic)
    NSMutableDictionary<NSString *, NSMutableDictionary<NSString *, NSArray<NSData *> *> *>
        *cachedKeychainData;

@end

@implementation FIRInstanceIDAuthKeychain

- (instancetype)initWithIdentifier:(NSString *)identifier {
  self = [super init];
  if (self) {
    _generic = [identifier copy];
    _cachedKeychainData = [[NSMutableDictionary alloc] init];
  }
  return self;
}

+ (NSMutableDictionary *)keychainQueryForService:(NSString *)service
                                         account:(NSString *)account
                                         generic:(NSString *)generic {
  NSDictionary *query = @{(__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword};

  NSMutableDictionary *finalQuery = [NSMutableDictionary dictionaryWithDictionary:query];
  if ([generic length] && ![kFIRInstanceIDKeychainWildcardIdentifier isEqualToString:generic]) {
    finalQuery[(__bridge NSString *)kSecAttrGeneric] = generic;
  }
  if ([account length] && ![kFIRInstanceIDKeychainWildcardIdentifier isEqualToString:account]) {
    finalQuery[(__bridge NSString *)kSecAttrAccount] = account;
  }
  if ([service length] && ![kFIRInstanceIDKeychainWildcardIdentifier isEqualToString:service]) {
    finalQuery[(__bridge NSString *)kSecAttrService] = service;
  }
  return finalQuery;
}

- (NSMutableDictionary *)keychainQueryForService:(NSString *)service account:(NSString *)account {
  return [[self class] keychainQueryForService:service account:account generic:self.generic];
}

- (NSArray<NSData *> *)itemsMatchingService:(NSString *)service account:(NSString *)account {
  // If query wildcard service, it asks for all the results, which always query from keychain.
  if (![service isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier] &&
      ![account isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier] &&
      _cachedKeychainData[service][account]) {
    // As long as service, account array exist, even it's empty, it means we've queried it before,
    // returns the cache value.
    return _cachedKeychainData[service][account];
  }

  NSMutableDictionary *keychainQuery = [self keychainQueryForService:service account:account];
  NSMutableArray<NSData *> *results;
  keychainQuery[(__bridge id)kSecReturnData] = (__bridge id)kCFBooleanTrue;
#if TARGET_OS_IOS || TARGET_OS_TV
  keychainQuery[(__bridge id)kSecReturnAttributes] = (__bridge id)kCFBooleanTrue;
  keychainQuery[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitAll;
  // FIRInstanceIDKeychain should only take a query and return a result, will handle the query here.
  NSArray *passwordInfos =
      CFBridgingRelease([[FIRInstanceIDKeychain sharedInstance] itemWithQuery:keychainQuery]);
#elif TARGET_OS_OSX
  keychainQuery[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;
  NSData *passwordInfos =
      CFBridgingRelease([[FIRInstanceIDKeychain sharedInstance] itemWithQuery:keychainQuery]);
#endif

  if (!passwordInfos) {
    // Nothing was found, simply return from this sync block.
    // Make sure to label the cache entry empty, signaling that we've queried this entry.
    if ([service isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier] ||
        [account isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier]) {
      // Do not update cache if it's wildcard query.
      return @[];
    } else if (_cachedKeychainData[service]) {
      [_cachedKeychainData[service] setObject:@[] forKey:account];
    } else {
      [_cachedKeychainData setObject:[@{account : @[]} mutableCopy] forKey:service];
    }
    return @[];
  }
  results = [[NSMutableArray alloc] init];
#if TARGET_OS_IOS || TARGET_OS_TV
  NSInteger numPasswords = passwordInfos.count;
  for (NSUInteger i = 0; i < numPasswords; i++) {
    NSDictionary *passwordInfo = [passwordInfos objectAtIndex:i];
    if (passwordInfo[(__bridge id)kSecValueData]) {
      [results addObject:passwordInfo[(__bridge id)kSecValueData]];
    }
  }
#elif TARGET_OS_OSX
  [results addObject:passwordInfos];
#endif
  // We query the keychain because it didn't exist in cache, now query is done, update the result in
  // the cache.
  if ([service isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier] ||
      [account isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier]) {
    // Do not update cache if it's wildcard query.
    return [results copy];
  } else if (_cachedKeychainData[service]) {
    [_cachedKeychainData[service] setObject:[results copy] forKey:account];
  } else {
    NSMutableDictionary *entry = [@{account : [results copy]} mutableCopy];
    [_cachedKeychainData setObject:entry forKey:service];
  }
  return [results copy];
}

- (NSData *)dataForService:(NSString *)service account:(NSString *)account {
  NSArray<NSData *> *items = [self itemsMatchingService:service account:account];
  // If items is nil or empty, nil will be returned.
  return items.firstObject;
}

- (void)removeItemsMatchingService:(NSString *)service
                           account:(NSString *)account
                           handler:(void (^)(NSError *error))handler {
  if ([service isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier]) {
    // Delete all keychain items.
    _cachedKeychainData = [[NSMutableDictionary alloc] init];
  } else if ([account isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier]) {
    // Delete all entries under service,
    if (_cachedKeychainData[service]) {
      _cachedKeychainData[service] = [[NSMutableDictionary alloc] init];
    }
  } else if (_cachedKeychainData[service]) {
    // We should keep the service/account entry instead of nil so we know
    // it's "empty entry" instead of "not query from keychain yet".
    [_cachedKeychainData[service] setObject:@[] forKey:account];
  } else {
    [_cachedKeychainData setObject:[@{account : @[]} mutableCopy] forKey:service];
  }
  NSMutableDictionary *keychainQuery = [self keychainQueryForService:service account:account];
  [[FIRInstanceIDKeychain sharedInstance] removeItemWithQuery:keychainQuery handler:handler];
}

- (void)setData:(NSData *)data
     forService:(NSString *)service
        account:(NSString *)account
        handler:(void (^)(NSError *))handler {
  if ([service isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier] ||
      [account isEqualToString:kFIRInstanceIDKeychainWildcardIdentifier]) {
    if (handler) {
      handler([NSError errorWithDomain:kFIRInstanceIDKeychainErrorDomain
                                  code:kFIRInstanceIDKeychainErrorBadArguments
                              userInfo:nil]);
    }
    return;
  }
  [self removeItemsMatchingService:service
                           account:account
                           handler:^(NSError *error) {
                             if (error) {
                               if (handler) {
                                 handler(error);
                               }
                               return;
                             }
                             if (data.length > 0) {
                               NSMutableDictionary *keychainQuery =
                                   [self keychainQueryForService:service account:account];
                               keychainQuery[(__bridge id)kSecValueData] = data;

                               keychainQuery[(__bridge id)kSecAttrAccessible] =
                                   (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
                               [[FIRInstanceIDKeychain sharedInstance]
                                   addItemWithQuery:keychainQuery
                                            handler:handler];
                             }
                           }];
  // Set the cache value. This must happen after removeItemsMatchingService:account:handler was
  // called, so the cache value was reset before setting a new value.
  if (_cachedKeychainData[service]) {
    if (_cachedKeychainData[service][account]) {
      _cachedKeychainData[service][account] = @[ data ];
    } else {
      [_cachedKeychainData[service] setObject:@[ data ] forKey:account];
    }
  } else {
    [_cachedKeychainData setObject:[@{account : @[ data ]} mutableCopy] forKey:service];
  }
}

@end
