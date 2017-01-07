#import <ReactABI13_0_0/ABI13_0_0RCTBridgeModule.h>
#import <UIKit/UIKit.h>

typedef NS_ENUM(NSInteger, RNImagePickerTarget) {
  RNImagePickerTargetCamera = 1,
  RNImagePickerTargetLibrarySingleImage,
};

@interface ABI13_0_0EXImagePicker : NSObject <ABI13_0_0RCTBridgeModule, UINavigationControllerDelegate, UIActionSheetDelegate, UIImagePickerControllerDelegate>

@end
