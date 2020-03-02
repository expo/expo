// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI37_0_0EXPermissionExpiresNever;

@interface ABI37_0_0EXPermissions : ABI37_0_0UMExportedModule <ABI37_0_0UMPermissionsInterface, ABI37_0_0UMModuleRegistryConsumer>

+ (ABI37_0_0UMPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI37_0_0UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI37_0_0UMPromiseResolveBlock)resolver
                                    withRejecter:(ABI37_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
