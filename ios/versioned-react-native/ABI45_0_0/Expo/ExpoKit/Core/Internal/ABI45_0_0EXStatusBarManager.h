
#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventEmitter.h>

@interface ABI45_0_0RCTConvert (ABI45_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI45_0_0EXStatusBarManager : ABI45_0_0RCTEventEmitter

@end
