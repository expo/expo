#import <ReactABI21_0_0/ABI21_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI21_0_0RNImagePickerTarget) {
  ABI21_0_0RNImagePickerTargetCamera = 1,
  ABI21_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI21_0_0EXImagePicker : NSObject <ABI21_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
