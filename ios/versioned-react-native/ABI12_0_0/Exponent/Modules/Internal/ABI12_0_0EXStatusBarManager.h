
#import <UIKit/UIKit.h>

#import <ReactABI12_0_0/ABI12_0_0RCTConvert.h>
#import <ReactABI12_0_0/ABI12_0_0RCTEventEmitter.h>

@interface ABI12_0_0RCTConvert (ABI12_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI12_0_0EXStatusBarManager : ABI12_0_0RCTEventEmitter

@end
