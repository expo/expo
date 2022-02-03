
#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>

@interface ABI42_0_0RCTConvert (ABI42_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI42_0_0EXStatusBarManager : ABI42_0_0RCTEventEmitter

@end
