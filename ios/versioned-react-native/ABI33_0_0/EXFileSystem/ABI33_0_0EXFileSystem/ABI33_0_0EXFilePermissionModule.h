// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0UMFileSystemInterface/ABI33_0_0UMFileSystemInterface.h>
#import <ABI33_0_0UMFileSystemInterface/ABI33_0_0UMFilePermissionModuleInterface.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI33_0_0EXFilePermissionModule : NSObject <ABI33_0_0UMInternalModule, ABI33_0_0UMFilePermissionModuleInterface, ABI33_0_0UMModuleRegistryConsumer>

- (ABI33_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
