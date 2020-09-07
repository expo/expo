#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI39_0_0EXImagePickerTarget) {
  ABI39_0_0EXImagePickerTargetCamera = 1,
  ABI39_0_0EXImagePickerTargetLibrarySingleImage,
};

@interface ABI39_0_0EXImagePicker : ABI39_0_0UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, ABI39_0_0UMModuleRegistryConsumer>

@end
