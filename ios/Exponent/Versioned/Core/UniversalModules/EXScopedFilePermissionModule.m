// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXScopedFilePermissionModule.h"
#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

@implementation EXScopedFilePermissionModule

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  // may block access to external paths which contain "ExponentExperienceData" 
  if ([self shouldNotForbidAccessToExternalDirectories] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return EXFileSystemPermissionNone;
}

- (BOOL)shouldNotForbidAccessToExternalDirectories {
  id<EXConstantsInterface> constantsModule = [[self moduleRegistry] getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
  return ( constantsModule == nil || ( ![@"expo" isEqualToString:constantsModule.appOwnership] ) );
}

@end
