// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

@interface EXPermissions : UMExportedModule <UMPermissionsInterface, UMModuleRegistryConsumer>

+ (UMPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(UMPromiseResolveBlock)resolver
                                    withRejecter:(UMPromiseRejectBlock)reject;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
