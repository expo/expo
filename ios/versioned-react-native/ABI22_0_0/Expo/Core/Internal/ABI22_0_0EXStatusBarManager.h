
#import <UIKit/UIKit.h>

#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTEventEmitter.h>

@interface ABI22_0_0RCTConvert (ABI22_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI22_0_0EXStatusBarManager : ABI22_0_0RCTEventEmitter

@end
