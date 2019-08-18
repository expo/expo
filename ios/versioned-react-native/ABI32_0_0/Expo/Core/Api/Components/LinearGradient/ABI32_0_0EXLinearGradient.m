// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXLinearGradient.h"
#import "ABI32_0_0EXLinearGradientLayer.h"
#import <ReactABI32_0_0/ABI32_0_0RCTConvert.h>
#import <UIKit/UIKit.h>

@implementation ABI32_0_0EXLinearGradient

+ (Class)layerClass
{
  return [ABI32_0_0EXLinearGradientLayer class];
}

- (ABI32_0_0EXLinearGradientLayer *)gradientLayer
{
  return (ABI32_0_0EXLinearGradientLayer *)self.layer;
}

- (void)setColors:(NSArray *)colorStrings
{
  NSMutableArray *colors = [NSMutableArray arrayWithCapacity:colorStrings.count];
  for (NSString *colorString in colorStrings) {
    UIColor *convertedColor = [ABI32_0_0RCTConvert UIColor:colorString];
    if (convertedColor) {
      [colors addObject:convertedColor];
    }
  }
  self.gradientLayer.colors = colors;
}

- (void)setStartPoint:(CGPoint)start
{
  self.gradientLayer.startPoint = start;
}

- (void)setEndPoint:(CGPoint)end
{
  self.gradientLayer.endPoint = end;
}

- (void)setLocations:(NSArray *)locations
{
  self.gradientLayer.locations = locations;
}

@end
