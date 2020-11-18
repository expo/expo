// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel+DeviceInstallationUUID.h"

static NSString * const kEXDeviceInstallationUUIDKey = @"EXDeviceInstallUUIDKey";

@implementation EXKernel (DeviceInstallationUUID)

+ (NSString *)deviceInstallationUUID
{
  NSString *deviceInstallationUUID = [self fetchDeviceInstallationUUID];
  if (deviceInstallationUUID) {
    return deviceInstallationUUID;
  }
  
  deviceInstallationUUID = [[NSUUID UUID] UUIDString];
  [self setDeviceInstallationUUID:deviceInstallationUUID];
  return deviceInstallationUUID;
}

+ (nullable NSString *)fetchDeviceInstallationUUID
{
  NSString *deviceInstallationUUID;
  CFTypeRef keychainResult = NULL;
  
  if (SecItemCopyMatching((__bridge CFDictionaryRef)[self deviceInstallationUUIDGetQuery], &keychainResult) == noErr) {
    NSData *result = (__bridge_transfer NSData *)keychainResult;
    NSString *value = [[NSString alloc] initWithData:result
                                            encoding:NSUTF8StringEncoding];
    // `initWithUUIDString` returns nil if string is not a valid UUID
    if ([[NSUUID alloc] initWithUUIDString:value]) {
      deviceInstallationUUID = value;
    }
  }
  
  if (deviceInstallationUUID) {
    return deviceInstallationUUID;
  }
  
  NSString *legacyUUID = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallationUUIDKey];
  if (legacyUUID) {
    deviceInstallationUUID = legacyUUID;
    
    NSError *error = [self setDeviceInstallationUUID:legacyUUID];
    if (error) {
      DDLogError(@"Could not migrate device installation UUID from legacy storage: %@", error.description);
    } else {
      // We only remove the value from old storage once it's set and saved in the new storage.
      [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXDeviceInstallationUUIDKey];
    }
  }
  
  return deviceInstallationUUID;
}

+ (nullable NSError *)setDeviceInstallationUUID:(NSString *)deviceInstallationUUID
{
  // Delete existing UUID
  SecItemDelete((__bridge CFDictionaryRef)[self deviceInstallationUUIDSearchQuery]);
  
  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)[self deviceInstallationUUIDSetQuery:deviceInstallationUUID], NULL);
  if (status == errSecSuccess) {
    return nil;
  } else {
    return [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
  }
}

# pragma mark - Keychain dictionaries

+ (NSDictionary *)deviceInstallationUUIDSearchQueryMerging:(NSDictionary *)dictionaryToMerge
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

+ (NSDictionary *)deviceInstallationUUIDSearchQuery
{
  return [self deviceInstallationUUIDSearchQueryMerging:@{}];
}

+ (NSDictionary *)deviceInstallationUUIDGetQuery
{
  return [self deviceInstallationUUIDSearchQueryMerging:@{
    (__bridge id)kSecMatchLimit:(__bridge id)kSecMatchLimitOne,
    (__bridge id)kSecReturnData:(__bridge id)kCFBooleanTrue
  }];
}

+ (NSDictionary *)deviceInstallationUUIDSetQuery:(NSString *)deviceInstallationUUID
{
  return [self deviceInstallationUUIDSearchQueryMerging:@{
    (__bridge id)kSecValueData:[deviceInstallationUUID dataUsingEncoding:NSUTF8StringEncoding],
    (__bridge id)kSecAttrAccessible:(__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
  }];
}

@end
