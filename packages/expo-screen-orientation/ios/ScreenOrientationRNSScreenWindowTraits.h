#import <UIKit/UIKit.h>

// This is necessary for the shouldUseRNSScreensOrientation function in ScreenOrientationViewController
// This is a copy of the RNSScreens Protocol
@protocol ScreenOrientationRNSScreenWindowTraits

+ (BOOL)shouldAskScreensForScreenOrientationInViewController:(UIViewController *)vc;

@end
