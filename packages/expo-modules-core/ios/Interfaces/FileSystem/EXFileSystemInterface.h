// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef NS_OPTIONS(unsigned int, EXFileSystemPermissionFlags) {
  EXFileSystemPermissionNone = 0,
  EXFileSystemPermissionRead = 1 << 1,
  EXFileSystemPermissionWrite = 1 << 2,
};

// TODO: Maybe get rid of this interface in favor of EXFileSystemManager and private utilities classes
@protocol EXFileSystemInterface

@property (nonatomic, readonly, null_unspecified) NSString *documentDirectory;
@property (nonatomic, readonly, null_unspecified) NSString *cachesDirectory;
@property (nonatomic, readonly, null_unspecified) NSString *applicationSupportDirectory;

// TODO: Move permissionsForURI to EXFileSystemManagerInterface
- (EXFileSystemPermissionFlags)permissionsForURI:(null_unspecified NSURL *)uri;
- (nonnull NSString *)generatePathInDirectory:(null_unspecified NSString *)directory withExtension:(null_unspecified NSString *)extension;
- (BOOL)ensureDirExistsWithPath:(null_unspecified NSString *)path;

@end
