#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI33_0_0EXImagePickerTarget) {
  ABI33_0_0EXImagePickerTargetCamera = 1,
  ABI33_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI33_0_0EXImagePicker : ABI33_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI33_0_0UMModuleRegistryConsumer>

@end
