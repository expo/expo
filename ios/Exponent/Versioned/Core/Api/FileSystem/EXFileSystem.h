// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXScopedEventEmitter.h"
#import "EXScopedModuleRegistry.h"

typedef NS_OPTIONS(unsigned int, EXFileSystemPermissionFlags) {
  EXFileSystemPermissionNone = 0,
  EXFileSystemPermissionRead = 1 << 1,
  EXFileSystemPermissionWrite = 1 << 2,
};

@interface EXFileSystem : EXScopedEventEmitter

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

- (EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;

@end

EX_DECLARE_SCOPED_MODULE_GETTER(EXFileSystem, fileSystem)


@protocol EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject;


@end


@interface NSData (EXFileSystem)

- (NSString *)md5String;

@end
