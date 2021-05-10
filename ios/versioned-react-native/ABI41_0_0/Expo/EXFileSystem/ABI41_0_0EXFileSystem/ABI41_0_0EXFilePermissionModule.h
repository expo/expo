// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMFileSystemInterface/ABI41_0_0UMFileSystemInterface.h>
#import <ABI41_0_0UMFileSystemInterface/ABI41_0_0UMFilePermissionModuleInterface.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXFilePermissionModule : NSObject <ABI41_0_0UMInternalModule, ABI41_0_0UMFilePermissionModuleInterface, ABI41_0_0UMModuleRegistryConsumer>

- (ABI41_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
