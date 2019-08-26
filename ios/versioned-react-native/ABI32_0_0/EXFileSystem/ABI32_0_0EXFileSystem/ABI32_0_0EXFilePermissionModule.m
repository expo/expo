// Copyright 2015-present 650 Industries. All rights reserved.
#import <ABI32_0_0EXFileSystem/ABI32_0_0EXFilePermissionModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>

@implementation ABI32_0_0EXFilePermissionModule

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI32_0_0EXFilePermissionModuleInterface)];
}

- (ABI32_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs
{
  NSString * bundleDirectory = [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXFileSystemManager)] bundleDirectoryForExperienceId:_moduleRegistry.experienceId];
  ABI32_0_0EXFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path
                                                                                            scopedDirs:scopedDirs
                                                                                       bundleDirectory:bundleDirectory];
  if (permissionsForInternalDirectories != ABI32_0_0EXFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions: path];
  }
}

- (ABI32_0_0EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
                                               scopedDirs:(NSArray<NSString *> *)scopedDirs
                                          bundleDirectory:(NSString *)bundleDirectory
{
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return ABI32_0_0EXFileSystemPermissionRead | ABI32_0_0EXFileSystemPermissionWrite;
    }
  }

  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return ABI32_0_0EXFileSystemPermissionRead;
  }

  return ABI32_0_0EXFileSystemPermissionNone;
}

- (ABI32_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  ABI32_0_0EXFileSystemPermissionFlags filePermissions = ABI32_0_0EXFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= ABI32_0_0EXFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= ABI32_0_0EXFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
