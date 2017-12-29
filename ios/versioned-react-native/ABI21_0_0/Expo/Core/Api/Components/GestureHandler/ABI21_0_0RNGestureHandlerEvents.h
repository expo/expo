#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI21_0_0RNGestureHandlerState.h"

@interface ABI21_0_0RNGestureHandlerEventExtraData : NSObject

@property (readonly) NSDictionary *data;

- (instancetype)initWithData:(NSDictionary *)data;

+ (ABI21_0_0RNGestureHandlerEventExtraData *)forPosition:(CGPoint)position;
+ (ABI21_0_0RNGestureHandlerEventExtraData *)forPan:(CGPoint)position withTranslation:(CGPoint)translation withVelocity:(CGPoint)velocity;
+ (ABI21_0_0RNGestureHandlerEventExtraData *)forPinch:(CGFloat)scale withVelocity:(CGFloat)velocity;
+ (ABI21_0_0RNGestureHandlerEventExtraData *)forRotation:(CGFloat)rotation withVelocity:(CGFloat)velocity;
+ (ABI21_0_0RNGestureHandlerEventExtraData *)forPointerInside:(BOOL)pointerInside;

@end

@interface ABI21_0_0RNGestureHandlerEvent : NSObject <ABI21_0_0RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)ReactABI21_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI21_0_0RNGestureHandlerState)state
                      extraData:(ABI21_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end


@interface ABI21_0_0RNGestureHandlerStateChange : NSObject <ABI21_0_0RCTEvent>

- (instancetype)initWithRactTag:(NSNumber *)ReactABI21_0_0Tag
                     handlerTag:(NSNumber *)handlerTag
                          state:(ABI21_0_0RNGestureHandlerState)state
                      prevState:(ABI21_0_0RNGestureHandlerState)prevState
                      extraData:(ABI21_0_0RNGestureHandlerEventExtraData*)extraData NS_DESIGNATED_INITIALIZER;

@end
