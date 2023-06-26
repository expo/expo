#import <UIKit/UIGestureRecognizerSubclass.h>

@class ABI49_0_0RNGestureHandler;

@interface ABI49_0_0RNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(ABI49_0_0RNGestureHandler *)gestureHandler;
- (void)fail;

@end
