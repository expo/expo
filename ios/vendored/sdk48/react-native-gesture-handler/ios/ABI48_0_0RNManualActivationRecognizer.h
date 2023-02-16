#import <UIKit/UIGestureRecognizerSubclass.h>

@class ABI48_0_0RNGestureHandler;

@interface ABI48_0_0RNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(ABI48_0_0RNGestureHandler *)gestureHandler;
- (void)fail;

@end
