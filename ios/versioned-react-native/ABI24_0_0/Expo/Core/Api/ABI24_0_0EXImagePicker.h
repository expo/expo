#import "ABI24_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI24_0_0RNImagePickerTarget) {
  ABI24_0_0RNImagePickerTargetCamera = 1,
  ABI24_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI24_0_0EXImagePicker : ABI24_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end

