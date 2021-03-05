// Copyright 2017-present 650 Industries. All rights reserved.

#import <UMPermissionsInterface/UMPermissionsInterface.h>
#import <Photos/Photos.h>

@interface EXImagePickerMediaLibraryPermissionRequester : NSObject<UMPermissionsRequester>

#if __IPHONE_14_0
- (PHAccessLevel)accessLevel API_AVAILABLE(ios(14));
#endif

@end
