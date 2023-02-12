// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXFilePermissionModuleInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXFilePermissionModule : NSObject <ABI47_0_0EXInternalModule, ABI47_0_0EXFilePermissionModuleInterface, ABI47_0_0EXModuleRegistryConsumer>

- (ABI47_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
