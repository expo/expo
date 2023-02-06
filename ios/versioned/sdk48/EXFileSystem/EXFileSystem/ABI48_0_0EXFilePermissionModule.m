// Copyright 2015-present 650 Industries. All rights reserved.
#import <ABI48_0_0EXFileSystem/ABI48_0_0EXFilePermissionModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFileSystemInterface.h>

@interface ABI48_0_0EXFilePermissionModule ()

@property (nonatomic, weak) ABI48_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI48_0_0EXFilePermissionModule

ABI48_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI48_0_0EXFilePermissionModuleInterface)];
}

- (ABI48_0_0EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
{
  ABI48_0_0EXFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path];
  if (permissionsForInternalDirectories != ABI48_0_0EXFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions:path];
  }
}

- (ABI48_0_0EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
{
  id<ABI48_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI48_0_0EXFileSystemInterface)];
  NSArray<NSString *> *scopedDirs = @[fileSystem.cachesDirectory, fileSystem.documentDirectory];
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return ABI48_0_0EXFileSystemPermissionRead | ABI48_0_0EXFileSystemPermissionWrite;
    }
  }

  NSString *bundleDirectory = fileSystem.bundleDirectory;
  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return ABI48_0_0EXFileSystemPermissionRead;
  }

  return ABI48_0_0EXFileSystemPermissionNone;
}

- (ABI48_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  ABI48_0_0EXFileSystemPermissionFlags filePermissions = ABI48_0_0EXFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= ABI48_0_0EXFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= ABI48_0_0EXFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
