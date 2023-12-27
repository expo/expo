//
//  RNGestureHandlerRegistry.h
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNGestureHandler.h"

@interface RNGestureHandlerRegistry : NSObject

- (nullable RNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)registerGestureHandler:(nonnull RNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(nonnull NSNumber *)handlerTag
                      toView:(nonnull UIView *)view
              withActionType:(RNGestureHandlerActionType)actionType;
- (void)dropHandlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)dropAllHandlers;

@end
