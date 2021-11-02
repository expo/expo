// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXServerRegistrationModule.h>

// noop (used by code transform to ensure the versioning isn't applied)
#define EX_UNVERSIONED(symbol) symbol

static NSString * const kEXDeviceInstallationUUIDKey = EX_UNVERSIONED(@"EXDeviceInstallationUUIDKey");
static NSString * const kEXDeviceInstallationUUIDLegacyKey = EX_UNVERSIONED(@"EXDeviceInstallUUIDKey");

static NSString * const kEXRegistrationInfoKey = EX_UNVERSIONED(@"EXNotificationRegistrationInfoKey");

@implementation EXServerRegistrationModule

EX_EXPORT_MODULE(NotificationsServerRegistrationModule)

EX_EXPORT_METHOD_AS(getInstallationIdAsync,
                    getInstallationIdAsyncWithResolver:(EXPromiseResolveBlock)resolve
                                              rejecter:(EXPromiseRejectBlock)reject)
{
  resolve([self getInstallationId]);
}

- (NSString *)getInstallationId
{
  NSString *installationId = [self fetchInstallationId];
  if (installationId) {
    return installationId;
  }
  
  installationId = [[NSUUID UUID] UUIDString];
  [self setInstallationId:installationId error:NULL];
  return installationId;
}

- (nullable NSString *)fetchInstallationId
{
  NSString *installationId;
  CFTypeRef keychainResult = NULL;
  
  if (SecItemCopyMatching((__bridge CFDictionaryRef)[self installationIdGetQuery], &keychainResult) == noErr) {
    NSData *result = (__bridge_transfer NSData *)keychainResult;
    NSString *value = [[NSString alloc] initWithData:result
                                            encoding:NSUTF8StringEncoding];
    // `initWithUUIDString` returns nil if string is not a valid UUID
    if ([[NSUUID alloc] initWithUUIDString:value]) {
      installationId = value;
    }
  }
  
  if (installationId) {
    return installationId;
  }
  
  NSString *legacyUUID = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallationUUIDLegacyKey];
  if (legacyUUID) {
    installationId = legacyUUID;

    NSError *error = nil;
    if ([self setInstallationId:installationId error:&error]) {
      // We only remove the value from old storage once it's set and saved in the new storage.
      [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXDeviceInstallationUUIDLegacyKey];
    } else {
      NSLog(@"Could not migrate device installation UUID from legacy storage: %@", error.description);
    }
  }
  
  return installationId;
}

- (BOOL)setInstallationId:(NSString *)installationId error:(NSError **)error
{
  // Delete existing UUID so we don't need to handle "duplicate item" error
  SecItemDelete((__bridge CFDictionaryRef)[self installationIdSearchQuery]);
  
  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)[self installationIdSetQuery:installationId], NULL);
  if (status != errSecSuccess && error) {
    *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
  }
  return status == errSecSuccess;
}

# pragma mark - Keychain dictionaries

- (NSDictionary *)keychainSearchQueryFor:(NSString *)key merging:(NSDictionary *)dictionaryToMerge
{
  NSData *encodedKey = [key dataUsingEncoding:NSUTF8StringEncoding];
  NSMutableDictionary *query = [NSMutableDictionary dictionaryWithDictionary:@{
    (__bridge id)kSecClass:(__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService:[NSBundle mainBundle].bundleIdentifier,
    (__bridge id)kSecAttrGeneric:encodedKey,
    (__bridge id)kSecAttrAccount:encodedKey
  }];
  [query addEntriesFromDictionary:dictionaryToMerge];
  return query;
}

# pragma mark Installation ID

- (NSDictionary *)installationIdSearchQueryMerging:(NSDictionary *)dictionaryToMerge
{
  return [self keychainSearchQueryFor:kEXDeviceInstallationUUIDKey merging:dictionaryToMerge];
}

- (NSDictionary *)installationIdSearchQuery
{
  return [self installationIdSearchQueryMerging:@{}];
}

- (NSDictionary *)installationIdGetQuery
{
  return [self installationIdSearchQueryMerging:@{
    (__bridge id)kSecMatchLimit:(__bridge id)kSecMatchLimitOne,
    (__bridge id)kSecReturnData:(__bridge id)kCFBooleanTrue
  }];
}

- (NSDictionary *)installationIdSetQuery:(NSString *)deviceInstallationUUID
{
  return [self installationIdSearchQueryMerging:@{
    (__bridge id)kSecValueData:[deviceInstallationUUID dataUsingEncoding:NSUTF8StringEncoding],
    (__bridge id)kSecAttrAccessible:(__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
  }];
}

# pragma mark Registration information

- (NSDictionary *)registrationSearchQueryMerging:(NSDictionary *)dictionaryToMerge
{
  return [self keychainSearchQueryFor:kEXRegistrationInfoKey merging:dictionaryToMerge];
}

- (NSDictionary *)registrationSearchQuery
{
  return [self registrationSearchQueryMerging:@{}];
}

- (NSDictionary *)registrationGetQuery
{
  return [self registrationSearchQueryMerging:@{
    (__bridge id)kSecMatchLimit:(__bridge id)kSecMatchLimitOne,
    (__bridge id)kSecReturnData:(__bridge id)kCFBooleanTrue
  }];
}

- (NSDictionary *)registrationSetQuery:(NSString *)registration
{
  return [self registrationSearchQueryMerging:@{
    (__bridge id)kSecValueData:[registration dataUsingEncoding:NSUTF8StringEncoding],
    (__bridge id)kSecAttrAccessible:(__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
  }];
}

EX_EXPORT_METHOD_AS(getRegistrationInfoAsync,
                    getRegistrationInfoAsyncWithResolver:(EXPromiseResolveBlock)resolve
                                                rejecter:(EXPromiseRejectBlock)reject)
{
  CFTypeRef keychainResult = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)[self registrationGetQuery], &keychainResult);
  if (status == noErr) {
    NSData *result = (__bridge_transfer NSData *)keychainResult;
    NSString *value = [[NSString alloc] initWithData:result
                                            encoding:NSUTF8StringEncoding];
    resolve(value);
  } else if (status == errSecItemNotFound) {
    resolve(nil);
  } else {
    NSError *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
    reject(@"ERR_NOTIFICATIONS_KEYCHAIN_ACCESS", @"Could not fetch registration information from keychain.", error);
  }
}

EX_EXPORT_METHOD_AS(setRegistrationInfoAsync,
                    setRegistrationInfoAsync:(NSString *)registrationInfo
                                    resolver:(EXPromiseResolveBlock)resolve
                                    rejecter:(EXPromiseRejectBlock)reject)
{
  // Delete existing registration so we don't need to handle "duplicate item" error
  SecItemDelete((__bridge CFDictionaryRef)[self registrationSearchQuery]);
  
  if (registrationInfo) {
    OSStatus status = SecItemAdd((__bridge CFDictionaryRef)[self registrationSetQuery:registrationInfo], NULL);
    if (status == errSecSuccess) {
      resolve(nil);
    } else {
      NSError *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
      reject(@"ERR_NOTIFICATIONS_KEYCHAIN_ACCESS", @"Could not save registration information into keychain.", error);
    }
  } else {
    resolve(nil);
  }
}

@end
