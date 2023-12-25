// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel+DeviceInstallationUUID.h"
#import <EXConstants/EXConstantsInstallationIdProvider.h>

@implementation EXKernel (DeviceInstallationUUID)

+ (NSString *)deviceInstallationUUID
{
  return [[[EXConstantsInstallationIdProvider alloc] init] getOrCreateInstallationId];
}

@end
