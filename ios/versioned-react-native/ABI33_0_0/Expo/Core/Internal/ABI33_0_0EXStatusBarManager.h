
#import <UIKit/UIKit.h>

#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>
#import <ReactABI33_0_0/ABI33_0_0RCTEventEmitter.h>

@interface ABI33_0_0RCTConvert (ABI33_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI33_0_0EXStatusBarManager : ABI33_0_0RCTEventEmitter

@end
