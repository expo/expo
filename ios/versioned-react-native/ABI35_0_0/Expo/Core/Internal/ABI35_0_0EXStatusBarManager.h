
#import <UIKit/UIKit.h>

#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventEmitter.h>

@interface ABI35_0_0RCTConvert (ABI35_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI35_0_0EXStatusBarManager : ABI35_0_0RCTEventEmitter

@end
