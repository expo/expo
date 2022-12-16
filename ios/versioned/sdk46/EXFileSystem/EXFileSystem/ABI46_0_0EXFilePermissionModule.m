// Copyright 2015-present 650 Industries. All rights reserved.
#import <ABI46_0_0EXFileSystem/ABI46_0_0EXFilePermissionModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFileSystemInterface.h>

@interface ABI46_0_0EXFilePermissionModule ()

@property (nonatomic, weak) ABI46_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI46_0_0EXFilePermissionModule

ABI46_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI46_0_0EXFilePermissionModuleInterface)];
}

- (ABI46_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
{
  ABI46_0_0EXFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path];
  if (permissionsForInternalDirectories != ABI46_0_0EXFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions:path];
  }
}

- (ABI46_0_0EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
{
  id<ABI46_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI46_0_0EXFileSystemInterface)];
  NSArray<NSString *> *scopedDirs = @[fileSystem.cachesDirectory, fileSystem.documentDirectory];
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return ABI46_0_0EXFileSystemPermissionRead | ABI46_0_0EXFileSystemPermissionWrite;
    }
  }

  NSString *bundleDirectory = fileSystem.bundleDirectory;
  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return ABI46_0_0EXFileSystemPermissionRead;
  }

  return ABI46_0_0EXFileSystemPermissionNone;
}

- (ABI46_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  ABI46_0_0EXFileSystemPermissionFlags filePermissions = ABI46_0_0EXFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= ABI46_0_0EXFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= ABI46_0_0EXFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
