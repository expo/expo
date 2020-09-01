
#import <UIKit/UIKit.h>

#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventEmitter.h>

@interface ABI39_0_0RCTConvert (ABI39_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI39_0_0EXStatusBarManager : ABI39_0_0RCTEventEmitter

@end
