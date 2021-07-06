#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI40_0_0EXImagePickerTarget) {
  ABI40_0_0EXImagePickerTargetCamera = 1,
  ABI40_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI40_0_0EXImagePicker : ABI40_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI40_0_0UMModuleRegistryConsumer>

@end
