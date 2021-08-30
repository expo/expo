#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI41_0_0EXImagePickerTarget) {
  ABI41_0_0EXImagePickerTargetCamera = 1,
  ABI41_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI41_0_0EXImagePicker : ABI41_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI41_0_0UMModuleRegistryConsumer>

@end
