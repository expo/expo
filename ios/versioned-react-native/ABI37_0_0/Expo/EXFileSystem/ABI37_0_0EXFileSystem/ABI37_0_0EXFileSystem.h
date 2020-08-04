// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMFileSystemInterface/ABI37_0_0UMFileSystemInterface.h>

@interface ABI37_0_0EXFileSystem : ABI37_0_0UMExportedModule <ABI37_0_0UMEventEmitter, ABI37_0_0UMModuleRegistryConsumer, ABI37_0_0UMFileSystemInterface>

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;
@property (nonatomic, readonly) NSString *bundleDirectory;

- (instancetype)initWithDocumentDirectory:(NSString *)documentDirectory cachesDirectory:(NSString *)cachesDirectory bundleDirectory:(NSString *)bundleDirectory;

- (ABI37_0_0UMFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

- (BOOL)ensureDirExistsWithPath:(NSString *)path;
- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end

@protocol ABI37_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)optionxs
              resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
              rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
        rejecter:(ABI37_0_0UMPromiseRejectBlock)reject;


@end


@interface NSData (ABI37_0_0EXFileSystem)

- (NSString *)md5String;

@end
