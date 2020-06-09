// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMPermissionsInterface/ABI38_0_0UMPermissionsInterface.h>

@interface ABI38_0_0UMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI38_0_0UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI38_0_0UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI38_0_0UMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI38_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI38_0_0UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI38_0_0UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI38_0_0UMPermissionsInterface>)permissionsManager;

@end

