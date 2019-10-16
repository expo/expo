// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <UMFileSystemInterface/UMFilePermissionModuleInterface.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFilePermissionModule : NSObject <UMInternalModule, UMFilePermissionModuleInterface, UMModuleRegistryConsumer>

- (UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
