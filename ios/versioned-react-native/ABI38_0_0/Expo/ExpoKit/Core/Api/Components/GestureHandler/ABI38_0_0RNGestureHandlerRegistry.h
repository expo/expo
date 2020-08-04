//
//  ABI38_0_0RNGestureHandlerRegistry.h
//  ABI38_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI38_0_0RNGestureHandler.h"

@interface ABI38_0_0RNGestureHandlerRegistry : NSObject

- (nullable ABI38_0_0RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)registerGestureHandler:(nonnull ABI38_0_0RNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(nonnull NSNumber *)handlerTag toView:(nonnull UIView *)view;
- (void)dropHandlerWithTag:(nonnull NSNumber *)handlerTag;

@end
