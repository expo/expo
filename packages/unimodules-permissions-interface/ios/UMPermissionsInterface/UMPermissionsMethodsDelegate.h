// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

@interface UMPermissionsMethodsDelegate : NSObject

+ (void)getPermissionWithPermissionsManager:(id<UMPermissionsInterface>)permissionsManager
                              withRequester:(Class)requesterClass
                                 withResult:(UMPromiseResolveBlock)resolve
                               withRejecter:(UMPromiseRejectBlock)reject;

+ (void)askForPermissionWithPermissionsManger:(id<UMPermissionsInterface>)permissionsManager
                                withRequester:(Class)requesterClass
                                   withResult:(UMPromiseResolveBlock)resolve
                                 withRejecter:(UMPromiseRejectBlock)reject;

+ (void)registerRequesters:(NSArray<id<UMPermissionsRequester>> *)newRequesters
    withPermissionsManager:(id<UMPermissionsInterface>)permissionsManager;

@end

