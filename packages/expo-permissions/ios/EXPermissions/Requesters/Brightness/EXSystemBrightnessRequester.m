// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXSystemBrightnessRequester.h>

@implementation EXSystemBrightnessRequester

+ (NSString *)permissionType {
  return @"systemBrightness";
}

- (NSDictionary *)getPermissions
{
  return @{
           @"status": @(UMPermissionStatusGranted)
           };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  resolve([self getPermissions]);
}

@end
