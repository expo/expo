// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef NS_OPTIONS(unsigned int, EXFileSystemPermissionFlags) {
  EXFileSystemPermissionNone = 0,
  EXFileSystemPermissionRead = 1 << 1,
  EXFileSystemPermissionWrite = 1 << 2,
};

// TODO: Maybe get rid of this interface in favor of EXFileSystemManager and private utilities classes
@protocol EXFileSystemInterface

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;
@property (nonatomic, readonly) NSString *bundleDirectory;

// TODO: Move permissionsForURI to EXFileSystemManagerInterface
- (EXFileSystemPermissionFlags)permissionsForURI:(NSURL *)uri;
- (nonnull NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;
- (BOOL)ensureDirExistsWithPath:(NSString *)path;

@end
