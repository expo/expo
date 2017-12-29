
#import <UIKit/UIKit.h>

#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTEventEmitter.h>

@interface ABI23_0_0RCTConvert (ABI23_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI23_0_0EXStatusBarManager : ABI23_0_0RCTEventEmitter

@end
