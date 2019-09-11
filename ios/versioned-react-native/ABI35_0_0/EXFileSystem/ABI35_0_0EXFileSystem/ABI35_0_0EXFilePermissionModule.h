// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI35_0_0UMFileSystemInterface/ABI35_0_0UMFileSystemInterface.h>
#import <ABI35_0_0UMFileSystemInterface/ABI35_0_0UMFilePermissionModuleInterface.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMInternalModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI35_0_0EXFilePermissionModule : NSObject <ABI35_0_0UMInternalModule, ABI35_0_0UMFilePermissionModuleInterface, ABI35_0_0UMModuleRegistryConsumer>

- (ABI35_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
