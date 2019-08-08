#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, EXImagePickerTarget) {
  EXImagePickerTargetCamera = 1,
  EXImagePickerTargetLibrarySingleImage,
};

@interface EXImagePicker : UMExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, UMModuleRegistryConsumer>

@end
