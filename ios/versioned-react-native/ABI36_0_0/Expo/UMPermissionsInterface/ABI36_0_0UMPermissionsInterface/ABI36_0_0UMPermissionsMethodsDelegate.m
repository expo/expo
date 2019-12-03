// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMPermissionsMethodsDelegate.h>

@implementation ABI36_0_0UMPermissionsMethodsDelegate

+ (void)askForPermissionWithPermissionsManager:(id<ABI36_0_0UMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI36_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI36_0_0UMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager askForPermissionUsingRequesterClass:requesterClass
                                                  resolve:resolve
                                                   reject:reject];
}

+ (void)getPermissionWithPermissionsManager:(id<ABI36_0_0UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI36_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI36_0_0UMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager getPermissionUsingRequesterClass:requesterClass
                                               resolve:resolve
                                                reject:reject];
}

+ (void)registerRequesters:(NSArray<id<ABI36_0_0UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI36_0_0UMPermissionsInterface>)permissionsManager
{
  if (permissionsManager) {
    [permissionsManager registerRequesters:newRequesters];
  }
}

@end
