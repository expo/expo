
#import <UIKit/UIKit.h>

#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTEventEmitter.h>

@interface ABI16_0_0RCTConvert (ABI16_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI16_0_0EXStatusBarManager : ABI16_0_0RCTEventEmitter

@end
