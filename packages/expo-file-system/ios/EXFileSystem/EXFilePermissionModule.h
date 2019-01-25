// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXFileSystemInterface/EXFilePermissionModuleInterface.h>
#import <EXFileSystemInterface/EXFileSystemManagerInterface.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFilePermissionModule : NSObject <EXInternalModule, EXFilePermissionModuleInterface, EXModuleRegistryConsumer>

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs;

- (EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
                                                   scopedDirs:(NSArray<NSString *> *)scopedDirs
                                              bundleDirectory:(NSString *)bundleDirectory;

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

NS_ASSUME_NONNULL_END
