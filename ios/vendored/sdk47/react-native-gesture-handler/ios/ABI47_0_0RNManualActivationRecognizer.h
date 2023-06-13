#import <UIKit/UIGestureRecognizerSubclass.h>

@class ABI47_0_0RNGestureHandler;

@interface ABI47_0_0RNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(ABI47_0_0RNGestureHandler *)gestureHandler;
- (void)fail;

@end
