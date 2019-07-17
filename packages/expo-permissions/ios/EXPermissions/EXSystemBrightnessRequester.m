// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXSystemBrightnessRequester.h>

@implementation EXSystemBrightnessRequester

+ (NSDictionary *)permissions
{
  return @{
           @"status": [EXPermissions permissionStringForStatus:EXPermissionStatusGranted],
           @"expires": EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject
{
  resolve([[self class] permissions]);
  [self.delegate permissionRequesterDidFinish:self];
}

@end
