#import <React/RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "RNGestureHandlerState.h"

@interface RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position
                           withAbsolutePosition:(CGPoint)absolutePosition
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (RNGestureHandlerEventExtraData *)forPan:(CGPoint)position
                      withAbsolutePosition:(CGPoint)absolutePosition
                           withTranslation:(CGPoint)translation
                              withVelocity:(CGPoint)velocity
                       withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale
                              withFocalPoint:(CGPoint)focalPoint
                                withVelocity:(CGFloat)velocity
                         withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation
                                withAnchorPoint:(CGPoint)anchorPoint
                                   withVelocity:(CGFloat)velocity
                            withNumberOfTouches:(NSUInteger)numberOfTouches;
+ (RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;
@end

@interface RNGestureHandlerEvent : NSObject <RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)reactTag
                     handlerTag:(NSNumber *)handlerTag
                          state:(RNGestureHandlerState)state
                      extraData:(RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end


@interface RNGestureHandlerStateChange : NSObject <RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)reactTag
                     handlerTag:(NSNumber *)handlerTag
                          state:(RNGestureHandlerState)state
                      prevState:(RNGestureHandlerState)prevState
                      extraData:(RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end
