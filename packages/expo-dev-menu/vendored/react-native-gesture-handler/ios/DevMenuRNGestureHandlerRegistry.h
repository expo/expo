//
//  DevMenuRNGestureHandlerRegistry.h
//  DevMenuRNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "DevMenuRNGestureHandler.h"

@interface DevMenuRNGestureHandlerRegistry : NSObject

- (nullable DevMenuRNGestureHandler *)handlerWithTag:(nonnull NSNumber *)handlerTag;
- (void)registerGestureHandler:(nonnull DevMenuRNGestureHandler *)gestureHandler;
- (void)attachHandlerWithTag:(nonnull NSNumber *)handlerTag toView:(nonnull UIView *)view;
- (void)attachHandlerWithTagForDeviceEvents:(nonnull NSNumber *)handlerTag toView:(nonnull UIView *)view;
- (void)dropHandlerWithTag:(nonnull NSNumber *)handlerTag;

@end
