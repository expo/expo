// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMFileSystemInterface/ABI37_0_0UMFileSystemInterface.h>
#import <ABI37_0_0UMFileSystemInterface/ABI37_0_0UMFilePermissionModuleInterface.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI37_0_0EXFilePermissionModule : NSObject <ABI37_0_0UMInternalModule, ABI37_0_0UMFilePermissionModuleInterface, ABI37_0_0UMModuleRegistryConsumer>

- (ABI37_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
