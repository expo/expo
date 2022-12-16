// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsInterface.h>

@interface ABI46_0_0EXPermissionsService : ABI46_0_0EXExportedModule <ABI46_0_0EXPermissionsInterface, ABI46_0_0EXModuleRegistryConsumer>

+ (ABI46_0_0EXPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI46_0_0EXPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI46_0_0EXPromiseResolveBlock)resolver
                                    withRejecter:(ABI46_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
