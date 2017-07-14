#import <ReactABI19_0_0/ABI19_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, ABI19_0_0RNImagePickerTarget) {
  ABI19_0_0RNImagePickerTargetCamera = 1,
  ABI19_0_0RNImagePickerTargetLibrarySingleImage,
};

@interface ABI19_0_0EXImagePicker : NSObject <ABI19_0_0RCTBridgeModule, UINavigationControllerDelegate, UIImagePickerControllerDelegate>

@end
