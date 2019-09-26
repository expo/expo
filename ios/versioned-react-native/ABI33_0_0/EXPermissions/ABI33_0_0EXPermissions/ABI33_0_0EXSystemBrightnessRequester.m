// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXPermissions/ABI33_0_0EXSystemBrightnessRequester.h>

@interface ABI33_0_0EXSystemBrightnessRequester ()

@property (nonatomic, weak) id<ABI33_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI33_0_0EXSystemBrightnessRequester

+ (NSDictionary *)permissions
{
  return @{
           @"status": [ABI33_0_0EXPermissions permissionStringForStatus:ABI33_0_0EXPermissionStatusGranted],
           @"expires": ABI33_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI33_0_0UMPromiseResolveBlock)resolve rejecter:(ABI33_0_0UMPromiseRejectBlock)reject
{
  resolve([[self class] permissions]);
  [_delegate permissionRequesterDidFinish:self];
}

- (void)setDelegate:(id)permissionRequesterDelegate {
  _delegate = permissionRequesterDelegate;
}


@end
