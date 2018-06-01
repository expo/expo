
#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventEmitter.h>

@interface ABI28_0_0RCTConvert (ABI28_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI28_0_0EXStatusBarManager : ABI28_0_0RCTEventEmitter

@end
