#import "ABI42_0_0RNSScreen.h"

@interface ABI42_0_0RNSScreenWindowTraits : NSObject

+ (void)updateWindowTraits;

+ (void)assertViewControllerBasedStatusBarAppearenceSet;
+ (void)updateStatusBarAppearance;
+ (void)enforceDesiredDeviceOrientation;

#if !TARGET_OS_TV
+ (UIStatusBarStyle)statusBarStyleForRNSStatusBarStyle:(ABI42_0_0RNSStatusBarStyle)statusBarStyle;
+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask;
+ (UIInterfaceOrientation)interfaceOrientationFromDeviceOrientation:(UIDeviceOrientation)deviceOrientation;
+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation;
#endif

@end
