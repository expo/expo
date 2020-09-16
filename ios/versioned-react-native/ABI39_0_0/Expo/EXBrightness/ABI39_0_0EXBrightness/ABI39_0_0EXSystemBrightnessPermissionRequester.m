// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXBrightness/ABI39_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI39_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI39_0_0UMPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI39_0_0UMPromiseResolveBlock)resolve rejecter:(ABI39_0_0UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
