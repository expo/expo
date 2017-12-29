#import "ABI22_0_0RNGestureHandlerState.h"
#import "ABI22_0_0RNGestureHandlerEvents.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol ABI22_0_0RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(nonnull ABI22_0_0RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(nonnull ABI22_0_0RNGestureHandlerStateChange *)event;

@end


@protocol ABI22_0_0RNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureRecognizer:(nullable UIGestureRecognizer *)gestureRecognizer
    didActivateInRootView:(nullable UIView *)rootView;

@end


@interface ABI22_0_0RNGestureHandler : NSObject {

@protected UIGestureRecognizer *_recognizer;
@protected ABI22_0_0RNGestureHandlerState _lastState;

}

+ (nullable ABI22_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(nonnull UIGestureRecognizer *)recognizer;

- (nonnull instancetype)initWithTag:(nonnull NSNumber *)tag;

@property (nonatomic, readonly, nonnull) NSNumber *tag;
@property (nonatomic, weak, nullable) id<ABI22_0_0RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly, nullable) UIGestureRecognizer *recognizer;
@property (nonatomic) BOOL enabled;

- (void)bindToView:(nonnull UIView *)view;
- (void)unbindFromView;
- (void)configure:(nullable NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(nonnull id)recognizer;
- (ABI22_0_0RNGestureHandlerState)state;
- (nullable ABI22_0_0RNGestureHandlerEventExtraData *)eventExtraData:(nonnull id)recognizer;

@end

@interface ABI22_0_0RNGestureHandlerRegistry : NSObject

- (nullable ABI22_0_0RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)registerGestureHandler:(nonnull ABI22_0_0RNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(nonnull NSNumber *)handlerTag toView:(nonnull UIView *)view;
- (void)dropHandlerWithTag:(nonnull NSNumber *)handlerTag;

@end


@interface ABI22_0_0RNPanGestureHandler : ABI22_0_0RNGestureHandler
@end

@interface ABI22_0_0RNTapGestureHandler : ABI22_0_0RNGestureHandler
@end

@interface ABI22_0_0RNLongPressGestureHandler : ABI22_0_0RNGestureHandler
@end

@interface ABI22_0_0RNNativeViewGestureHandler : ABI22_0_0RNGestureHandler
@end

@interface ABI22_0_0RNPinchGestureHandler : ABI22_0_0RNGestureHandler
@end

@interface ABI22_0_0RNRotationGestureHandler : ABI22_0_0RNGestureHandler
@end

@interface ABI22_0_0RNRootViewGestureRecognizer : UIGestureRecognizer

@property (nullable, nonatomic, weak) id<ABI22_0_0RNRootViewGestureRecognizerDelegate> delegate;

- (void)blockOtherRecognizers;

@end

@interface ABI22_0_0RNGestureHandlerButton : UIControl
@end

