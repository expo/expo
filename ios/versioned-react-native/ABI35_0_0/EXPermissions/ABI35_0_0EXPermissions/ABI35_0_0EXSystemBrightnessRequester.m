// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXPermissions/ABI35_0_0EXSystemBrightnessRequester.h>

@interface ABI35_0_0EXSystemBrightnessRequester ()

@property (nonatomic, weak) id<ABI35_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI35_0_0EXSystemBrightnessRequester

+ (NSDictionary *)permissions
{
  return @{
           @"status": [ABI35_0_0EXPermissions permissionStringForStatus:ABI35_0_0EXPermissionStatusGranted],
           @"expires": ABI35_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI35_0_0UMPromiseResolveBlock)resolve rejecter:(ABI35_0_0UMPromiseRejectBlock)reject
{
  resolve([[self class] permissions]);
  [_delegate permissionRequesterDidFinish:self];
}

- (void)setDelegate:(id)permissionRequesterDelegate {
  _delegate = permissionRequesterDelegate;
}


@end
