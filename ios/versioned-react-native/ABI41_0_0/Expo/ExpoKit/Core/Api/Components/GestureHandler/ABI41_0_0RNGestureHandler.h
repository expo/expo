#import "ABI41_0_0RNGestureHandlerState.h"
#import "ABI41_0_0RNGestureHandlerDirection.h"
#import "ABI41_0_0RNGestureHandlerEvents.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>

#define VEC_LEN_SQ(pt) (pt.x * pt.x + pt.y * pt.y)
#define TEST_MIN_IF_NOT_NAN(value, limit) \
(!isnan(limit) && ((limit < 0 && value <= limit) || (limit >= 0 && value >= limit)))

#define TEST_MAX_IF_NOT_NAN(value, max) \
(!isnan(max) && ((max < 0 && value < max) || (max >= 0 && value > max)))

#define APPLY_PROP(recognizer, config, type, prop, propName) do { \
id value = config[propName]; \
if (value != nil) recognizer.prop = [ABI41_0_0RCTConvert type:value]; \
} while(0)

#define APPLY_FLOAT_PROP(prop) do { APPLY_PROP(recognizer, config, CGFloat, prop, @#prop); } while(0)
#define APPLY_INT_PROP(prop) do { APPLY_PROP(recognizer, config, NSInteger, prop, @#prop); } while(0)
#define APPLY_NAMED_INT_PROP(prop, propName) do { APPLY_PROP(recognizer, config, NSInteger, prop, propName); } while(0)

@protocol ABI41_0_0RNGestureHandlerEventEmitter

- (void)sendTouchEvent:(nonnull ABI41_0_0RNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(nonnull ABI41_0_0RNGestureHandlerStateChange *)event;

@end


@protocol ABI41_0_0RNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureRecognizer:(nullable UIGestureRecognizer *)gestureRecognizer
    didActivateInRootView:(nullable UIView *)rootView;

@end


@interface ABI41_0_0RNGestureHandler : NSObject <UIGestureRecognizerDelegate> {

@protected UIGestureRecognizer *_recognizer;
@protected ABI41_0_0RNGestureHandlerState _lastState;

}

+ (nullable ABI41_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(nonnull UIGestureRecognizer *)recognizer;

- (nonnull instancetype)initWithTag:(nonnull NSNumber *)tag;

@property (nonatomic, readonly, nonnull) NSNumber *tag;
@property (nonatomic, weak, nullable) id<ABI41_0_0RNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly, nullable) UIGestureRecognizer *recognizer;
@property (nonatomic) BOOL enabled;
@property(nonatomic) BOOL shouldCancelWhenOutside;

- (void)bindToView:(nonnull UIView *)view;
- (void)unbindFromView;
- (void)configure:(nullable NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(nonnull id)recognizer;
- (BOOL)containsPointInView;
- (ABI41_0_0RNGestureHandlerState)state;
- (nullable ABI41_0_0RNGestureHandlerEventExtraData *)eventExtraData:(nonnull id)recognizer;

- (void)reset;
- (void)sendEventsInState:(ABI41_0_0RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)ABI41_0_0ReactTag
            withExtraData:(ABI41_0_0RNGestureHandlerEventExtraData *)extraData;

@end

