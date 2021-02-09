// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXNotifications/ABI38_0_0EXInstallationIdProvider.h>

static NSString * const kEXDeviceInstallationUUIDKey = @"ABI38_0_0EXDeviceInstallationUUIDKey";

@implementation ABI38_0_0EXInstallationIdProvider

ABI38_0_0UM_EXPORT_MODULE(NotificationsInstallationIdProvider)

ABI38_0_0UM_EXPORT_METHOD_AS(getInstallationIdAsync, getInstallationIdAsyncWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve rejecter:(ABI38_0_0UMPromiseRejectBlock)reject)
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
