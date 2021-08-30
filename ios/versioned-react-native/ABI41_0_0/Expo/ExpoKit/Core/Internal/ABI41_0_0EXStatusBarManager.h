
#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventEmitter.h>

@interface ABI41_0_0RCTConvert (ABI41_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI41_0_0EXStatusBarManager : ABI41_0_0RCTEventEmitter

@end
