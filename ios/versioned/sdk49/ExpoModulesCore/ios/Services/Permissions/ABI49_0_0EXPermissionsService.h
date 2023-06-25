// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXPermissionsInterface.h>

@interface ABI49_0_0EXPermissionsService : ABI49_0_0EXExportedModule <ABI49_0_0EXPermissionsInterface, ABI49_0_0EXModuleRegistryConsumer>

+ (ABI49_0_0EXPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI49_0_0EXPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI49_0_0EXPromiseResolveBlock)resolver
                                    withRejecter:(ABI49_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
