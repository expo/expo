
#import <UIKit/UIKit.h>

#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTEventEmitter.h>

@interface ABI20_0_0RCTConvert (ABI20_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI20_0_0EXStatusBarManager : ABI20_0_0RCTEventEmitter

@end
