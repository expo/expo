
#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventEmitter.h>

@interface ABI47_0_0RCTConvert (ABI47_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI47_0_0EXStatusBarManager : ABI47_0_0RCTEventEmitter

@end
