// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXSystemBrightnessRequester.h>

@interface EXSystemBrightnessRequester ()

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

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
  [_delegate permissionRequesterDidFinish:self];
}

- (void)setDelegate:(id)permissionRequesterDelegate {
  _delegate = permissionRequesterDelegate;
}


@end
