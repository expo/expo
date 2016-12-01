#import "ABI12_0_0RCTBridgeModule.h"
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, RNImagePickerTarget) {
  RNImagePickerTargetCamera = 1,
  RNImagePickerTargetLibrarySingleImage,
};

@interface ABI12_0_0EXImagePicker : NSObject <ABI12_0_0RCTBridgeModule, UINavigationControllerDelegate, UIActionSheetDelegate, UIImagePickerControllerDelegate>

@end
