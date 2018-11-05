
#import <UIKit/UIKit.h>

#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>
#import <ReactABI29_0_0/ABI29_0_0RCTEventEmitter.h>

@interface ABI29_0_0RCTConvert (ABI29_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI29_0_0EXStatusBarManager : ABI29_0_0RCTEventEmitter

@end
