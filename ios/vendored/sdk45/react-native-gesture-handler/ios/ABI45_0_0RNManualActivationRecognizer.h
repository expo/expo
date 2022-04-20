#import <UIKit/UIGestureRecognizerSubclass.h>

@class ABI45_0_0RNGestureHandler;

@interface ABI45_0_0RNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(ABI45_0_0RNGestureHandler *)gestureHandler;
- (void)fail;

@end
