#import <ReactABI20_0_0/ABI20_0_0RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI20_0_0RNGestureHandlerState.h"

@interface ABI20_0_0RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position;
+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPan:(CGPoint)position withTranslation:(CGPoint)translation withVelocity:(CGPoint)velocity;
+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale withVelocity:(CGFloat)velocity;
+ (ABI20_0_0RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation withVelocity:(CGFloat)velocity;
+ (ABI20_0_0RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;

@end

@interface ABI20_0_0RNGestureHandlerEvent : NSObject <ABI20_0_0RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)ReactABI20_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI20_0_0RNGestureHandlerState)state
                      extraData:(ABI20_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end


@interface ABI20_0_0RNGestureHandlerStateChange : NSObject <ABI20_0_0RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)ReactABI20_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI20_0_0RNGestureHandlerState)state
                      prevState:(ABI20_0_0RNGestureHandlerState)prevState
                      extraData:(ABI20_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end
