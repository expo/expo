// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXBrightness/ABI36_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI36_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI36_0_0UMPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve rejecter:(ABI36_0_0UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
