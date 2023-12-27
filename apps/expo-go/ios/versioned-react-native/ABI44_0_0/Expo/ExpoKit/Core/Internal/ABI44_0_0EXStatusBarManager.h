
#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventEmitter.h>

@interface ABI44_0_0RCTConvert (ABI44_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI44_0_0EXStatusBarManager : ABI44_0_0RCTEventEmitter

@end
