// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXFileSystem/EXFilePermissionModule.h>
#import <EXCore/EXModuleRegistry.h>

@implementation EXFilePermissionModule

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXFilePermissionModuleInterface)];
}

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs
{
  NSString * bundleDirectory = [[_moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemManager)] bundleDirectoryForExperienceId:_moduleRegistry.experienceId];
  EXFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path
                                                                                            scopedDirs:scopedDirs
                                                                                       bundleDirectory:bundleDirectory];
  if (permissionsForInternalDirectories != EXFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions: path];
  }
}

- (EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
                                               scopedDirs:(NSArray<NSString *> *)scopedDirs
                                          bundleDirectory:(NSString *)bundleDirectory
{
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
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
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= EXFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= EXFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
