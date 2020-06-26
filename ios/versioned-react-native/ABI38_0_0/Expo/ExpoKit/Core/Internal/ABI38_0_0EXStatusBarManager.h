
#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventEmitter.h>

@interface ABI38_0_0RCTConvert (ABI38_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI38_0_0EXStatusBarManager : ABI38_0_0RCTEventEmitter

@end
