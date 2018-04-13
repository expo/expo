#import "ABI26_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI26_0_0RNImagePickerTarget) {
  ABI26_0_0RNImagePickerTargetCamera = 1,
  ABI26_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI26_0_0EXImagePicker : ABI26_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
