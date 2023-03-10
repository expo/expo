// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef NS_OPTIONS(unsigned int, ABI48_0_0EXFileSystemPermissionFlags) {
  ABI48_0_0EXFileSystemPermissionNone = 0,
  ABI48_0_0EXFileSystemPermissionRead = 1 << 1,
  ABI48_0_0EXFileSystemPermissionWrite = 1 << 2,
};

// TODO: Maybe get rid of this interface in favor of ABI48_0_0EXFileSystemManager and private utilities classes
@protocol ABI48_0_0EXFileSystemInterface

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;
@property (nonatomic, readonly) NSString *bundleDirectory;

// TODO: Move permissionsForURI to ABI48_0_0EXFileSystemManagerInterface
- (ABI48_0_0EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;
- (nonnull NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;
- (BOOL)ensureDirExistsWithPath:(NSString *)path;

@end
