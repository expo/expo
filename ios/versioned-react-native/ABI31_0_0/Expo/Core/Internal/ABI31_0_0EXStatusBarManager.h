
#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTConvert.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventEmitter.h>

@interface ABI31_0_0RCTConvert (ABI31_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI31_0_0EXStatusBarManager : ABI31_0_0RCTEventEmitter

@end
