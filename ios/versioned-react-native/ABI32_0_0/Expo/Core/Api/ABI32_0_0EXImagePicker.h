#import "ABI32_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI32_0_0RNImagePickerTarget) {
  ABI32_0_0RNImagePickerTargetCamera = 1,
  ABI32_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI32_0_0EXImagePicker : ABI32_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
