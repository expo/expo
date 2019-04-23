// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <UMFileSystemInterface/UMFilePermissionModuleInterface.h>
#import <UMFileSystemInterface/UMFileSystemManagerInterface.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFilePermissionModule : NSObject <UMInternalModule, UMFilePermissionModuleInterface, UMModuleRegistryConsumer>

- (UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs;

- (UMFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
                                                   scopedDirs:(NSArray<NSString *> *)scopedDirs
                                              bundleDirectory:(NSString *)bundleDirectory;

- (UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

NS_ASSUME_NONNULL_END
