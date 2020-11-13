// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXConstants/EXConstantsService+InstallationId.h>

static NSString * const kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";

@implementation EXConstantsService (InstallationId)

+ (NSString *)installationId
{
  NSString *uuid = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallUUIDKey];
  if (!uuid) {
    uuid = [[NSUUID UUID] UUIDString];
    [[NSUserDefaults standardUserDefaults] setObject:uuid forKey:kEXDeviceInstallUUIDKey];
  }
  return uuid;
}

@end
