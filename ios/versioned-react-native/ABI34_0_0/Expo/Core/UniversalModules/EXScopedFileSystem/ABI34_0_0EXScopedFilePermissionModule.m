// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI34_0_0EXFileSystem/ABI34_0_0EXFilePermissionModule.h>)
#import "ABI34_0_0EXScopedFilePermissionModule.h"
#import <ABI34_0_0UMFileSystemInterface/ABI34_0_0UMFileSystemInterface.h>
#import <ABI34_0_0UMConstantsInterface/ABI34_0_0UMConstantsInterface.h>

@interface ABI34_0_0EXFilePermissionModule (Protected)

- (ABI34_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@end

@interface ABI34_0_0EXScopedFilePermissionModule ()

@property (nonatomic, assign) BOOL isDetached;

@end

@implementation ABI34_0_0EXScopedFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI34_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _isDetached = ![constantsBinding.appOwnership isEqualToString:@"expo"];
  }
  return self;
}

- (ABI34_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return ABI34_0_0UMFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  return !_isDetached;
}

@end
#endif
