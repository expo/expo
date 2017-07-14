
#import <UIKit/UIKit.h>

#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTEventEmitter.h>

@interface ABI19_0_0RCTConvert (ABI19_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI19_0_0EXStatusBarManager : ABI19_0_0RCTEventEmitter

@end
