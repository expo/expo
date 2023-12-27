// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFilePermissionModuleInterface.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXFilePermissionModule : NSObject <ABI42_0_0UMInternalModule, ABI42_0_0EXFilePermissionModuleInterface, ABI42_0_0UMModuleRegistryConsumer>

- (ABI42_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
