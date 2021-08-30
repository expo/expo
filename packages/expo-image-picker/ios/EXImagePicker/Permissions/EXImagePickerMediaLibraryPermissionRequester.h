// Copyright 2017-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>

#import <ExpoModulesCore/EXPermissionsInterface.h>

@interface EXImagePickerMediaLibraryPermissionRequester : NSObject<EXPermissionsRequester>

#if __IPHONE_14_0
- (PHAccessLevel)accessLevel API_AVAILABLE(ios(14));
#endif

@end
