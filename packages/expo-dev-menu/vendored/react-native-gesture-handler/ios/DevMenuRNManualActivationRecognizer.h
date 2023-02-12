#import <UIKit/UIGestureRecognizerSubclass.h>

@class DevMenuRNGestureHandler;

@interface DevMenuRNManualActivationRecognizer : UIGestureRecognizer <UIGestureRecognizerDelegate>

- (id)initWithGestureHandler:(DevMenuRNGestureHandler *)gestureHandler;
- (void)fail;

@end
