
#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventEmitter.h>

@interface ABI34_0_0RCTConvert (ABI34_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI34_0_0EXStatusBarManager : ABI34_0_0RCTEventEmitter

@end
