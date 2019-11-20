// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI34_0_0UMFileSystemInterface/ABI34_0_0UMFileSystemInterface.h>
#import <ABI34_0_0UMFileSystemInterface/ABI34_0_0UMFilePermissionModuleInterface.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMInternalModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI34_0_0EXFilePermissionModule : NSObject <ABI34_0_0UMInternalModule, ABI34_0_0UMFilePermissionModuleInterface, ABI34_0_0UMModuleRegistryConsumer>

- (ABI34_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
