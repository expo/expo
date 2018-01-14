
#import <UIKit/UIKit.h>

#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventEmitter.h>

@interface ABI25_0_0RCTConvert (ABI25_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI25_0_0EXStatusBarManager : ABI25_0_0RCTEventEmitter

@end
