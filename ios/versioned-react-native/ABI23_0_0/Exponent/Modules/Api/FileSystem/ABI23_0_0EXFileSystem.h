// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedEventEmitter.h"
#import "ABI23_0_0EXScopedModuleRegistry.h"


@interface ABI23_0_0EXFileSystem : ABI23_0_0EXScopedEventEmitter

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;

@end

ABI23_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI23_0_0EXFileSystem, fileSystem)


@protocol ABI23_0_0EXFileSystemHandler

+ (void)getInfoForFile:(NSURL *)fileUri
           withOptions:(NSDictionary *)options
              resolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
              rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject;
+ (void)copyFrom:(NSURL *)from
              to:(NSURL *)to
        resolver:(ABI23_0_0RCTPromiseResolveBlock)resolve
        rejecter:(ABI23_0_0RCTPromiseRejectBlock)reject;


@end


@interface NSData (ABI23_0_0EXFileSystem)

- (NSString *)md5String;

@end
