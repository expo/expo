// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>

@interface EXPermissionsService : EXExportedModule <EXPermissionsInterface, EXModuleRegistryConsumer>

+ (EXPermissionStatus)statusForPermission:(NSDictionary *)permission;

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status;

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass;

@end
