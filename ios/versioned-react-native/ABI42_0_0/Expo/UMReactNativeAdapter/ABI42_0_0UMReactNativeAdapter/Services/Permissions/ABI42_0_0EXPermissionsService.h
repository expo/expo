// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>

@interface ABI42_0_0EXPermissionsService : ABI42_0_0UMExportedModule <ABI42_0_0EXPermissionsInterface, ABI42_0_0UMModuleRegistryConsumer>

+ (ABI42_0_0EXPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI42_0_0EXPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI42_0_0UMPromiseResolveBlock)resolver
                                    withRejecter:(ABI42_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
