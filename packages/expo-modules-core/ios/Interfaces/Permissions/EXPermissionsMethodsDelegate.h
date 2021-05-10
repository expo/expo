// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>

@interface EXPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<EXPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(UMPromiseResolveBlock)resolve
                                     reject:(UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<EXPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(UMPromiseResolveBlock)resolve
                                        reject:(UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<EXPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<EXPermissionsInterface>)permissionsManager;

@end
