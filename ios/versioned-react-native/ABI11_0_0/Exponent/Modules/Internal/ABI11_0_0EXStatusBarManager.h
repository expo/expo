
#import <UIKit/UIKit.h>

#import <ReactABI11_0_0/ABI11_0_0RCTConvert.h>
#import <ReactABI11_0_0/ABI11_0_0RCTEventEmitter.h>

@interface ABI11_0_0RCTConvert (ABI11_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI11_0_0EXStatusBarManager : ABI11_0_0RCTEventEmitter

@end
