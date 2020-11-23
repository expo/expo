// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXBrightness/ABI40_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI40_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI40_0_0UMPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI40_0_0UMPromiseResolveBlock)resolve rejecter:(ABI40_0_0UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
