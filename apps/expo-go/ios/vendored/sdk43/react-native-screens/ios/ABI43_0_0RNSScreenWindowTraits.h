#import "ABI43_0_0RNSScreen.h"

@interface ABI43_0_0RNSScreenWindowTraits : NSObject

+ (void)updateWindowTraits;

#if !TARGET_OS_TV
+ (void)assertViewControllerBasedStatusBarAppearenceSet;
#endif
+ (void)updateStatusBarAppearance;
+ (void)enforceDesiredDeviceOrientation;

#if !TARGET_OS_TV
+ (UIStatusBarStyle)statusBarStyleForRNSStatusBarStyle:(ABI43_0_0RNSStatusBarStyle)statusBarStyle;
+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask;
+ (UIInterfaceOrientation)interfaceOrientationFromDeviceOrientation:(UIDeviceOrientation)deviceOrientation;
+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation;
#endif

+ (BOOL)shouldAskScreensForTrait:(ABI43_0_0RNSWindowTrait)trait
                 includingModals:(BOOL)includingModals
                inViewController:(UIViewController *)vc;
+ (BOOL)shouldAskScreensForScreenOrientationInViewController:(UIViewController *)vc;

@end
