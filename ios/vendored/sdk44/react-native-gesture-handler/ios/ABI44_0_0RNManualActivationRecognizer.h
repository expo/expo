#import <UIKit/UIGestureRecognizerSubclass.h>

@class ABI44_0_0RNGestureHandler;

@interface ABI44_0_0RNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(ABI44_0_0RNGestureHandler *)gestureHandler;
- (void)fail;

@end
