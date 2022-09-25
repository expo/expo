#import <UIKit/UIGestureRecognizerSubclass.h>

@class RNGestureHandler;

@interface RNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler;
- (void)fail;

@end
