#import "ABI27_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI27_0_0RNImagePickerTarget) {
  ABI27_0_0RNImagePickerTargetCamera = 1,
  ABI27_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI27_0_0EXImagePicker : ABI27_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
