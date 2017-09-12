#import "RNGestureHandlerState.h"
#import "RNGestureHandlerEvents.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>


@protocol RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(RNGestureHandlerStateChange *)event;

@end

@protocol RNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureHandlerDidActivateInRootView:(UIView *)rootView;

@end


@interface RNGestureHandler : NSObject {

@protected UIGestureRecognizer *_recognizer;
@protected RNGestureHandlerState _lastState;

}

- (instancetype)initWithTag:(NSNumber *)tag;

@property (nonatomic, readonly) NSNumber *tag;
@property (nonatomic, weak) id<RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly) UIGestureRecognizer *recognizer;

- (void)bindToView:(UIView *)view;
- (void)unbindFromView;
- (void)configure:(NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(id)recognizer;
- (RNGestureHandlerState)state;
- (RNGestureHandlerEventExtraData *)eventExtraData:(id)recognizer;

@end

@interface RNGestureHandlerRegistry : NSObject

- (void)registerGestureHandler:(RNGestureHandler *)gestureHandler forViewWithTag:(NSNumber *)viewTag;
- (void)dropGestureHandlersForViewWithTag:(NSNumber *)viewTag;
- (NSArray<RNGestureHandler*> *)gestureHandlersForViewWithTag:(NSNumber *)viewTag andTag:(NSNumber *)handlerTag;
- (RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer;

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

