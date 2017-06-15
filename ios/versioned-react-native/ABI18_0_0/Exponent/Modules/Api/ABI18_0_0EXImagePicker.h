#import <ReactABI18_0_0/ABI18_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI18_0_0RNImagePickerTarget) {
  ABI18_0_0RNImagePickerTargetCamera = 1,
  ABI18_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI18_0_0EXImagePicker : NSObject <ABI18_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
