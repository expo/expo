// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsMethodsDelegate.h>

@implementation ABI46_0_0EXPermissionsMethodsDelegate

+ (void)askForPermissionWithPermissionsManager:(id<ABI46_0_0EXPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                                        reject:(ABI46_0_0EXPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager askForPermissionUsingRequesterClass:requesterClass
                                                  resolve:resolve
                                                   reject:reject];
}

+ (void)getPermissionWithPermissionsManager:(id<ABI46_0_0EXPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                                     reject:(ABI46_0_0EXPromiseRejectBlock)reject
{
  if (!permissionsManager) {
    return reject(@"E_NO_PERMISSIONS", @"Permissions module not found. Are you sure that Expo modules are properly linked?", nil);
  }
  [permissionsManager getPermissionUsingRequesterClass:requesterClass
                                               resolve:resolve
                                                reject:reject];
}

+ (void)registerRequesters:(NSArray<id<ABI46_0_0EXPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI46_0_0EXPermissionsInterface>)permissionsManager
{
  if (permissionsManager) {
    [permissionsManager registerRequesters:newRequesters];
  }
}

@end
