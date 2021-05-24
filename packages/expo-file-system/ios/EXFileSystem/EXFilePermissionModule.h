// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXFilePermissionModuleInterface.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFilePermissionModule : NSObject <UMInternalModule, EXFilePermissionModuleInterface, UMModuleRegistryConsumer>

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
