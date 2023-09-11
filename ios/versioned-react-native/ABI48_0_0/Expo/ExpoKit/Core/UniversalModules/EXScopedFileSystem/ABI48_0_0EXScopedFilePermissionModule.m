// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI48_0_0EXFileSystem/ABI48_0_0EXFilePermissionModule.h>)
#import "ABI48_0_0EXScopedFilePermissionModule.h"
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFileSystemInterface.h>

@interface ABI48_0_0EXFilePermissionModule (Protected)

- (ABI48_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@end

@interface ABI48_0_0EXScopedFilePermissionModule ()

@property (nonatomic, assign) BOOL isDetached;

@end

@implementation ABI48_0_0EXScopedFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI48_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _isDetached = ![constantsBinding.appOwnership isEqualToString:@"expo"];
  }
  return self;
}

- (ABI48_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return ABI48_0_0EXFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  return !_isDetached;
}

@end
#endif
