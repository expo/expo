// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMPermissionsInterface.h>

@interface EDUMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<EDUMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                    resolve:(EDUMPromiseResolveBlock)resolve
                                     reject:(EDUMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManager:(id<EDUMPermissionsInterface>)permissionsManager
                                 withRequester:(Class)requesterClass
                                       resolve:(EDUMPromiseResolveBlock)resolve
                                        reject:(EDUMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<EDUMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<EDUMPermissionsInterface>)permissionsManager;

@end

