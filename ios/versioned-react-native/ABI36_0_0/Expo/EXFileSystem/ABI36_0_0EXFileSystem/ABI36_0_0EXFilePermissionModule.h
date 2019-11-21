// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMFileSystemInterface/ABI36_0_0UMFileSystemInterface.h>
#import <ABI36_0_0UMFileSystemInterface/ABI36_0_0UMFilePermissionModuleInterface.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI36_0_0EXFilePermissionModule : NSObject <ABI36_0_0UMInternalModule, ABI36_0_0UMFilePermissionModuleInterface, ABI36_0_0UMModuleRegistryConsumer>

- (ABI36_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
