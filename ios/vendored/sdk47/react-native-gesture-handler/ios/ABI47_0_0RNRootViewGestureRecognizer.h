//
//  ABI47_0_0RNRootViewGestureRecognizer.h
//  ABI47_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI47_0_0RNGestureHandler.h"

@interface ABI47_0_0RNRootViewGestureRecognizer : UIGestureRecognizer

@property (nullable, nonatomic, weak) id<ABI47_0_0RNRootViewGestureRecognizerDelegate> delegate;

- (void)blockOtherRecognizers;

@end
