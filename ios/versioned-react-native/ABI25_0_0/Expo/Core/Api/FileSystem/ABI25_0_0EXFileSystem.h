// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedEventEmitter.h"
#import "ABI25_0_0EXScopedModuleRegistry.h"

typedef NS_OPTIONS(unsigned int, ABI25_0_0EXFileSystemPermissionFlags) {
  ABI25_0_0EXFileSystemPermissionNone = 0,
  ABI25_0_0EXFileSystemPermissionRead = 1 << 1,
  ABI25_0_0EXFileSystemPermissionWrite = 1 << 2,
};

@protocol ABI25_0_0EXFileSystemScopedModuleDelegate

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

@interface ABI25_0_0EXFileSystem : ABI25_0_0EXScopedEventEmitter

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

- (ABI25_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end

ABI25_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI25_0_0EXFileSystem, fileSystem)


@protocol ABI25_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
              rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
        rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject;


@end


@interface NSData (ABI25_0_0EXFileSystem)

- (NSString *)md5String;

@end
