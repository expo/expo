// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXExportedModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryConsumer.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXEventEmitter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXFileSystemInterface.h>

@interface ABI49_0_0EXFileSystem : ABI49_0_0EXExportedModule <ABI49_0_0EXEventEmitter, ABI49_0_0EXModuleRegistryConsumer, ABI49_0_0EXFileSystemInterface>

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;
@property (nonatomic, readonly) NSString *bundleDirectory;

- (instancetype)initWithDocumentDirectory:(NSString *)documentDirectory cachesDirectory:(NSString *)cachesDirectory bundleDirectory:(NSString *)bundleDirectory;

- (ABI49_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

- (nullable NSURL *)percentEncodedURLFromURIString:(nonnull NSString *)uri;

- (BOOL)ensureDirExistsWithPath:(NSString *)path;

- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end

@protocol ABI49_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)optionxs
              resolver:(ABI49_0_0EXPromiseResolveBlock)resolve
              rejecter:(ABI49_0_0EXPromiseRejectBlock)reject;

+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI49_0_0EXPromiseResolveBlock)resolve
        rejecter:(ABI49_0_0EXPromiseRejectBlock)reject;

@end
