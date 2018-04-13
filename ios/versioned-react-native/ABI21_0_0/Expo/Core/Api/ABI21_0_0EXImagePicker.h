#import "ABI21_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI21_0_0RNImagePickerTarget) {
  ABI21_0_0RNImagePickerTargetCamera = 1,
  ABI21_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI21_0_0EXImagePicker : ABI21_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
