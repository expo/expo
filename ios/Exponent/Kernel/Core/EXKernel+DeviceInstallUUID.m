// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel+DeviceInstallUUID.h"

static NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";

@implementation EXKernel (DeviceInstallUUID)

+ (NSString *)deviceInstallUUID
{
  NSString *deviceInstallUUID = [self fetchDeviceInstallUUID];
  if (deviceInstallUUID) {
    return deviceInstallUUID;
  }
  
  deviceInstallUUID = [[NSUUID UUID] UUIDString];
  [self setDeviceInstallUUID:deviceInstallUUID];
  return deviceInstallUUID;
}

+ (nullable NSString *)fetchDeviceInstallUUID
{
  NSString *deviceInstallUUID;
  CFTypeRef foundDict = NULL;
  
  if (SecItemCopyMatching((__bridge CFDictionaryRef)[self deviceInstallUUIDGetQuery], &foundDict) == noErr) {
    NSData *result = (__bridge_transfer NSData *)foundDict;
    NSString *value = [[NSString alloc] initWithData:result
                                            encoding:NSUTF8StringEncoding];
    // `initWithUUIDString` returns nil if string is not a valid UUID
    if ([[NSUUID alloc] initWithUUIDString:value]) {
      deviceInstallUUID = value;
    }
  }
  
  if (deviceInstallUUID) {
    return deviceInstallUUID;
  }
  
  NSString *legacyUUID = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallUUIDKey];
  if (legacyUUID) {
    deviceInstallUUID = legacyUUID;
    
    NSError *error = [self setDeviceInstallUUID:legacyUUID];
    if (error) {
      DDLogError(@"Could not migrate device install UUID from legacy storage: %@", error.description);
    } else {
      // We only remove the value from old storage once it's set and saved in the new storage.
      [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXDeviceInstallUUIDKey];
    }
  }
  
  return deviceInstallUUID;
}

+ (nullable NSError *)setDeviceInstallUUID:(NSString *)deviceInstallUUID
{
  // Delete existing UUID
  SecItemDelete((__bridge CFDictionaryRef)[self deviceInstallUUIDSearchQuery]);
  
  OSStatus status = SecItemAdd((__bridge CFDictionaryRef)[self deviceInstallUUIDSetQuery:deviceInstallUUID], NULL);
  if (status == errSecSuccess) {
    return nil;
  } else {
    return [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
  }
}

# pragma mark - Keychain dictionaries

+ (NSDictionary *)deviceInstallUUIDSearchQueryMerging:(NSDictionary *)dictionaryToMerge
{
  NSData *encodedKey = [kEXDeviceInstallUUIDKey dataUsingEncoding:NSUTF8StringEncoding];
  NSMutableDictionary *query = [NSMutableDictionary dictionaryWithDictionary:@{
    (__bridge id)kSecClass:(__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService:[NSBundle mainBundle].bundleIdentifier,
    (__bridge id)kSecAttrGeneric:encodedKey,
    (__bridge id)kSecAttrAccount:encodedKey
  }];
  [query addEntriesFromDictionary:dictionaryToMerge];
  return query;
}

+ (NSDictionary *)deviceInstallUUIDSearchQuery
{
  return [self deviceInstallUUIDSearchQueryMerging:@{}];
}

+ (NSDictionary *)deviceInstallUUIDGetQuery
{
  return [self deviceInstallUUIDSearchQueryMerging:@{
    (__bridge id)kSecMatchLimit:(__bridge id)kSecMatchLimitOne,
    (__bridge id)kSecReturnData:(__bridge id)kCFBooleanTrue
  }];
}

+ (NSDictionary *)deviceInstallUUIDSetQuery:(NSString *)deviceInstallUUID
{
  return [self deviceInstallUUIDSearchQueryMerging:@{
    (__bridge id)kSecValueData:[deviceInstallUUID dataUsingEncoding:NSUTF8StringEncoding],
    (__bridge id)kSecAttrAccessible:(__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
  }];
}

@end
