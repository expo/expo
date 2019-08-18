//
//  LOTMaskContainer.h
//  Lottie
//
//  Created by brandon_withrow on 7/19/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import <QuartzCore/QuartzCore.h>
#import "LOTMask.h"

@interface LOTMaskContainer : CALayer

- (instancetype _Nonnull)initWithMasks:(NSArray<LOTMask *> * _Nonnull)masks;

@property (nonatomic, strong, nullable) NSNumber *currentFrame;

@end
