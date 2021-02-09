// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI39_0_0EXPermissionExpiresNever;

@interface ABI39_0_0EXPermissions : ABI39_0_0UMExportedModule <ABI39_0_0UMPermissionsInterface, ABI39_0_0UMModuleRegistryConsumer>

+ (ABI39_0_0UMPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI39_0_0UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI39_0_0UMPromiseResolveBlock)resolver
                                    withRejecter:(ABI39_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
