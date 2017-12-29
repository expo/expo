// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedEventEmitter.h"
#import "ABI24_0_0EXScopedModuleRegistry.h"


@interface ABI24_0_0EXFileSystem : ABI24_0_0EXScopedEventEmitter

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;

@end

ABI24_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI24_0_0EXFileSystem, fileSystem)


@protocol ABI24_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
              rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI24_0_0RCTPromiseResolveBlock)resolve
        rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject;


@end


@interface NSData (ABI24_0_0EXFileSystem)

- (NSString *)md5String;

@end
