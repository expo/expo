// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMPermissionsInterface.h>

@interface ABI36_0_0UMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI36_0_0UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI36_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI36_0_0UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI36_0_0UMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI36_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI36_0_0UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI36_0_0UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI36_0_0UMPermissionsInterface>)permissionsManager;

@end

