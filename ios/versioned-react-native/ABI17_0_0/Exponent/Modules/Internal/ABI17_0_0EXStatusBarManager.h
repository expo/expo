
#import <UIKit/UIKit.h>

#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTEventEmitter.h>

@interface ABI17_0_0RCTConvert (ABI17_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI17_0_0EXStatusBarManager : ABI17_0_0RCTEventEmitter

@end
