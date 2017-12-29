#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI23_0_0RNImagePickerTarget) {
  ABI23_0_0RNImagePickerTargetCamera = 1,
  ABI23_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI23_0_0EXImagePicker : NSObject <ABI23_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
