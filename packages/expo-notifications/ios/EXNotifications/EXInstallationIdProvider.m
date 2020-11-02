// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXInstallationIdProvider.h>

static NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";
static NSString * const kEXDeviceRegistrationKeyPrefix = @"EXDeviceRegistration-";

@implementation EXInstallationIdProvider

UM_EXPORT_MODULE(NotificationsInstallationIdProvider)

UM_EXPORT_METHOD_AS(getInstallationIdAsync, getInstallationIdAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([self getInstallationId]);
}

UM_EXPORT_METHOD_AS(getRegistrationsAsync, getRegistrationsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSMutableDictionary *registrations = [NSMutableDictionary dictionary];
  for (NSString *key in [[defaults dictionaryRepresentation] allKeys]) {
    if ([self isStorageKey:key]) {
      [registrations setObject:@([defaults boolForKey:key]) forKey:[self scopeFromStorageKey:key]];
    }
  }
  resolve(registrations);
}

UM_EXPORT_METHOD_AS(setRegistrationAsync, setRegistration:(NSString *)scope isRegistered:(NSNumber *)isRegistered resolve:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  if ([isRegistered boolValue]) {
    [[NSUserDefaults standardUserDefaults] setBool:YES forKey:[self storageKeyForScope:scope]];
  } else {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:[self storageKeyForScope:scope]];
  }
  
  resolve(nil);
}

- (NSString *)getInstallationId
{
  NSString *uuid = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallUUIDKey];
  if (!uuid) {
    uuid = [[NSUUID UUID] UUIDString];
    [[NSUserDefaults standardUserDefaults] setObject:uuid forKey:kEXDeviceInstallUUIDKey];
  }
  return uuid;
}

- (NSString *)storageKeyForScope:(NSString *)scope
{
  return [kEXDeviceRegistrationKeyPrefix stringByAppendingString:scope];
}

- (BOOL)isStorageKey:(NSString *)scope
{
  return [scope hasPrefix:kEXDeviceRegistrationKeyPrefix];
}

- (NSString *)scopeFromStorageKey:(NSString *)storageKey
{
  return [storageKey substringFromIndex:[kEXDeviceRegistrationKeyPrefix length]];
}

@end
