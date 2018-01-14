#import <ReactABI25_0_0/ABI25_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI25_0_0RNImagePickerTarget) {
  ABI25_0_0RNImagePickerTargetCamera = 1,
  ABI25_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI25_0_0EXImagePicker : NSObject <ABI25_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
