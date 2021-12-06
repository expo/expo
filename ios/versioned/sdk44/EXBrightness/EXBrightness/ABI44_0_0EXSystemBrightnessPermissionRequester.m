// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXBrightness/ABI44_0_0EXSystemBrightnessPermissionRequester.h>

@implementation ABI44_0_0EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(ABI44_0_0EXPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(ABI44_0_0EXPromiseResolveBlock)resolve rejecter:(ABI44_0_0EXPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
