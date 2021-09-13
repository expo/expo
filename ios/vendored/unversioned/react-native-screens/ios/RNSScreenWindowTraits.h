#import "RNSScreen.h"

@interface RNSScreenWindowTraits : NSObject

+ (void)updateWindowTraits;

#if !TARGET_OS_TV
+ (void)assertViewControllerBasedStatusBarAppearenceSet;
#endif
+ (void)updateStatusBarAppearance;
+ (void)enforceDesiredDeviceOrientation;

#if !TARGET_OS_TV
+ (UIStatusBarStyle)statusBarStyleForRNSStatusBarStyle:(RNSStatusBarStyle)statusBarStyle;
+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask;
+ (UIInterfaceOrientation)interfaceOrientationFromDeviceOrientation:(UIDeviceOrientation)deviceOrientation;
+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation;
#endif

@end
