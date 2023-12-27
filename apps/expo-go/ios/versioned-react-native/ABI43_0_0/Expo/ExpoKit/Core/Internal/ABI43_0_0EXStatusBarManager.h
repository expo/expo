
#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventEmitter.h>

@interface ABI43_0_0RCTConvert (ABI43_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI43_0_0EXStatusBarManager : ABI43_0_0RCTEventEmitter

@end
