// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>

@interface ABI42_0_0EXPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI42_0_0EXPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI42_0_0UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI42_0_0EXPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI42_0_0UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI42_0_0EXPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI42_0_0EXPermissionsInterface>)permissionsManager;

@end
