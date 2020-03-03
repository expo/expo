// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsInterface.h>

@interface ABI37_0_0UMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI37_0_0UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                                     reject:(ABI37_0_0UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI37_0_0UMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                                        reject:(ABI37_0_0UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI37_0_0UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI37_0_0UMPermissionsInterface>)permissionsManager;

@end

