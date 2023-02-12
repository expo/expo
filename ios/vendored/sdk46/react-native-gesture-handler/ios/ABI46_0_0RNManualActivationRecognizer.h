#import <UIKit/UIGestureRecognizerSubclass.h>

@class ABI46_0_0RNGestureHandler;

@interface ABI46_0_0RNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(ABI46_0_0RNGestureHandler *)gestureHandler;
- (void)fail;

@end
