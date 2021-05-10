
#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventEmitter.h>

@interface ABI40_0_0RCTConvert (ABI40_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI40_0_0EXStatusBarManager : ABI40_0_0RCTEventEmitter

@end
