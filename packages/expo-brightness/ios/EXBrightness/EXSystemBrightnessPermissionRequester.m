// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBrightness/EXSystemBrightnessPermissionRequester.h>

@implementation EXSystemBrightnessPermissionRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(EXPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
