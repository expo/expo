// Copyright 2015-present 650 Industries. All rights reserved.
#import <ABI34_0_0EXFileSystem/ABI34_0_0EXFilePermissionModule.h>
#import <ABI34_0_0UMFileSystemInterface/ABI34_0_0UMFileSystemInterface.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistry.h>

@interface ABI34_0_0EXFilePermissionModule ()

@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI34_0_0EXFilePermissionModule

ABI34_0_0UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI34_0_0UMFilePermissionModuleInterface)];
}

- (ABI34_0_0UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path
{
  ABI34_0_0UMFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path];
  if (permissionsForInternalDirectories != ABI34_0_0UMFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions:path];
  }
}

- (ABI34_0_0UMFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
{
  id<ABI34_0_0UMFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMFileSystemInterface)];
  NSArray<NSString *> *scopedDirs = @[fileSystem.cachesDirectory, fileSystem.documentDirectory];
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return ABI34_0_0UMFileSystemPermissionRead | ABI34_0_0UMFileSystemPermissionWrite;
    }
  }

  NSString *bundleDirectory = fileSystem.bundleDirectory;
  if (bundleDirectory != nil && [path hasPrefix:[bundleDirectory stringByAppendingString:@"/"]]) {
    return ABI34_0_0UMFileSystemPermissionRead;
  }

  return ABI34_0_0UMFileSystemPermissionNone;
}

- (ABI34_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  ABI34_0_0UMFileSystemPermissionFlags filePermissions = ABI34_0_0UMFileSystemPermissionNone;
  if ([[NSFileManager defaultManager] isReadableFileAtPath:path]) {
    filePermissions |= ABI34_0_0UMFileSystemPermissionRead;
  }

  if ([[NSFileManager defaultManager] isWritableFileAtPath:path]) {
    filePermissions |= ABI34_0_0UMFileSystemPermissionWrite;
  }

  return filePermissions;
}

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
