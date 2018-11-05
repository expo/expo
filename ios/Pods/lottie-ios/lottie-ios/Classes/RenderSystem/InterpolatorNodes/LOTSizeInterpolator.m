//
//  LOTSizeInterpolator.m
//  Lottie
//
//  Created by brandon_withrow on 7/13/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTPlatformCompat.h"
#import "LOTSizeInterpolator.h"
#import "CGGeometry+LOTAdditions.h"

@implementation LOTSizeInterpolator

- (CGSize)sizeValueForFrame:(NSNumber *)frame {
  CGFloat progress = [self progressForFrame:frame];
  CGSize returnSize;
  if (progress == 0) {
    returnSize = self.leadingKeyframe.sizeValue;
  }else if (progress == 1) {
    returnSize = self.trailingKeyframe.sizeValue;
  } else {
    returnSize = CGSizeMake(LOT_RemapValue(progress, 0, 1, self.leadingKeyframe.sizeValue.width, self.trailingKeyframe.sizeValue.width),
                            LOT_RemapValue(progress, 0, 1, self.leadingKeyframe.sizeValue.height, self.trailingKeyframe.sizeValue.height));
  }
  if (self.hasDelegateOverride) {
    return [self.delegate sizeForFrame:frame.floatValue
                         startKeyframe:self.leadingKeyframe.keyframeTime.floatValue
                           endKeyframe:self.trailingKeyframe.keyframeTime.floatValue
                  interpolatedProgress:progress startSize:self.leadingKeyframe.sizeValue
                               endSize:self.trailingKeyframe.sizeValue
                           currentSize:returnSize];
  }
  return returnSize;
}

- (BOOL)hasDelegateOverride {
  return self.delegate != nil;
}

- (void)setValueDelegate:(id<LOTValueDelegate>)delegate {
  NSAssert(([delegate conformsToProtocol:@protocol(LOTSizeValueDelegate)]), @"Size Interpolator set with incorrect callback type. Expected LOTSizeValueDelegate");
  self.delegate = (id<LOTSizeValueDelegate>)delegate;
}

@end
