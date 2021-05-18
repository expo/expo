// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>

@interface EXPermissionsService : UMExportedModule <EXPermissionsInterface, UMModuleRegistryConsumer>

+ (EXPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(UMPromiseResolveBlock)resolver
                                    withRejecter:(UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
