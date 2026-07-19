
#import <UIKit/UIKit.h>

#import <React/RCTConvert.h>
#import <React/RCTEventEmitter.h>

@interface RCTConvert (EXStatusBar)

#if !TARGET_OS_TV
+ (UIStatusBarStyle)UIStatusBarStyle:(id)json;
+ (UIStatusBarAnimation)UIStatusBarAnimation:(id)json;
#endif

@end

@interface EXStatusBarManager : RCTEventEmitter

@end
