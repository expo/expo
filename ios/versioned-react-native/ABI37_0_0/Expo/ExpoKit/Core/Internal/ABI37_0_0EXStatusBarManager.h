
#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventEmitter.h>

@interface ABI37_0_0RCTConvert (ABI37_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI37_0_0EXStatusBarManager : ABI37_0_0RCTEventEmitter

@end
