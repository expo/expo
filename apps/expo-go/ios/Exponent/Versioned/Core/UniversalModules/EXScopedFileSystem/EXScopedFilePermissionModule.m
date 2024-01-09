// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ExpoFileSystem/EXFilePermissionModule.h>)
#import "EXScopedFilePermissionModule.h"
#import <ExpoModulesCore/EXFileSystemInterface.h>

@interface EXFilePermissionModule (Protected)

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@end

@interface EXScopedFilePermissionModule ()

@end

@implementation EXScopedFilePermissionModule

- (instancetype)initWithConstantsBinding:(EXConstantsBinding *)constantsBinding
{
  return [super init];
}

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return EXFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  return true;
}

@end
#endif
