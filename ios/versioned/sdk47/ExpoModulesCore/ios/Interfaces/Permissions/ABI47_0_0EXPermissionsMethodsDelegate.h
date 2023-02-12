// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXPermissionsInterface.h>

@interface ABI47_0_0EXPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI47_0_0EXPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                                     reject:(ABI47_0_0EXPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI47_0_0EXPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                                        reject:(ABI47_0_0EXPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI47_0_0EXPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI47_0_0EXPermissionsInterface>)permissionsManager;

@end
