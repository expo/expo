// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

@implementation EXPermissionsMethodsDelegate

+ (void)askForPermissionWithPermissionsManager:(id<EXPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(EXPromiseResolveBlock)resolve
                                        reject:(EXPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager askForPermissionUsingRequesterClass:requesterClass
                                                  resolve:resolve
                                                   reject:reject];
}

+ (void)getPermissionWithPermissionsManager:(id<EXPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(EXPromiseResolveBlock)resolve
                                     reject:(EXPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager getPermissionUsingRequesterClass:requesterClass
                                               resolve:resolve
                                                reject:reject];
}

+ (void)registerRequesters:(NSArray<id<EXPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<EXPermissionsInterface>)permissionsManager
{
  if (permissionsManager) {
    [permissionsManager registerRequesters:newRequesters];
  }
}

@end
