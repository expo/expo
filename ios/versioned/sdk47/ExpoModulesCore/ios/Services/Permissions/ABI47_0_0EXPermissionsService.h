// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXPermissionsInterface.h>

@interface ABI47_0_0EXPermissionsService : ABI47_0_0EXExportedModule <ABI47_0_0EXPermissionsInterface, ABI47_0_0EXModuleRegistryConsumer>

+ (ABI47_0_0EXPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI47_0_0EXPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI47_0_0EXPromiseResolveBlock)resolver
                                    withRejecter:(ABI47_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
