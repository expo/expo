// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMFileSystemInterface/ABI39_0_0UMFileSystemInterface.h>
#import <ABI39_0_0UMFileSystemInterface/ABI39_0_0UMFilePermissionModuleInterface.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMInternalModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXFilePermissionModule : NSObject <ABI39_0_0UMInternalModule, ABI39_0_0UMFilePermissionModuleInterface, ABI39_0_0UMModuleRegistryConsumer>

- (ABI39_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
