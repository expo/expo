// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef NS_OPTIONS(unsigned int, ABI31_0_0EXFileSystemPermissionFlags) {
  ABI31_0_0EXFileSystemPermissionNone = 0,
  ABI31_0_0EXFileSystemPermissionRead = 1 << 1,
  ABI31_0_0EXFileSystemPermissionWrite = 1 << 2,
};

// TODO: Maybe get rid of this interface in favor of ABI31_0_0EXFileSystemManager and private utilities classes
@protocol ABI31_0_0EXFileSystemInterface

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

// TODO: Move permissionsForURI to ABI31_0_0EXFileSystemManagerInterface
- (ABI31_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;
- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;
- (BOOL)ensureDirExistsWithPath:(NSString *)path;

@end
