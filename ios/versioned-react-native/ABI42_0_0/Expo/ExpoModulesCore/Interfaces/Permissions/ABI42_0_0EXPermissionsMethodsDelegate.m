// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsMethodsDelegate.h>

@implementation ABI42_0_0EXPermissionsMethodsDelegate

+ (void)askForPermissionWithPermissionsManager:(id<ABI42_0_0EXPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager askForPermissionUsingRequesterClass:requesterClass
                                                  resolve:resolve
                                                   reject:reject];
}

+ (void)getPermissionWithPermissionsManager:(id<ABI42_0_0EXPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI42_0_0UMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager getPermissionUsingRequesterClass:requesterClass
                                               resolve:resolve
                                                reject:reject];
}

+ (void)registerRequesters:(NSArray<id<ABI42_0_0EXPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI42_0_0EXPermissionsInterface>)permissionsManager
{
  if (permissionsManager) {
    [permissionsManager registerRequesters:newRequesters];
  }
}

@end
