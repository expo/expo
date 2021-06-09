// Copyright 2015-present 650 Industries. All rights reserved.
#import <EXFileSystem/EXFilePermissionModule.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>

@interface EXFilePermissionModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXFilePermissionModule

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXFilePermissionModuleInterface)];
}

- (EXFileSystemPermissionFlags)getPathPermissions:(NSString *)path
{
  EXFileSystemPermissionFlags permissionsForInternalDirectories = [self getInternalPathPermissions:path];
  if (permissionsForInternalDirectories != EXFileSystemPermissionNone) {
    return permissionsForInternalDirectories;
  } else {
    return [self getExternalPathPermissions:path];
  }
}

- (EXFileSystemPermissionFlags)getInternalPathPermissions:(NSString *)path
{
  id<EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
  NSArray<NSString *> *scopedDirs = @[fileSystem.cachesDirectory, fileSystem.documentDirectory];
  NSString *standardizedPath = [path stringByStandardizingPath];
  for (NSString *scopedDirectory in scopedDirs) {
    if ([standardizedPath hasPrefix:[scopedDirectory stringByAppendingString:@"/"]] ||
        [standardizedPath isEqualToString:scopedDirectory]) {
      return EXFileSystemPermissionRead | EXFileSystemPermissionWrite;
    }
  }

  NSString *bundleDirectory = fileSystem.bundleDirectory;
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

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

@end
