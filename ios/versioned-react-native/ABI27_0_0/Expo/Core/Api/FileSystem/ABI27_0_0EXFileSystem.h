// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXScopedEventEmitter.h"
#import "ABI27_0_0EXScopedModuleRegistry.h"

typedef NS_OPTIONS(unsigned int, ABI27_0_0EXFileSystemPermissionFlags) {
  ABI27_0_0EXFileSystemPermissionNone = 0,
  ABI27_0_0EXFileSystemPermissionRead = 1 << 1,
  ABI27_0_0EXFileSystemPermissionWrite = 1 << 2,
};

@protocol ABI27_0_0EXFileSystemScopedModuleDelegate

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

@interface ABI27_0_0EXFileSystem : ABI27_0_0EXScopedEventEmitter

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

- (ABI27_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end

ABI27_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI27_0_0EXFileSystem, fileSystem)


@protocol ABI27_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
              rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI27_0_0RCTPromiseResolveBlock)resolve
        rejecter:(ABI27_0_0RCTPromiseRejectBlock)reject;


@end


@interface NSData (ABI27_0_0EXFileSystem)

- (NSString *)md5String;

@end
