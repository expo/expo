//
//  ABI37_0_0RNGestureHandlerRegistry.h
//  ABI37_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI37_0_0RNGestureHandler.h"

@interface ABI37_0_0RNGestureHandlerRegistry : NSObject

- (nullable ABI37_0_0RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)registerGestureHandler:(nonnull ABI37_0_0RNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(nonnull NSNumber *)handlerTag toView:(nonnull UIView *)view;
- (void)dropHandlerWithTag:(nonnull NSNumber *)handlerTag;

@end
