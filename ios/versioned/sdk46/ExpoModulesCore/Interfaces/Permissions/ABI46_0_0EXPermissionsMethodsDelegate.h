// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsInterface.h>

@interface ABI46_0_0EXPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<ABI46_0_0EXPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                                     reject:(ABI46_0_0EXPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<ABI46_0_0EXPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                                        reject:(ABI46_0_0EXPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<ABI46_0_0EXPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<ABI46_0_0EXPermissionsInterface>)permissionsManager;

@end
