//
//  DevMenuRNRootViewGestureRecognizer.h
//  DevMenuRNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "DevMenuRNGestureHandler.h"

@interface DevMenuRNRootViewGestureRecognizer : UIGestureRecognizer

@property (nullable, nonatomic, weak) id<DevMenuRNRootViewGestureRecognizerDelegate> delegate;

- (void)blockOtherRecognizers;

@end
