// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMFileSystemInterface/ABI38_0_0UMFileSystemInterface.h>
#import <ABI38_0_0UMFileSystemInterface/ABI38_0_0UMFilePermissionModuleInterface.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMInternalModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0EXFilePermissionModule : NSObject <ABI38_0_0UMInternalModule, ABI38_0_0UMFilePermissionModuleInterface, ABI38_0_0UMModuleRegistryConsumer>

- (ABI38_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
