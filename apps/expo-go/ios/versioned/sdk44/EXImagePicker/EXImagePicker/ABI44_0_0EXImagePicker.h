#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI44_0_0EXImagePickerTarget) {
  ABI44_0_0EXImagePickerTargetCamera = 1,
  ABI44_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI44_0_0EXImagePicker : ABI44_0_0EXExportedModule <UIAdaptivePresentationControllerDelegate, UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI44_0_0EXModuleRegistryConsumer>

@end
