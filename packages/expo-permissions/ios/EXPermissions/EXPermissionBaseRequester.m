// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissionBaseRequester.h>

@implementation EXPermissionBaseRequester

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject {
  @throw [NSException exceptionWithName:NSInvalidArgumentException reason:[NSString stringWithFormat:@"%s must be overridden in a subclass/category", __PRETTY_FUNCTION__] userInfo:nil];
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)permissionRequesterDelegate {
  _delegate = permissionRequesterDelegate;
}

- (NSDictionary *)permissions{
  @throw [NSException exceptionWithName:NSInvalidArgumentException reason:[NSString stringWithFormat:@"%s must be overridden in a subclass/category", __PRETTY_FUNCTION__] userInfo:nil];
}

- (void)setPermissionsModule:(EXPermissions *)permissionsModule {
  _permissionsModule = permissionsModule;
}

@end
