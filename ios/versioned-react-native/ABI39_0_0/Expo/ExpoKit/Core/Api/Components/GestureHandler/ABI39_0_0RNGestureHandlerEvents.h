#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI39_0_0RNGestureHandlerState.h"

@interface ABI39_0_0RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (ABI39_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI39_0_0RNGestureHandlerEventExtraData *)forPan:(CGPoint)position
                      withAbsolutePosition:(CGPoint)absolutePosition
                           withTranslation:(CGPoint)translation
                              withVelocity:(CGPoint)velocity
                       withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI39_0_0RNGestureHandlerEventExtraData *)forForce:(CGFloat)force
                                 forPosition:(CGPoint)position
                        withAbsolutePosition:(CGPoint)absolutePosition
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI39_0_0RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale
                              withFocalPoint:(CGPoint)focalPoint
                                withVelocity:(CGFloat)velocity
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI39_0_0RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation
                                withAnchorPoint:(CGPoint)anchorPoint
                                   withVelocity:(CGFloat)velocity
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI39_0_0RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;
@end

@interface ABI39_0_0RNGestureHandlerEvent : NSObject <ABI39_0_0RCTEvent>

- (instancetype)initWithABI39_0_0ReactTag:(NSNumber *)ABI39_0_0ReactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(ABI39_0_0RNGestureHandlerState)state
                       extraData:(ABI39_0_0RNGestureHandlerEventExtraData*)extraData
                   coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;

@end


@interface ABI39_0_0RNGestureHandlerStateChange : NSObject <ABI39_0_0RCTEvent>

- (instancetype)initWithABI39_0_0ReactTag:(NSNumber *)ABI39_0_0ReactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(ABI39_0_0RNGestureHandlerState)state
                       prevState:(ABI39_0_0RNGestureHandlerState)prevState
                       extraData:(ABI39_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end
