// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>
#import <EXCore/EXExportedModule.h>
#import <EXFileSystemInterface/EXFileSystemInterface.h>

@interface EXFileSystem : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, EXFileSystemInterface> {
  EXModuleRegistry *_moduleRegistry;
}

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;
@property (nonatomic, retain) EXModuleRegistry *moduleRegistry;

- (EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

- (BOOL)ensureDirExistsWithPath:(NSString *)path;
- (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
- (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end

@protocol EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)optionxs
              resolver:(EXPromiseResolveBlock)resolve
              rejecter:(EXPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(EXPromiseResolveBlock)resolve
        rejecter:(EXPromiseRejectBlock)reject;


@end


@interface NSData (EXFileSystem)

- (NSString *)md5String;

@end
