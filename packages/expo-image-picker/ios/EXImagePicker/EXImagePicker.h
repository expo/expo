#import <EXCore/EXExportedModule.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, EXImagePickerTarget) {
  EXImagePickerTargetCamera = 1,
  EXImagePickerTargetLibrarySingleImage,
};

@interface EXImagePicker : EXExportedModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate, EXModuleRegistryConsumer>

@end
