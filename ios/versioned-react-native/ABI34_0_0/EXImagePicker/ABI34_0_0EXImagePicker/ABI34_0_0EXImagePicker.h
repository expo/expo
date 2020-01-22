#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI34_0_0EXImagePickerTarget) {
  ABI34_0_0EXImagePickerTargetCamera = 1,
  ABI34_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI34_0_0EXImagePicker : ABI34_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI34_0_0UMModuleRegistryConsumer>

@end
