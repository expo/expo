#import <React/RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "RNGestureHandlerState.h"

@interface RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position;
+ (RNGestureHandlerEventExtraData *)forPan:(CGPoint)position withTranslation:(CGPoint)translation withVelocity:(CGPoint)velocity;
+ (RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale withVelocity:(CGFloat)velocity;
+ (RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation withVelocity:(CGFloat)velocity;
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
