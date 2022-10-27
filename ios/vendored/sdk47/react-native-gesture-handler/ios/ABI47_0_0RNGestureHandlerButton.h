//
//  ABI47_0_0RNGestureHandlerButton.h
//  ABI47_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI47_0_0RNGestureHandler.h"

@interface ABI47_0_0RNGestureHandlerButton : UIControl

/**
 *  Insets used when hit testing inside this view.
 */
@property (nonatomic, assign) UIEdgeInsets hitTestEdgeInsets;
@property (nonatomic) BOOL userEnabled;

@end
