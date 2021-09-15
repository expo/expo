#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI42_0_0EXImagePickerTarget) {
  ABI42_0_0EXImagePickerTargetCamera = 1,
  ABI42_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI42_0_0EXImagePicker : ABI42_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI42_0_0UMModuleRegistryConsumer>

@end
