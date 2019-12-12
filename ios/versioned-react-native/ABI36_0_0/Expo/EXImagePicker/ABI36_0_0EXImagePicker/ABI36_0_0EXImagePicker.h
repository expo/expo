#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI36_0_0EXImagePickerTarget) {
  ABI36_0_0EXImagePickerTargetCamera = 1,
  ABI36_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI36_0_0EXImagePicker : ABI36_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI36_0_0UMModuleRegistryConsumer>

@end
