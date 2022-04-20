// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXBrightness/ABI45_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI45_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI45_0_0EXPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI45_0_0EXPromiseResolveBlock)resolve rejecter:(ABI45_0_0EXPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
