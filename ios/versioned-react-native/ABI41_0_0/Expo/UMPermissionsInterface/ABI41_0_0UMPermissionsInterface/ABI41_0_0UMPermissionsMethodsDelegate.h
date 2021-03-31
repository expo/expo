// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>

@interface ABI41_0_0UMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI41_0_0UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI41_0_0UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI41_0_0UMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI41_0_0UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI41_0_0UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI41_0_0UMPermissionsInterface>)permissionsManager;

@end
