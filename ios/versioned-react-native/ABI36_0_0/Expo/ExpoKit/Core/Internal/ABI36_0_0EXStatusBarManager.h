
#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventEmitter.h>

@interface ABI36_0_0RCTConvert (ABI36_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI36_0_0EXStatusBarManager : ABI36_0_0RCTEventEmitter

@end
