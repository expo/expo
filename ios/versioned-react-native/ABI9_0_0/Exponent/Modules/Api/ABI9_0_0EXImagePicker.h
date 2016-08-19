#import "ABI9_0_0RCTBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, RNImagePickerTarget) {
  RNImagePickerTargetCamera = 1,
  RNImagePickerTargetLibrarySingleImage,
};

@interface ABI9_0_0EXImagePicker : NSObject <ABI9_0_0RCTBridgeModule, UINavigationControllerDelegate, UIActionSheetDelegate, UIImagePickerControllerDelegate>

@end
