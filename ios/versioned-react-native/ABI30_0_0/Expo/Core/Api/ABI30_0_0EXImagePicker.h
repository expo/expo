#import "ABI30_0_0EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI30_0_0RNImagePickerTarget) {
  ABI30_0_0RNImagePickerTargetCamera = 1,
  ABI30_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI30_0_0EXImagePicker : ABI30_0_0EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
