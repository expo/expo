// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>

@interface EXFileSystem : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, EXFileSystemInterface>

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

- (instancetype)initWithDocumentDirectory:(NSString *)documentDirectory cachesDirectory:(NSString *)cachesDirectory;

- (EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

- (nullable NSURL *)percentEncodedURLFromURIString:(nonnull NSString *)uri;

- (BOOL)ensureDirExistsWithPath:(NSString *)path;

- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end
