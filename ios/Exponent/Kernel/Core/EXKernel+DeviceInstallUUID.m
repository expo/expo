// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel+DeviceInstallUUID.h"

static NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";

@implementation EXKernel (DeviceInstallUUID)

+ (NSString *)deviceInstallUUID
{
  NSString *uuid = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallUUIDKey];
  if (!uuid) {
    uuid = [[NSUUID UUID] UUIDString];
    [[NSUserDefaults standardUserDefaults] setObject:uuid forKey:kEXDeviceInstallUUIDKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
  }
  return uuid;
}

@end
