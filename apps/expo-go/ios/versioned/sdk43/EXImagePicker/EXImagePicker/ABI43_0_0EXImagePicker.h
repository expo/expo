#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI43_0_0EXImagePickerTarget) {
  ABI43_0_0EXImagePickerTargetCamera = 1,
  ABI43_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI43_0_0EXImagePicker : ABI43_0_0EXExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI43_0_0EXModuleRegistryConsumer>

@end
