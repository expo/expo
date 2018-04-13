#import "ABI22_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI22_0_0RNImagePickerTarget) {
  ABI22_0_0RNImagePickerTargetCamera = 1,
  ABI22_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI22_0_0EXImagePicker : ABI22_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
