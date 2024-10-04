// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXBrightness/ABI46_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI46_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI46_0_0EXPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecter:(ABI46_0_0EXPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
