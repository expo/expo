// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXFileSystem/EXFilePermissionModule.h>
#import <UMCore/UMModuleRegistry.h>

@implementation EXFilePermissionModule

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMFilePermissionModuleInterface)];
}

- (UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path
                                       scopedDirs:(NSArray<NSString *> *)scopedDirs
{
  NSString * bundleDirectory = [[_moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemManager)] bundleDirectoryForExperienceId:_moduleRegistry.experienceId];
  UMFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path
                                                                                            scopedDirs:scopedDirs
                                                                                       bundleDirectory:bundleDirectory];
  if (permissionsForInternalDirectories != UMFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions: path];
  }
}

- (UMFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
                                               scopedDirs:(NSArray<NSString *> *)scopedDirs
                                          bundleDirectory:(NSString *)bundleDirectory
{
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return UMFileSystemPermissionRead | UMFileSystemPermissionWrite;
    }
  }

  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return UMFileSystemPermissionRead;
  }

  return UMFileSystemPermissionNone;
}

- (UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  UMFileSystemPermissionFlags filePermissions = UMFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= UMFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= UMFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
