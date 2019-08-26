// Copyright 2015-present 650 Industries. All rights reserved.
#import "ABI32_0_0EXScopedFilePermissionModule.h"
#import <ABI32_0_0EXFileSystemInterface/ABI32_0_0EXFileSystemInterface.h>
#import <ABI32_0_0EXConstantsInterface/ABI32_0_0EXConstantsInterface.h>

@implementation ABI32_0_0EXScopedFilePermissionModule

- (ABI32_0_0EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return ABI32_0_0EXFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  id<ABI32_0_0EXConstantsInterface> constantsModule = [[self moduleRegistry] getModuleImplementingProtocol:@protocol(ABI32_0_0EXConstantsInterface)];
  return [@"expo" isEqualToString:constantsModule.appOwnership];
}

@end
