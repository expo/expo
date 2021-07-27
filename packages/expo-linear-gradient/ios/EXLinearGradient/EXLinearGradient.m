// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXLinearGradient/EXLinearGradient.h>
#import <EXLinearGradient/EXLinearGradientLayer.h>
#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXAppLifecycleListener.h>
#import <ExpoModulesCore/EXUtilities.h>

@interface EXLinearGradient ()

@end

@implementation EXLinearGradient

+ (Class)layerClass
{
  return [EXLinearGradientLayer class];
}

- (EXLinearGradientLayer *)gradientLayer
{
  return (EXLinearGradientLayer *)self.layer;
}

- (void)setColors:(NSArray *)colorStrings
{
  NSMutableArray *colors = [NSMutableArray arrayWithCapacity:colorStrings.count];
  for (NSString *colorString in colorStrings) {
    UIColor *convertedColor = [EXUtilities UIColor:colorString];
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
