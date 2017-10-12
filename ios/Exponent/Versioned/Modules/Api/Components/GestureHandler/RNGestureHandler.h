#import "RNGestureHandlerState.h"
#import "RNGestureHandlerEvents.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(nonnull RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(nonnull RNGestureHandlerStateChange *)event;

@end


@protocol RNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureRecognizer:(nullable UIGestureRecognizer *)gestureRecognizer
    didActivateInRootView:(nullable UIView *)rootView;

@end


@interface RNGestureHandler : NSObject {

@protected UIGestureRecognizer *_recognizer;
@protected RNGestureHandlerState _lastState;

}

+ (nullable RNGestureHandler *)findGestureHandlerByRecognizer:(nonnull UIGestureRecognizer *)recognizer;

- (nonnull instancetype)initWithTag:(nonnull NSNumber *)tag;

@property (nonatomic, readonly, nonnull) NSNumber *tag;
@property (nonatomic, weak, nullable) id<RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly, nullable) UIGestureRecognizer *recognizer;
@property (nonatomic) BOOL enabled;

- (void)bindToView:(nonnull UIView *)view;
- (void)unbindFromView;
- (void)configure:(nullable NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(nonnull id)recognizer;
- (RNGestureHandlerState)state;
- (nullable RNGestureHandlerEventExtraData *)eventExtraData:(nonnull id)recognizer;

@end

@interface RNGestureHandlerRegistry : NSObject

- (nullable RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)registerGestureHandler:(nonnull RNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(nonnull NSNumber *)handlerTag toView:(nonnull UIView *)view;
- (void)dropHandlerWithTag:(nonnull NSNumber *)handlerTag;

@end


@interface RNPanGestureHandler : RNGestureHandler
@end

@interface RNTapGestureHandler : RNGestureHandler
@end

@interface RNLongPressGestureHandler : RNGestureHandler
@end

@interface RNNativeViewGestureHandler : RNGestureHandler
@end

@interface RNPinchGestureHandler : RNGestureHandler
@end

@interface RNRotationGestureHandler : RNGestureHandler
@end

@interface RNRootViewGestureRecognizer : UIGestureRecognizer

@property (nullable, nonatomic, weak) id<RNRootViewGestureRecognizerDelegate> delegate;

- (void)blockOtherRecognizers;

@end

@interface RNGestureHandlerButton : UIControl
@end

