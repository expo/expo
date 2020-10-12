// Copyright 2017-present 650 Industries. All rights reserved.

#import <EXImagePicker/EXImagePickerWriteOnlyMediaLibraryPermissionRequester.h>

#import <Photos/Photos.h>

@implementation EXImagePickerWriteOnlyMediaLibraryPermissionRequester

+ (NSString *)permissionType
{
  return @"writeOnlyMediaLibrary";
}

#ifdef __IPHONE_14_0
- (PHAccessLevel)accessLevel API_AVAILABLE(ios(14))
{
  return PHAccessLevelAddOnly;
}
#endif

@end
