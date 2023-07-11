#define LOAD_SCREENS_HEADERS                                         \
  ((!ABI49_0_0RCT_NEW_ARCH_ENABLED && __has_include(<ABI49_0_0RNScreens/ABI49_0_0RNSScreen.h>)) \
  || (ABI49_0_0RCT_NEW_ARCH_ENABLED && __has_include(<ABI49_0_0RNScreens/ABI49_0_0RNSScreen.h>) && __cplusplus))

#if LOAD_SCREENS_HEADERS
#import <ABI49_0_0RNScreens/ABI49_0_0RNSScreen.h>
#import <ABI49_0_0RNScreens/ABI49_0_0RNSScreenStack.h>
#endif

@interface ABI49_0_0REAScreensHelper : NSObject

+ (UIView *)getScreenForView:(UIView *)view;
+ (UIView *)getStackForView:(UIView *)view;
+ (bool)isScreenModal:(UIView *)screen;
+ (UIView *)getScreenWrapper:(UIView *)view;
+ (int)getScreenType:(UIView *)screen;
+ (bool)isRNSScreenType:(UIView *)screen;

@end
