#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI44_0_0RNGestureHandlerState.h"
#import "ABI44_0_0RNTouchEventType.h"

@interface ABI44_0_0RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (ABI44_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI44_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches
                                   withDuration:(NSUInteger)duration;
+ (ABI44_0_0RNGestureHandlerEventExtraData *)forPan:(CGPoint)position
                      withAbsolutePosition:(CGPoint)absolutePosition
                           withTranslation:(CGPoint)translation
                              withVelocity:(CGPoint)velocity
                       withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI44_0_0RNGestureHandlerEventExtraData *)forForce:(CGFloat)force
                                 forPosition:(CGPoint)position
                        withAbsolutePosition:(CGPoint)absolutePosition
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI44_0_0RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale
                              withFocalPoint:(CGPoint)focalPoint
                                withVelocity:(CGFloat)velocity
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI44_0_0RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation
                                withAnchorPoint:(CGPoint)anchorPoint
                                   withVelocity:(CGFloat)velocity
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI44_0_0RNGestureHandlerEventExtraData *)forEventType:(ABI44_0_0RNTouchEventType)eventType
                             withChangedPointers:(NSArray<NSDictionary *> *)changedPointers
                                 withAllPointers:(NSArray<NSDictionary *> *)allPointers
                             withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI44_0_0RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;
@end

@interface ABI44_0_0RNGestureHandlerEvent : NSObject <ABI44_0_0RCTEvent>

- (instancetype)initWithABI44_0_0ReactTag:(NSNumber *)ABI44_0_0ReactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(ABI44_0_0RNGestureHandlerState)state
                       extraData:(ABI44_0_0RNGestureHandlerEventExtraData*)extraData
                   coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;

@end


@interface ABI44_0_0RNGestureHandlerStateChange : NSObject <ABI44_0_0RCTEvent>

- (instancetype)initWithABI44_0_0ReactTag:(NSNumber *)ABI44_0_0ReactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(ABI44_0_0RNGestureHandlerState)state
                       prevState:(ABI44_0_0RNGestureHandlerState)prevState
                       extraData:(ABI44_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end
