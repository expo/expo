// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXBrightness/ABI47_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI47_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI47_0_0EXPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI47_0_0EXPromiseResolveBlock)resolve rejecter:(ABI47_0_0EXPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
