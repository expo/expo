// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXBrightness/ABI38_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI38_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI38_0_0UMPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve rejecter:(ABI38_0_0UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
