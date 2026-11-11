// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXConstants/EXConstantsInstallationIdProvider.h>

static NSString * const kEXDeviceInstallationUUIDKey = @"EXDeviceInstallationUUIDKey";
static NSString * const kEXDeviceInstallationUUIDLegacyKey = @"EXDeviceInstallUUIDKey";

@implementation EXConstantsInstallationIdProvider

- (NSString *)getOrCreateInstallationId
{
#if TARGET_OS_IOS || TARGET_OS_TV
  NSString *installationId = [self getInstallationId];
  if (installationId) {
    return installationId;
  }
  
  installationId = [[NSUUID UUID] UUIDString];
  [self setInstallationId:installationId error:NULL];
  return installationId;
#elif TARGET_OS_OSX
  return nil;
#endif
}

- (nullable NSString *)getInstallationId
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
  // Uses required reason API based on the following reason: CA92.1
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

- (NSDictionary *)installationIdSearchQueryMerging:(NSDictionary *)dictionaryToMerge
{
  NSData *encodedKey = [kEXDeviceInstallationUUIDKey dataUsingEncoding:NSUTF8StringEncoding];
  NSMutableDictionary *query = [NSMutableDictionary dictionaryWithDictionary:@{
    (__bridge id)kSecClass:(__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService:[NSBundle mainBundle].bundleIdentifier,
    (__bridge id)kSecAttrGeneric:encodedKey,
    (__bridge id)kSecAttrAccount:encodedKey
  }];
  [query addEntriesFromDictionary:dictionaryToMerge];
  return query;
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

@end
