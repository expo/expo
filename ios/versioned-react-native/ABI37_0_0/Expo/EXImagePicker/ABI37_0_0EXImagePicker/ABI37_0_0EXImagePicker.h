#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI37_0_0EXImagePickerTarget) {
  ABI37_0_0EXImagePickerTargetCamera = 1,
  ABI37_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI37_0_0EXImagePicker : ABI37_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI37_0_0UMModuleRegistryConsumer>

@end
