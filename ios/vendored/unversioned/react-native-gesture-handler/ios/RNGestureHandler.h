#import "RNGestureHandlerState.h"
#import "RNGestureHandlerDirection.h"
#import "RNGestureHandlerEvents.h"
#import "RNGestureHandlerPointerTracker.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <React/RCTConvert.h>

#define VEC_LEN_SQ(pt) (pt.x * pt.x + pt.y * pt.y)
#define TEST_MIN_IF_NOT_NAN(value, limit) \
(!isnan(limit) && ((limit < 0 && value <= limit) || (limit >= 0 && value >= limit)))

#define TEST_MAX_IF_NOT_NAN(value, max) \
(!isnan(max) && ((max < 0 && value < max) || (max >= 0 && value > max)))

#define APPLY_PROP(recognizer, config, type, prop, propName) do { \
id value = config[propName]; \
if (value != nil) { recognizer.prop = [RCTConvert type:value]; }\
} while(0)

#define APPLY_FLOAT_PROP(prop) do { APPLY_PROP(recognizer, config, CGFloat, prop, @#prop); } while(0)
#define APPLY_INT_PROP(prop) do { APPLY_PROP(recognizer, config, NSInteger, prop, @#prop); } while(0)
#define APPLY_NAMED_INT_PROP(prop, propName) do { APPLY_PROP(recognizer, config, NSInteger, prop, propName); } while(0)

@protocol RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(nonnull RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(nonnull RNGestureHandlerStateChange *)event;

- (void)sendTouchDeviceEvent:(nonnull RNGestureHandlerEvent *)event;

- (void)sendStateChangeDeviceEvent:(nonnull RNGestureHandlerStateChange *)event;

@end


@protocol RNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureRecognizer:(nullable UIGestureRecognizer *)gestureRecognizer
    didActivateInViewWithTouchHandler:(nullable UIView *)viewWithTouchHandler;

@end


@interface RNGestureHandler : NSObject <UIGestureRecognizerDelegate> {

@protected UIGestureRecognizer *_recognizer;
@protected RNGestureHandlerState _lastState;

}

+ (nullable RNGestureHandler *)findGestureHandlerByRecognizer:(nonnull UIGestureRecognizer *)recognizer;

- (nonnull instancetype)initWithTag:(nonnull NSNumber *)tag;

@property (nonatomic, readonly, nonnull) NSNumber *tag;
@property (nonatomic, weak, nullable) id<RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly, nullable) UIGestureRecognizer *recognizer;
@property (nonatomic, readonly, nullable) RNGestureHandlerPointerTracker *pointerTracker;
@property (nonatomic) BOOL enabled;
@property (nonatomic) BOOL usesDeviceEvents;
@property (nonatomic) BOOL shouldCancelWhenOutside;
@property (nonatomic) BOOL needsPointerData;
@property (nonatomic) BOOL manualActivation;

- (void)bindToView:(nonnull UIView *)view;
- (void)unbindFromView;
- (void)resetConfig NS_REQUIRES_SUPER;
- (void)configure:(nullable NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(nonnull id)recognizer;
- (BOOL)containsPointInView;
- (RNGestureHandlerState)state;
- (nullable RNGestureHandlerEventExtraData *)eventExtraData:(nonnull id)recognizer;

- (void)stopActivationBlocker;
- (void)reset;
- (void)sendEventsInState:(RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)reactTag
            withExtraData:(nonnull RNGestureHandlerEventExtraData *)extraData;
- (void)sendStateChangeEvent:(nonnull RNGestureHandlerStateChange *)event;
- (void)sendTouchEventInState:(RNGestureHandlerState)state
                 forViewWithTag:(nonnull NSNumber *)reactTag;

@end

