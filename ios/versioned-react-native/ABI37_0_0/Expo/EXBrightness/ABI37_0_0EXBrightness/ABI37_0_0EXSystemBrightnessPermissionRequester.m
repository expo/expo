// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXBrightness/ABI37_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI37_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI37_0_0UMPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
