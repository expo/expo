#import "ABI20_0_0RNGestureHandlerState.h"
#import "ABI20_0_0RNGestureHandlerEvents.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>


@protocol ABI20_0_0RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(ABI20_0_0RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(ABI20_0_0RNGestureHandlerStateChange *)event;

@end


@interface ABI20_0_0RNGestureHandler : NSObject {

@protected UIGestureRecognizer *_recognizer;
@protected ABI20_0_0RNGestureHandlerState _lastState;

}

- (instancetype)initWithTag:(NSNumber *)tag;

@property (nonatomic, readonly) NSNumber *tag;
@property (nonatomic, weak) id<ABI20_0_0RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly) UIGestureRecognizer *recognizer;

- (void)bindToView:(UIView *)view;
- (void)unbindFromView;
- (void)configure:(NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(id)recognizer;
- (ABI20_0_0RNGestureHandlerState)state;
- (ABI20_0_0RNGestureHandlerEventExtraData *)eventExtraData:(id)recognizer;

@end

@interface ABI20_0_0RNGestureHandlerRegistry : NSObject

- (void)registerGestureHandler:(ABI20_0_0RNGestureHandler *)gestureHandler forViewWithTag:(NSNumber *)viewTag;
- (void)dropGestureHandlersForViewWithTag:(NSNumber *)viewTag;
- (NSArray<ABI20_0_0RNGestureHandler*> *)gestureHandlersForViewWithTag:(NSNumber *)viewTag andTag:(NSNumber *)handlerTag;
- (ABI20_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer;

@end


@interface ABI20_0_0RNPanGestureHandler : ABI20_0_0RNGestureHandler
@end

@interface ABI20_0_0RNTapGestureHandler : ABI20_0_0RNGestureHandler
@end

@interface ABI20_0_0RNLongPressGestureHandler : ABI20_0_0RNGestureHandler
@end

@interface ABI20_0_0RNNativeViewGestureHandler : ABI20_0_0RNGestureHandler
@end

@interface ABI20_0_0RNPinchGestureHandler : ABI20_0_0RNGestureHandler
@end

@interface ABI20_0_0RNRotationGestureHandler : ABI20_0_0RNGestureHandler
@end

@interface ABI20_0_0RNRootViewGestureRecognizer : UIGestureRecognizer

- (void)blockOtherRecognizers;

@end

@interface ABI20_0_0RNGestureHandlerButton : UIControl
@end

