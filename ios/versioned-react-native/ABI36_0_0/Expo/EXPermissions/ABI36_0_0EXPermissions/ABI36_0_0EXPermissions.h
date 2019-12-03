// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const ABI36_0_0EXPermissionExpiresNever;

@interface ABI36_0_0EXPermissions : ABI36_0_0UMExportedModule <ABI36_0_0UMPermissionsInterface, ABI36_0_0UMModuleRegistryConsumer>

+ (ABI36_0_0UMPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI36_0_0UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI36_0_0UMPromiseResolveBlock)resolver
                                    withRejecter:(ABI36_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
