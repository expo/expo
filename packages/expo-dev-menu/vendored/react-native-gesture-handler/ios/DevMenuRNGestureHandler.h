#import "DevMenuRNGestureHandlerState.h"
#import "DevMenuRNGestureHandlerDirection.h"
#import "DevMenuRNGestureHandlerEvents.h"

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
if (value != nil) recognizer.prop = [RCTConvert type:value]; \
} while(0)

#define APPLY_FLOAT_PROP(prop) do { APPLY_PROP(recognizer, config, CGFloat, prop, @#prop); } while(0)
#define APPLY_INT_PROP(prop) do { APPLY_PROP(recognizer, config, NSInteger, prop, @#prop); } while(0)
#define APPLY_NAMED_INT_PROP(prop, propName) do { APPLY_PROP(recognizer, config, NSInteger, prop, propName); } while(0)

@protocol DevMenuRNGestureHandlerEventEmitter

- (void)sendTouchEvent:(nonnull DevMenuRNGestureHandlerEvent *)event;

- (void)sendStateChangeEvent:(nonnull DevMenuRNGestureHandlerStateChange *)event;

@end


@protocol DevMenuRNRootViewGestureRecognizerDelegate <UIGestureRecognizerDelegate>

- (void)gestureRecognizer:(nullable UIGestureRecognizer *)gestureRecognizer
    didActivateInRootView:(nullable UIView *)rootView;

@end


@interface DevMenuRNGestureHandler : NSObject <UIGestureRecognizerDelegate> {

@protected UIGestureRecognizer *_recognizer;
@protected DevMenuRNGestureHandlerState _lastState;

}

+ (nullable DevMenuRNGestureHandler *)findGestureHandlerByRecognizer:(nonnull UIGestureRecognizer *)recognizer;

- (nonnull instancetype)initWithTag:(nonnull NSNumber *)tag;

@property (nonatomic, readonly, nonnull) NSNumber *tag;
@property (nonatomic, weak, nullable) id<DevMenuRNGestureHandlerEventEmitter> emitter;
@property (nonatomic, readonly, nullable) UIGestureRecognizer *recognizer;
@property (nonatomic) BOOL enabled;
@property(nonatomic) BOOL shouldCancelWhenOutside;

- (void)bindToView:(nonnull UIView *)view;
- (void)unbindFromView;
- (void)configure:(nullable NSDictionary *)config NS_REQUIRES_SUPER;
- (void)handleGesture:(nonnull id)recognizer;
- (BOOL)containsPointInView;
- (DevMenuRNGestureHandlerState)state;
- (nullable DevMenuRNGestureHandlerEventExtraData *)eventExtraData:(nonnull id)recognizer;

- (void)reset;
- (void)sendEventsInState:(DevMenuRNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)reactTag
            withExtraData:(DevMenuRNGestureHandlerEventExtraData *)extraData;

@end

