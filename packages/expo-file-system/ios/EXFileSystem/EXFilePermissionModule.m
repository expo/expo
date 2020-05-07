// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXFileSystem/EXFilePermissionModule.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>

@interface EXFilePermissionModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXFilePermissionModule

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMFilePermissionModuleInterface)];
}

- (UMFileSystemPermissionFlags)getPathPermissions:(NSString *)path
{
  UMFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path];
  if (permissionsForInternalDirectories != UMFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions:path];
  }
}

- (UMFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
{
  id<UMFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
  NSArray<NSString *> *scopedDirs = @[fileSystem.cachesDirectory, fileSystem.documentDirectory];
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return UMFileSystemPermissionRead | UMFileSystemPermissionWrite;
    }
  }

  NSString *bundleDirectory = fileSystem.bundleDirectory;
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
