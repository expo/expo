//
//  LOTColorInterpolator.m
//  Lottie
//
//  Created by brandon_withrow on 7/13/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTColorInterpolator.h"
#import "LOTPlatformCompat.h"
#import "UIColor+Expanded.h"

@implementation LOTColorInterpolator

- (CGColorRef)colorForFrame:(NSNumber *)frame {
  CGFloat progress = [self progressForFrame:frame];
  UIColor *returnColor;

  if (progress == 0) {
    returnColor = self.leadingKeyframe.colorValue;
  } else if (progress == 1) {
    returnColor = self.trailingKeyframe.colorValue;
  } else {
    returnColor = [UIColor LOT_colorByLerpingFromColor:self.leadingKeyframe.colorValue toColor:self.trailingKeyframe.colorValue amount:progress];
  }
  if (self.hasDelegateOverride) {
    return [self.delegate colorForFrame:frame.floatValue
                          startKeyframe:self.leadingKeyframe.keyframeTime.floatValue
                            endKeyframe:self.trailingKeyframe.keyframeTime.floatValue
                   interpolatedProgress:progress
                             startColor:self.leadingKeyframe.colorValue.CGColor
                               endColor:self.trailingKeyframe.colorValue.CGColor
                           currentColor:returnColor.CGColor];
  }

  return returnColor.CGColor;
}

- (void)setValueDelegate:(id<LOTValueDelegate>)delegate {
  NSAssert(([delegate conformsToProtocol:@protocol(LOTColorValueDelegate)]), @"Color Interpolator set with incorrect callback type. Expected LOTColorValueDelegate");
  self.delegate = (id<LOTColorValueDelegate>)delegate;
}

- (BOOL)hasDelegateOverride {
  return self.delegate != nil;
}

@end
