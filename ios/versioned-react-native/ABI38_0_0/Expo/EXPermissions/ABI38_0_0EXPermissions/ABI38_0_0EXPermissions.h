// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <ABI38_0_0UMPermissionsInterface/ABI38_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI38_0_0EXPermissionExpiresNever;

@interface ABI38_0_0EXPermissions : ABI38_0_0UMExportedModule <ABI38_0_0UMPermissionsInterface, ABI38_0_0UMModuleRegistryConsumer>

+ (ABI38_0_0UMPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI38_0_0UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI38_0_0UMPromiseResolveBlock)resolver
                                    withRejecter:(ABI38_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
