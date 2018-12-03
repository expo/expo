// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXScopedFilePermissionModule.h"
#import <EXFileSystemInterface/EXFileSystemInterface.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

@implementation EXScopedFilePermissionModule

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  if ([self notExpoClient] || (![path containsString:@"ExponentExperienceData"])) {
    return [super getExternalPathPermissions:path];
  }
  return EXFileSystemPermissionNone;
}

- (bool)notExpoClient {
  id<EXConstantsInterface> constantsModule = [[self moduleRegistry] getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
  return ( constantsModule == nil || ( ![@"expo" isEqualToString:constantsModule.appOwnership] ) );
}

@end
