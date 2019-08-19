// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

FOUNDATION_EXPORT NSString * const EXPermissionExpiresNever;

@interface EXPermissions : UMExportedModule <UMPermissionsInterface, UMModuleRegistryConsumer>

// TODO: Remove once SDK34 is phased out
- (void)askForGlobalPermission:(NSString *)permissionType
                  withResolver:(UMPromiseResolveBlock)resolver
                  withRejecter:(UMPromiseRejectBlock)reject;

+ (UMPermissionStatus)statusForPermission:(NSDictionary *)permissions;

+ (NSString *)permissionStringForStatus:(UMPermissionStatus)status;

- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                    withResolver:(UMPromiseResolveBlock)resolver
                                    withRejecter:(UMPromiseRejectBlock)reject;

@end
