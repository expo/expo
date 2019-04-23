// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXScopedFilePermissionModule.h"
#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <UMConstantsInterface/UMConstantsInterface.h>

@implementation EXScopedFilePermissionModule

- (UMFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return UMFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  id<UMConstantsInterface> constantsModule = [[self moduleRegistry] getModuleImplementingProtocol:@protocol(UMConstantsInterface)];
  return [@"expo" isEqualToString:constantsModule.appOwnership];
}

@end
