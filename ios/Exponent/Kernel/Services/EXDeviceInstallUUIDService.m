// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDeviceInstallUUIDService.h"
#import "EXKernel+DeviceInstallUUID.h"

@implementation EXDeviceInstallUUIDService

- (NSString *)deviceInstallUUID
{
  return [EXKernel deviceInstallUUID];
}

@end
