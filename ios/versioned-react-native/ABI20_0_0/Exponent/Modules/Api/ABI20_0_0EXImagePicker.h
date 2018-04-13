#import "ABI20_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI20_0_0RNImagePickerTarget) {
  ABI20_0_0RNImagePickerTargetCamera = 1,
  ABI20_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI20_0_0EXImagePicker : ABI20_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
