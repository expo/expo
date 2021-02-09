// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMFileSystemInterface/ABI40_0_0UMFileSystemInterface.h>
#import <ABI40_0_0UMFileSystemInterface/ABI40_0_0UMFilePermissionModuleInterface.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXFilePermissionModule : NSObject <ABI40_0_0UMInternalModule, ABI40_0_0UMFilePermissionModuleInterface, ABI40_0_0UMModuleRegistryConsumer>

- (ABI40_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
