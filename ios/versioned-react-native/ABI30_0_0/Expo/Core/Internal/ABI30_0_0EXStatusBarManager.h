
#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventEmitter.h>

@interface ABI30_0_0RCTConvert (ABI30_0_0EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface ABI30_0_0EXStatusBarManager : ABI30_0_0RCTEventEmitter

@end
