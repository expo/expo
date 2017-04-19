
#import <UIKit/UIKit.h>

#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventEmitter.h>

@interface ABI14_0_0RCTConvert (ABI14_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI14_0_0EXStatusBarManager : ABI14_0_0RCTEventEmitter

@end
