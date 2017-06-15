
#import <UIKit/UIKit.h>

#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTEventEmitter.h>

@interface ABI18_0_0RCTConvert (ABI18_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI18_0_0EXStatusBarManager : ABI18_0_0RCTEventEmitter

@end
