// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissionRequester.h>

@implementation EXPermissionBaseRequester

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject {
  // todo: change it to something better
  reject(@"E_NOT_DEFINED", @"METHOD NOT DEFINED", nil);
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)permissionRequesterDelegate {
  _delegate = permissionRequesterDelegate;
}

@end
