// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXExportedModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryConsumer.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXEventEmitter.h>
#import <ABI32_0_0EXFileSystemInterface/ABI32_0_0EXFileSystemInterface.h>

@interface ABI32_0_0EXFileSystem : ABI32_0_0EXExportedModule <ABI32_0_0EXEventEmitter, ABI32_0_0EXModuleRegistryConsumer, ABI32_0_0EXFileSystemInterface>

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

- (ABI32_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

- (BOOL)ensureDirExistsWithPath:(NSString *)path;
- (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
- (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end

@protocol ABI32_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)optionxs
              resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
              rejecter:(ABI32_0_0EXPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI32_0_0EXPromiseResolveBlock)resolve
        rejecter:(ABI32_0_0EXPromiseRejectBlock)reject;


@end


@interface NSData (ABI32_0_0EXFileSystem)

- (NSString *)md5String;

@end
