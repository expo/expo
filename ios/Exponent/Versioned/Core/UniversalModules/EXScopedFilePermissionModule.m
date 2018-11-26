// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXScopedFilePermissionModule.h"
#import <EXFileSystemInterface/EXFileSystemInterface.h>

@implementation EXScopedFilePermissionModule

- (EXFileSystemPermissionFlags)getExternalPathPermissions:(NSString *)path
{
  return EXFileSystemPermissionNone;
}

@end
