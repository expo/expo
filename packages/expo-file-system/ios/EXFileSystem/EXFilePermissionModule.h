// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXFileSystemInterface/EXFilePermissionModuleInterface.h>
#import <EXCore/EXExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFilePermissionModule : EXExportedModule <EXFilePermissionModuleInterface>

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs
                                  bundleDirectory:(NSString *)bundleDirectory;

- (EXFileSystemPermissionFlags)getPermissionsIfPathIsInternal:(NSString *)path
                                                   scopedDirs:(NSArray<NSString *> *)scopedDirs
                                              bundleDirectory:(NSString *)bundleDirectory;

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@end

NS_ASSUME_NONNULL_END
