// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXBrightness/ABI41_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI41_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI41_0_0UMPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI41_0_0UMPromiseResolveBlock)resolve rejecter:(ABI41_0_0UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
