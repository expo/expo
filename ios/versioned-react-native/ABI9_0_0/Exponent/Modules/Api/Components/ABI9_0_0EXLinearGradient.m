// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXLinearGradient.h"
#import "ABI9_0_0RCTConvert.h"
#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>

@implementation ABI9_0_0EXLinearGradient

+ (Class)layerClass
{
  return [CAGradientLayer class];
}

- (CAGradientLayer *)gradientLayer
{
  return (CAGradientLayer *)self.layer;
}

- (void)setColors:(NSArray *)colorStrings
{
  NSMutableArray *colors = [NSMutableArray arrayWithCapacity:colorStrings.count];
  for (NSString *colorString in colorStrings) {
    [colors addObject:(id)[ABI9_0_0RCTConvert UIColor:colorString].CGColor];
  }
  self.gradientLayer.colors = colors;
}

- (void)setStart:(CGPoint)start
{
  self.gradientLayer.startPoint = start;
}

- (void)setEnd:(CGPoint)end
{
  self.gradientLayer.endPoint = end;
}

- (void)setLocations:(NSArray *)locations
{
  self.gradientLayer.locations = locations;
}

@end
