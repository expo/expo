// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXNotifications/ABI39_0_0EXInstallationIdProvider.h>

static NSString * const kEXDeviceInstallationUUIDKey = @"ABI39_0_0EXDeviceInstallationUUIDKey";

@implementation ABI39_0_0EXInstallationIdProvider

ABI39_0_0UM_EXPORT_MODULE(NotificationsInstallationIdProvider)

ABI39_0_0UM_EXPORT_METHOD_AS(getInstallationIdAsync, getInstallationIdAsyncWithResolver:(ABI39_0_0UMPromiseResolveBlock)resolve rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  resolve([self getInstallationId]);
}

- (NSString *)getInstallationId
{
  NSString *uuid = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallationUUIDKey];
  if (!uuid) {
    uuid = [[NSUUID UUID] UUIDString];
    [[NSUserDefaults standardUserDefaults] setObject:uuid forKey:kEXDeviceInstallationUUIDKey];
  }
  return uuid;
}

@end
