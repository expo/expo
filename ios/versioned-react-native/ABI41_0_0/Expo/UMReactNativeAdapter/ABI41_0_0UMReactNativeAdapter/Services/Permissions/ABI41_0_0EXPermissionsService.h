// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>

@interface ABI41_0_0EXPermissionsService : ABI41_0_0UMExportedModule <ABI41_0_0UMPermissionsInterface, ABI41_0_0UMModuleRegistryConsumer>

+ (ABI41_0_0UMPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(ABI41_0_0UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(ABI41_0_0UMPromiseResolveBlock)resolver
                                    withRejecter:(ABI41_0_0UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
