
#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventEmitter.h>

@interface ABI32_0_0RCTConvert (ABI32_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI32_0_0EXStatusBarManager : ABI32_0_0RCTEventEmitter

@end
