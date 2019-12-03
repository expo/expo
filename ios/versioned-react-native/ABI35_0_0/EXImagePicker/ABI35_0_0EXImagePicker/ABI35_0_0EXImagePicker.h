#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI35_0_0EXImagePickerTarget) {
  ABI35_0_0EXImagePickerTargetCamera = 1,
  ABI35_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI35_0_0EXImagePicker : ABI35_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI35_0_0UMModuleRegistryConsumer>

@end
