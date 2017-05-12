#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI17_0_0RNImagePickerTarget) {
  ABI17_0_0RNImagePickerTargetCamera = 1,
  ABI17_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI17_0_0EXImagePicker : NSObject <ABI17_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
