
#import <UIKit/UIKit.h>

#import <ReactABI13_0_0/ABI13_0_0RCTConvert.h>
#import <ReactABI13_0_0/ABI13_0_0RCTEventEmitter.h>

@interface ABI13_0_0RCTConvert (ABI13_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI13_0_0EXStatusBarManager : ABI13_0_0RCTEventEmitter

@end
