
#import <UIKit/UIKit.h>

#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventEmitter.h>

@interface ABI21_0_0RCTConvert (ABI21_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI21_0_0EXStatusBarManager : ABI21_0_0RCTEventEmitter

@end
