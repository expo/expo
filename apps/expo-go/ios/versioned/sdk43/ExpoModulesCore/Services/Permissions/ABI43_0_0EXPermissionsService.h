// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>

@interface ABI43_0_0EXPermissionsService : ABI43_0_0EXExportedModule <ABI43_0_0EXPermissionsInterface, ABI43_0_0EXModuleRegistryConsumer>

+ (ABI43_0_0EXPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI43_0_0EXPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI43_0_0EXPromiseResolveBlock)resolver
                                    withRejecter:(ABI43_0_0EXPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
