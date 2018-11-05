// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXExportedModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXEventEmitter.h>
#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemInterface.h>

@interface ABI30_0_0EXFileSystem : ABI30_0_0EXExportedModule <ABI30_0_0EXEventEmitter, ABI30_0_0EXModuleRegistryConsumer, ABI30_0_0EXFileSystemInterface>

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

- (ABI30_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

- (BOOL)ensureDirExistsWithPath:(NSString *)path;
- (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
- (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end

@protocol ABI30_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)optionxs
              resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
              rejecter:(ABI30_0_0EXPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
        rejecter:(ABI30_0_0EXPromiseRejectBlock)reject;


@end


@interface NSData (ABI30_0_0EXFileSystem)

- (NSString *)md5String;

@end
