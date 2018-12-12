// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXScopedFilePermissionModule.h"
#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

@implementation EXScopedFilePermissionModule

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if (![self shouldForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return EXFileSystemPermissionNone;
}

- (BOOL)shouldForbidAccessToExternalDirectories {
  id<EXConstantsInterface> constantsModule = [[self moduleRegistry] getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
  return [@"expo" isEqualToString:constantsModule.appOwnership];
}

@end
