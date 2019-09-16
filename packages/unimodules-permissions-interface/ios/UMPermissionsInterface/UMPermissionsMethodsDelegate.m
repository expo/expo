// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMPermissionsInterface/UMPermissionsMethodsDelegate.h>

@implementation UMPermissionsMethodsDelegate

+ (void)askForPermissionWithPermissionsManger:(id<UMPermissionsInterface>)permissionsManager
                                withRequester:(Class)requesterClass
                                   withResult:(UMPromiseResolveBlock)resolve
                                 withRejecter:(UMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager askForPermissionUsingRequesterClass:requesterClass
                                               withResult:resolve
                                             withRejecter:reject];
}

+ (void)getPermissionWithPermissionsManager:(id<UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                 withResult:(UMPromiseResolveBlock)resolve
                               withRejecter:(UMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager getPermissionUsingRequesterClass:requesterClass
                                            withResult:resolve
                                          withRejecter:reject];
}

+ (void)registerRequesters:(NSArray<id<UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<UMPermissionsInterface>)permissionsManager
{
  if (permissionsManager) {
    [permissionsManager registerRequesters:newRequesters];
  }
}

@end
