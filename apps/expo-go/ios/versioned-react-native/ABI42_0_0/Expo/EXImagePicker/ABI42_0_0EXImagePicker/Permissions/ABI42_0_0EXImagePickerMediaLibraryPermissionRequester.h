// Copyright 2017-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>

#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>

@interface ABI42_0_0EXImagePickerMediaLibraryPermissionRequester : NSObject<ABI42_0_0EXPermissionsRequester>

#if __IPHONE_14_0
- (PHAccessLevel)accessLevel API_AVAILABLE(ios(14));
#endif

@end
