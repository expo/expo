// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXFileSystem/ABI49_0_0EXFilePermissionModule.h>)
#import "ABI49_0_0EXScopedFilePermissionModule.h"
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXFileSystemInterface.h>

@interface ABI49_0_0EXFilePermissionModule (Protected)

- (ABI49_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@end

@interface ABI49_0_0EXScopedFilePermissionModule ()

@property (nonatomic, assign) BOOL isDetached;

@end

@implementation ABI49_0_0EXScopedFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI49_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _isDetached = ![constantsBinding.appOwnership isEqualToString:@"expo"];
  }
  return self;
}

- (ABI49_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return ABI49_0_0EXFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  return !_isDetached;
}

@end
#endif
