// Copyright 2015-present 650 Industries. All rights reserved.
#import <ABI41_0_0EXFileSystem/ABI41_0_0EXFilePermissionModule.h>
#import <ABI41_0_0UMFileSystemInterface/ABI41_0_0UMFileSystemInterface.h>

@interface ABI41_0_0EXFilePermissionModule ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI41_0_0EXFilePermissionModule

ABI41_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI41_0_0UMFilePermissionModuleInterface)];
}

- (ABI41_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path
{
  ABI41_0_0UMFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path];
  if (permissionsForInternalDirectories != ABI41_0_0UMFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions:path];
  }
}

- (ABI41_0_0UMFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
{
  id<ABI41_0_0UMFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMFileSystemInterface)];
  NSArray<NSString *> *scopedDirs = @[fileSystem.cachesDirectory, fileSystem.documentDirectory];
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return ABI41_0_0UMFileSystemPermissionRead | ABI41_0_0UMFileSystemPermissionWrite;
    }
  }

  NSString *bundleDirectory = fileSystem.bundleDirectory;
  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return ABI41_0_0UMFileSystemPermissionRead;
  }

  return ABI41_0_0UMFileSystemPermissionNone;
}

- (ABI41_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  ABI41_0_0UMFileSystemPermissionFlags filePermissions = ABI41_0_0UMFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= ABI41_0_0UMFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= ABI41_0_0UMFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
