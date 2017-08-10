#import <ReactABI20_0_0/ABI20_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI20_0_0RNImagePickerTarget) {
  ABI20_0_0RNImagePickerTargetCamera = 1,
  ABI20_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI20_0_0EXImagePicker : NSObject <ABI20_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
