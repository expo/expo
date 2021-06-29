// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXBrightness/ABI42_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI42_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI42_0_0EXPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI42_0_0UMPromiseResolveBlock)resolve rejecter:(ABI42_0_0UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
