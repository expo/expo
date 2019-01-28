#import "EXScopedBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, RNImagePickerTarget) {
  RNImagePickerTargetCamera = 1,
  RNImagePickerTargetLibrarySingleImage,
};

@interface EXImagePicker : EXScopedBridgeModule <UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
