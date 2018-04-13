#import "ABI23_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI23_0_0RNImagePickerTarget) {
  ABI23_0_0RNImagePickerTargetCamera = 1,
  ABI23_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI23_0_0EXImagePicker : ABI23_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
