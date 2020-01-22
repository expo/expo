// Copyright 2015-present 650 Industries. All rights reserved.
#import "ABI33_0_0EXScopedFilePermissionModule.h"
#import <ABI33_0_0UMFileSystemInterface/ABI33_0_0UMFileSystemInterface.h>
#import <ABI33_0_0UMConstantsInterface/ABI33_0_0UMConstantsInterface.h>

@interface ABI33_0_0EXFilePermissionModule (Protected)

- (ABI33_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path;

@end

@interface ABI33_0_0EXScopedFilePermissionModule ()

@property (nonatomic, assign) BOOL isDetached;

@end

@implementation ABI33_0_0EXScopedFilePermissionModule

- (instancetype)initWithConstantsBinding:(ABI33_0_0EXConstantsBinding *)constantsBinding
{
  if (self = [super init]) {
    _isDetached = ![constantsBinding.appOwnership isEqualToString:@"expo"];
  }
  return self;
}

- (ABI33_0_0UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return ABI33_0_0UMFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  return !_isDetached;
}

@end
