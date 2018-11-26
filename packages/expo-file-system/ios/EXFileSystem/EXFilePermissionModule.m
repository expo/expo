// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXFilePermissionModule.h"

@implementation EXFilePermissionModule

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXFilePermissionModuleInterface)];
}

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs
                                  bundleDirectory:(NSString *)bundleDirectory
{
  EXFileSystemPermissionFlags permissionsForInternalDirectories = [self getPermissionsIfPathIsInternal:path
                                                                                            scopedDirs:scopedDirs
                                                                                       bundleDirectory:bundleDirectory];
  if (permissionsForInternalDirectories != EXFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getPathPermissionsForExternalDircetories: path];
  }
}

- (EXFileSystemPermissionFlags)getPermissionsIfPathIsInternal:(NSString *)path
                                                   scopedDirs:(NSArray<NSString *> *)scopedDirs
                                              bundleDirectory:(NSString *)bundleDirectory
{
  NSString * standardizedPath = [path stringByStandardizingPath];
  for (NSString * dir in scopedDirs) {
    if ([standardizedPath hasPrefix:[dir stringByAppendingString:@"/"]]) {
      return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
    }
    if ([standardizedPath isEqualToString:dir])  {
      return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
    }
  }

  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return EXFileSystemPermissionRead;
  }

  return EXFileSystemPermissionNone;
}

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  EXFileSystemPermissionFlags filePermissions = EXFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath: path]) {
    filePermissions |= EXFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath: path]) {
    filePermissions |= EXFileSystemPermissionWrite;
  }

  return filePermissions;
}

@end
