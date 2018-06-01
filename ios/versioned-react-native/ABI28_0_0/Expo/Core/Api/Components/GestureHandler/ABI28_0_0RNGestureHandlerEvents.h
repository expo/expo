#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI28_0_0RNGestureHandlerState.h"

@interface ABI28_0_0RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (ABI28_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI28_0_0RNGestureHandlerEventExtraData *)forPan:(CGPoint)position
                      withAbsolutePosition:(CGPoint)absolutePosition
                           withTranslation:(CGPoint)translation
                              withVelocity:(CGPoint)velocity
                       withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI28_0_0RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale
                              withFocalPoint:(CGPoint)focalPoint
                                withVelocity:(CGFloat)velocity
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI28_0_0RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation
                                withAnchorPoint:(CGPoint)anchorPoint
                                   withVelocity:(CGFloat)velocity
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (ABI28_0_0RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;
@end

@interface ABI28_0_0RNGestureHandlerEvent : NSObject <ABI28_0_0RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)ReactABI28_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI28_0_0RNGestureHandlerState)state
                      extraData:(ABI28_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end


@interface ABI28_0_0RNGestureHandlerStateChange : NSObject <ABI28_0_0RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)ReactABI28_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI28_0_0RNGestureHandlerState)state
                      prevState:(ABI28_0_0RNGestureHandlerState)prevState
                      extraData:(ABI28_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end
