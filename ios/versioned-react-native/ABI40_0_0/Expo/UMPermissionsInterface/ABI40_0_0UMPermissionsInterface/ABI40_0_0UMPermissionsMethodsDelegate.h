// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMPermissionsInterface/ABI40_0_0UMPermissionsInterface.h>

@interface ABI40_0_0UMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI40_0_0UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI40_0_0UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI40_0_0UMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI40_0_0UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI40_0_0UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI40_0_0UMPermissionsInterface>)permissionsManager;

@end

