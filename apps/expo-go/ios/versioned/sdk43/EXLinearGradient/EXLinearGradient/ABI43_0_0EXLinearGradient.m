// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXLinearGradient/ABI43_0_0EXLinearGradient.h>
#import <ABI43_0_0EXLinearGradient/ABI43_0_0EXLinearGradientLayer.h>
#import <UIKit/UIKit.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleListener.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

@interface ABI43_0_0EXLinearGradient ()

@end

@implementation ABI43_0_0EXLinearGradient

+ (Class)layerClass
{
  return [ABI43_0_0EXLinearGradientLayer class];
}

- (ABI43_0_0EXLinearGradientLayer *)gradientLayer
{
  return (ABI43_0_0EXLinearGradientLayer *)self.layer;
}

- (void)setColors:(NSArray *)colorStrings
{
  NSMutableArray *colors = [NSMutableArray arrayWithCapacity:colorStrings.count];
  for (NSString *colorString in colorStrings) {
    UIColor *convertedColor = [ABI43_0_0EXUtilities UIColor:colorString];
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
