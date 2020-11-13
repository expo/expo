// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXInstallationIdProvider.h>)

#import "EXScopedInstallationIdProvider.h"

@interface EXScopedInstallationIdProvider ()

@property (nonatomic, weak) id<EXDeviceInstallUUIDManager> deviceInstallUUIDManager;

@end

@implementation EXScopedInstallationIdProvider

- (instancetype)initWithDeviceInstallUUIDManager:(id<EXDeviceInstallUUIDManager>)deviceInstallUUIDManager
{
  if (self = [super init]) {
    _deviceInstallUUIDManager = deviceInstallUUIDManager;
  }
  return self;
}

- (NSString *)getInstallationId
{
  return [_deviceInstallUUIDManager deviceInstallUUID];
}

@end

#endif
