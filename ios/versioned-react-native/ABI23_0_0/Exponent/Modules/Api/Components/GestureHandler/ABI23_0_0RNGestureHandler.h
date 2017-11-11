#import "ABI23_0_0RNGestureHandlerState.h"
#import "ABI23_0_0RNGestureHandlerEvents.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol ABI23_0_0RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(nonnull ABI23_0_0RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(nonnull ABI23_0_0RNGestureHandlerStateChange *)event;

@end


@protocol ABI23_0_0RNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureRecognizer:(nullable UIGestureRecognizer *)gestureRecognizer
    didActivateInRootView:(nullable UIView *)rootView;

@end


@interface ABI23_0_0RNGestureHandler : NSObject {

@protected UIGestureRecognizer *_recognizer;
@protected ABI23_0_0RNGestureHandlerState _lastState;

}

+ (nullable ABI23_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(nonnull UIGestureRecognizer *)recognizer;

- (nonnull instancetype)initWithTag:(nonnull NSNumber *)tag;

@property (nonatomic, readonly, nonnull) NSNumber *tag;
@property (nonatomic, weak, nullable) id<ABI23_0_0RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly, nullable) UIGestureRecognizer *recognizer;
@property (nonatomic) BOOL enabled;

- (void)bindToView:(nonnull UIView *)view;
- (void)unbindFromView;
- (void)configure:(nullable NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(nonnull id)recognizer;
- (ABI23_0_0RNGestureHandlerState)state;
- (nullable ABI23_0_0RNGestureHandlerEventExtraData *)eventExtraData:(nonnull id)recognizer;

@end

@interface ABI23_0_0RNGestureHandlerRegistry : NSObject

- (nullable ABI23_0_0RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)registerGestureHandler:(nonnull ABI23_0_0RNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(nonnull NSNumber *)handlerTag toView:(nonnull UIView *)view;
- (void)dropHandlerWithTag:(nonnull NSNumber *)handlerTag;

@end


@interface ABI23_0_0RNPanGestureHandler : ABI23_0_0RNGestureHandler
@end

@interface ABI23_0_0RNTapGestureHandler : ABI23_0_0RNGestureHandler
@end

@interface ABI23_0_0RNLongPressGestureHandler : ABI23_0_0RNGestureHandler
@end

@interface ABI23_0_0RNNativeViewGestureHandler : ABI23_0_0RNGestureHandler
@end

@interface ABI23_0_0RNPinchGestureHandler : ABI23_0_0RNGestureHandler
@end

@interface ABI23_0_0RNRotationGestureHandler : ABI23_0_0RNGestureHandler
@end

@interface ABI23_0_0RNRootViewGestureRecognizer : UIGestureRecognizer

@property (nullable, nonatomic, weak) id<ABI23_0_0RNRootViewGestureRecognizerDelegate> delegate;

- (void)blockOtherRecognizers;

@end

@interface ABI23_0_0RNGestureHandlerButton : UIControl
@end

