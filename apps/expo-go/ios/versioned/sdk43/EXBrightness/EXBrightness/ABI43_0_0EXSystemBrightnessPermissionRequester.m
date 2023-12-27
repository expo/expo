// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXBrightness/ABI43_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI43_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI43_0_0EXPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
