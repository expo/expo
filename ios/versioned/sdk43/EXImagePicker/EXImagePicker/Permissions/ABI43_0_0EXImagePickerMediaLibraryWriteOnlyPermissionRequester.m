// Copyright 2017-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXImagePicker/ABI43_0_0EXImagePickerMediaLibraryWriteOnlyPermissionRequester.h>

#import <Photos/Photos.h>

@implementation ABI43_0_0EXImagePickerMediaLibraryWriteOnlyPermissionRequester

+ (NSString *)permissionType
{
  return @"mediaLibraryWriteOnly";
}

#ifdef __IPHONE_14_0
- (PHAccessLevel)accessLevel API_AVAILABLE(ios(14))
{
  return PHAccessLevelAddOnly;
}
#endif

@end
