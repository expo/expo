// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMPermissionsMethodsDelegate.h>

@implementation EDUMPermissionsMethodsDelegate

+ (void)askForPermissionWithPermissionsManager:(id<EDUMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(EDUMPromiseResolveBlock)resolve
                                        reject:(EDUMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager askForPermissionUsingRequesterClass:requesterClass
                                                  resolve:resolve
                                                   reject:reject];
}

+ (void)getPermissionWithPermissionsManager:(id<EDUMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(EDUMPromiseResolveBlock)resolve
                                     reject:(EDUMPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager getPermissionUsingRequesterClass:requesterClass
                                               resolve:resolve
                                                reject:reject];
}

+ (void)registerRequesters:(NSArray<id<EDUMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<EDUMPermissionsInterface>)permissionsManager
{
  if (permissionsManager) {
    [permissionsManager registerRequesters:newRequesters];
  }
}

@end
