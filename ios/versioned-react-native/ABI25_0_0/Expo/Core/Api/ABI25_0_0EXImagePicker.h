#import "ABI25_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI25_0_0RNImagePickerTarget) {
  ABI25_0_0RNImagePickerTargetCamera = 1,
  ABI25_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI25_0_0EXImagePicker : ABI25_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
