#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI38_0_0EXImagePickerTarget) {
  ABI38_0_0EXImagePickerTargetCamera = 1,
  ABI38_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI38_0_0EXImagePicker : ABI38_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI38_0_0UMModuleRegistryConsumer>

@end
