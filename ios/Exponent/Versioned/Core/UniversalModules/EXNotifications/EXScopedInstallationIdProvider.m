// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXInstallationIdProvider.h>)

#import "EXScopedInstallationIdProvider.h"

@interface EXScopedInstallationIdProvider ()

@property (nonatomic, weak) id<EXDeviceInstallationUUIDManager> deviceInstallationUUIDManager;

@end

@implementation EXScopedInstallationIdProvider

- (instancetype)initWithDeviceInstallationUUIDManager:(id<EXDeviceInstallationUUIDManager>)deviceInstallationUUIDManager
{
  if (self = [super init]) {
    _deviceInstallationUUIDManager = deviceInstallationUUIDManager;
  }
  return self;
}

- (NSString *)getInstallationId
{
  return [_deviceInstallationUUIDManager deviceInstallationUUID];
}

@end

#endif
