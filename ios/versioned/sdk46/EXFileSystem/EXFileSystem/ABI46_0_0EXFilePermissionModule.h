// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFilePermissionModuleInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXInternalModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXFilePermissionModule : NSObject <ABI46_0_0EXInternalModule, ABI46_0_0EXFilePermissionModuleInterface, ABI46_0_0EXModuleRegistryConsumer>

- (ABI46_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
