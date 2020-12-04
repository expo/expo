// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMPermissionsInterface/ABI40_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI40_0_0EXPermissionExpiresNever;

@interface ABI40_0_0EXPermissions : ABI40_0_0UMExportedModule <ABI40_0_0UMPermissionsInterface, ABI40_0_0UMModuleRegistryConsumer>

+ (ABI40_0_0UMPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI40_0_0UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI40_0_0UMPromiseResolveBlock)resolver
                                    withRejecter:(ABI40_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
