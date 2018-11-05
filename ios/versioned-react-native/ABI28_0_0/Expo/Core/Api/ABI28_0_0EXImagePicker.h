#import "ABI28_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI28_0_0RNImagePickerTarget) {
  ABI28_0_0RNImagePickerTargetCamera = 1,
  ABI28_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI28_0_0EXImagePicker : ABI28_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
