
#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventEmitter.h>

@interface ABI48_0_0RCTConvert (ABI48_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI48_0_0EXStatusBarManager : ABI48_0_0RCTEventEmitter

@end
