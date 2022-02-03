#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI43_0_0RNGestureHandlerState.h"

@interface ABI43_0_0RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (ABI43_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI43_0_0RNGestureHandlerEventExtraData *)forPan:(CGPoint)position
                      withAbsolutePosition:(CGPoint)absolutePosition
                           withTranslation:(CGPoint)translation
                              withVelocity:(CGPoint)velocity
                       withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI43_0_0RNGestureHandlerEventExtraData *)forForce:(CGFloat)force
                                 forPosition:(CGPoint)position
                        withAbsolutePosition:(CGPoint)absolutePosition
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI43_0_0RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale
                              withFocalPoint:(CGPoint)focalPoint
                                withVelocity:(CGFloat)velocity
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI43_0_0RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation
                                withAnchorPoint:(CGPoint)anchorPoint
                                   withVelocity:(CGFloat)velocity
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI43_0_0RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;
@end

@interface ABI43_0_0RNGestureHandlerEvent : NSObject <ABI43_0_0RCTEvent>

- (instancetype)initWithABI43_0_0ReactTag:(NSNumber *)ABI43_0_0ReactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(ABI43_0_0RNGestureHandlerState)state
                       extraData:(ABI43_0_0RNGestureHandlerEventExtraData*)extraData
                   coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;

@end


@interface ABI43_0_0RNGestureHandlerStateChange : NSObject <ABI43_0_0RCTEvent>

- (instancetype)initWithABI43_0_0ReactTag:(NSNumber *)ABI43_0_0ReactTag
                      handlerTag:(NSNumber *)handlerTag
                           state:(ABI43_0_0RNGestureHandlerState)state
                       prevState:(ABI43_0_0RNGestureHandlerState)prevState
                       extraData:(ABI43_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end
