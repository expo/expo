
#import <UIKit/UIKit.h>

#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventEmitter.h>

@interface ABI27_0_0RCTConvert (ABI27_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI27_0_0EXStatusBarManager : ABI27_0_0RCTEventEmitter

@end
