// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXFileSystemInterface/ABI32_0_0EXFileSystemInterface.h>
#import <ABI32_0_0EXFileSystemInterface/ABI32_0_0EXFilePermissionModuleInterface.h>
#import <ABI32_0_0EXFileSystemInterface/ABI32_0_0EXFileSystemManagerInterface.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI32_0_0EXFilePermissionModule : ABI32_0_0EXExportedModule <ABI32_0_0EXFilePermissionModuleInterface, ABI32_0_0EXModuleRegistryConsumer>

- (ABI32_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs;

- (ABI32_0_0EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
                                                   scopedDirs:(NSArray<NSString *> *)scopedDirs
                                              bundleDirectory:(NSString *)bundleDirectory;

- (ABI32_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@property (nonatomic, weak) ABI32_0_0EXModuleRegistry *moduleRegistry;

@end

NS_ASSUME_NONNULL_END
