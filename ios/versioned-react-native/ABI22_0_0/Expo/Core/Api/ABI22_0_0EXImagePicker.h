#import <ReactABI22_0_0/ABI22_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI22_0_0RNImagePickerTarget) {
  ABI22_0_0RNImagePickerTargetCamera = 1,
  ABI22_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI22_0_0EXImagePicker : NSObject <ABI22_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
