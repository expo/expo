
#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventEmitter.h>

@interface ABI26_0_0RCTConvert (ABI26_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI26_0_0EXStatusBarManager : ABI26_0_0RCTEventEmitter

@end
