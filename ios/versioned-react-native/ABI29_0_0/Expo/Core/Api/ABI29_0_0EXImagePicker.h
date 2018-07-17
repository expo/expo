#import "ABI29_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI29_0_0RNImagePickerTarget) {
  ABI29_0_0RNImagePickerTargetCamera = 1,
  ABI29_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI29_0_0EXImagePicker : ABI29_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
