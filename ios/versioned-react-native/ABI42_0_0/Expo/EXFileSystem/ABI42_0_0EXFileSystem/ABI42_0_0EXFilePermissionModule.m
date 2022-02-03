// Copyright 2015-present 650 Industries. All rights reserved.
#import <ABI42_0_0EXFileSystem/ABI42_0_0EXFilePermissionModule.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFileSystemInterface.h>

@interface ABI42_0_0EXFilePermissionModule ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI42_0_0EXFilePermissionModule

ABI42_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI42_0_0EXFilePermissionModuleInterface)];
}

- (ABI42_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
{
  ABI42_0_0EXFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path];
  if (permissionsForInternalDirectories != ABI42_0_0EXFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions:path];
  }
}

- (ABI42_0_0EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
{
  id<ABI42_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXFileSystemInterface)];
  NSArray<NSString *> *scopedDirs = @[fileSystem.cachesDirectory, fileSystem.documentDirectory];
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return ABI42_0_0EXFileSystemPermissionRead | ABI42_0_0EXFileSystemPermissionWrite;
    }
  }

  NSString *bundleDirectory = fileSystem.bundleDirectory;
  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return ABI42_0_0EXFileSystemPermissionRead;
  }

  return ABI42_0_0EXFileSystemPermissionNone;
}

- (ABI42_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  ABI42_0_0EXFileSystemPermissionFlags filePermissions = ABI42_0_0EXFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= ABI42_0_0EXFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= ABI42_0_0EXFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
