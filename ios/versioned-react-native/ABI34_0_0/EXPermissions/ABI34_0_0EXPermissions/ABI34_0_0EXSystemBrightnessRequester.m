// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXPermissions/ABI34_0_0EXSystemBrightnessRequester.h>

@interface ABI34_0_0EXSystemBrightnessRequester ()

@property (nonatomic, weak) id<ABI34_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI34_0_0EXSystemBrightnessRequester

+ (NSDictionary *)permissions
{
  return @{
           @"status": [ABI34_0_0EXPermissions permissionStringForStatus:ABI34_0_0EXPermissionStatusGranted],
           @"expires": ABI34_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve rejecter:(ABI34_0_0UMPromiseRejectBlock)reject
{
  resolve([[self class] permissions]);
  [_delegate permissionRequesterDidFinish:self];
}

- (void)setDelegate:(id)permissionRequesterDelegate {
  _delegate = permissionRequesterDelegate;
}


@end
