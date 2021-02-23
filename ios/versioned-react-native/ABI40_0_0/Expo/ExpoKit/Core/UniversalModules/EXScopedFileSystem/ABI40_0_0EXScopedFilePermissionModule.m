// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXFileSystem/ABI40_0_0EXFilePermissionModule.h>)
#import "ABI40_0_0EXScopedFilePermissionModule.h"
#import <ABI40_0_0UMFileSystemInterface/ABI40_0_0UMFileSystemInterface.h>
#import <ABI40_0_0UMConstantsInterface/ABI40_0_0UMConstantsInterface.h>

@interface ABI40_0_0EXFilePermissionModule (Protected)

- (ABI40_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@end

@interface ABI40_0_0EXScopedFilePermissionModule ()

@property (nonatomic, assign) BOOL isDetached;

@end

@implementation ABI40_0_0EXScopedFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI40_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _isDetached = ![constantsBinding.appOwnership isEqualToString:@"expo"];
  }
  return self;
}

- (ABI40_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return ABI40_0_0UMFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  return !_isDetached;
}

@end
#endif
