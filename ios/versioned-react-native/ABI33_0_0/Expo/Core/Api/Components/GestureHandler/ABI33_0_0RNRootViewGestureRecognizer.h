//
//  ABI33_0_0RNRootViewGestureRecognizer.h
//  ABI33_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI33_0_0RNGestureHandler.h"

@interface ABI33_0_0RNRootViewGestureRecognizer : UIGestureRecognizer

@property (nullable, nonatomic, weak) id<ABI33_0_0RNRootViewGestureRecognizerDelegate> delegate;

- (void)blockOtherRecognizers;

@end
