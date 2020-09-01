// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsInterface.h>

@interface ABI39_0_0UMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI39_0_0UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI39_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI39_0_0UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI39_0_0UMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI39_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI39_0_0UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI39_0_0UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI39_0_0UMPermissionsInterface>)permissionsManager;

@end

