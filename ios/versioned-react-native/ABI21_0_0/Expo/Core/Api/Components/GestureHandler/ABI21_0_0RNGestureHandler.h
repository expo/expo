#import "ABI21_0_0RNGestureHandlerState.h"
#import "ABI21_0_0RNGestureHandlerEvents.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol ABI21_0_0RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(ABI21_0_0RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(ABI21_0_0RNGestureHandlerStateChange *)event;

@end

@protocol ABI21_0_0RNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureHandlerDidActivateInRootView:(UIView *)rootView;

@end


@interface ABI21_0_0RNGestureHandler : NSObject {

@protected UIGestureRecognizer *_recognizer;
@protected ABI21_0_0RNGestureHandlerState _lastState;

}

- (instancetype)initWithTag:(NSNumber *)tag;

@property (nonatomic, readonly) NSNumber *tag;
@property (nonatomic, weak) id<ABI21_0_0RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly) UIGestureRecognizer *recognizer;

- (void)bindToView:(UIView *)view;
- (void)unbindFromView;
- (void)configure:(NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(id)recognizer;
- (ABI21_0_0RNGestureHandlerState)state;
- (ABI21_0_0RNGestureHandlerEventExtraData *)eventExtraData:(id)recognizer;

@end

@interface ABI21_0_0RNGestureHandlerRegistry : NSObject

- (ABI21_0_0RNGestureHandler *)handlerWithTag:(NSNumber *)handlerTag;
- (void)registerGestureHandler:(ABI21_0_0RNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(NSNumber *)handlerTag toView:(UIView *)view;
- (void)dropHandlerWithTag:(NSNumber *)handlerTag;

@end


@interface ABI21_0_0RNPanGestureHandler : ABI21_0_0RNGestureHandler
@end

@interface ABI21_0_0RNTapGestureHandler : ABI21_0_0RNGestureHandler
@end

@interface ABI21_0_0RNLongPressGestureHandler : ABI21_0_0RNGestureHandler
@end

@interface ABI21_0_0RNNativeViewGestureHandler : ABI21_0_0RNGestureHandler
@end

@interface ABI21_0_0RNPinchGestureHandler : ABI21_0_0RNGestureHandler
@end

@interface ABI21_0_0RNRotationGestureHandler : ABI21_0_0RNGestureHandler
@end

@interface ABI21_0_0RNRootViewGestureRecognizer : UIGestureRecognizer

@property (nullable, nonatomic, weak) id<ABI21_0_0RNRootViewGestureRecognizerDelegate> delegate;

- (void)blockOtherRecognizers;

@end

@interface ABI21_0_0RNGestureHandlerButton : UIControl
@end

