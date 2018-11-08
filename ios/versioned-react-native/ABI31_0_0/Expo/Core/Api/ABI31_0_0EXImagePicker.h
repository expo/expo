#import "ABI31_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI31_0_0RNImagePickerTarget) {
  ABI31_0_0RNImagePickerTargetCamera = 1,
  ABI31_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI31_0_0EXImagePicker : ABI31_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
