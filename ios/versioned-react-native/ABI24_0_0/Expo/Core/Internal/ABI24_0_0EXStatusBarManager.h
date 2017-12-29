
#import <UIKit/UIKit.h>

#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTEventEmitter.h>

@interface ABI24_0_0RCTConvert (ABI24_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI24_0_0EXStatusBarManager : ABI24_0_0RCTEventEmitter

@end
