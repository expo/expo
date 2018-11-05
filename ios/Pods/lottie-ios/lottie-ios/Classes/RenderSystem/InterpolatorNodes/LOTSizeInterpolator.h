//
//  LOTSizeInterpolator.h
//  Lottie
//
//  Created by brandon_withrow on 7/13/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTValueInterpolator.h"
#import "LOTValueDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@interface LOTSizeInterpolator : LOTValueInterpolator

- (CGSize)sizeValueForFrame:(NSNumber *)frame;

@property (nonatomic, weak, nullable) id<LOTSizeValueDelegate> delegate;

@end

NS_ASSUME_NONNULL_END
