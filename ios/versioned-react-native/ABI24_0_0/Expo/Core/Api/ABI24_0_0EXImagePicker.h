#import <ReactABI24_0_0/ABI24_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI24_0_0RNImagePickerTarget) {
  ABI24_0_0RNImagePickerTargetCamera = 1,
  ABI24_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI24_0_0EXImagePicker : NSObject <ABI24_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
