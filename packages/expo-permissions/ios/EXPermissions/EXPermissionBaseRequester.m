// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissionBaseRequester.h>

@implementation EXPermissionBaseRequester

- (instancetype)initWithPermissionsModule:(EXPermissions *)permissionsModule {
  if (self = [super init]) {
    _permissionsModule = permissionsModule;
    return self;
  }
  return nil;
}

- (void)requestPermissionsWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject {
  @throw [NSException exceptionWithName:NSInvalidArgumentException reason:[NSString stringWithFormat:@"%s must be overridden in a subclass/category", __PRETTY_FUNCTION__] userInfo:nil];
}

- (NSDictionary *)permissions {
  @throw [NSException exceptionWithName:NSInvalidArgumentException reason:[NSString stringWithFormat:@"%s must be overridden in a subclass/category", __PRETTY_FUNCTION__] userInfo:nil];
}

- (void)setPermissionsModule:(EXPermissions *)permissionsModule {
  _permissionsModule = permissionsModule;
}

@end
