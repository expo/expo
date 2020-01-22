// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXLinearGradient/ABI36_0_0EXLinearGradient.h>
#import <ABI36_0_0EXLinearGradient/ABI36_0_0EXLinearGradientLayer.h>
#import <UIKit/UIKit.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistry.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMAppLifecycleListener.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMUtilities.h>

@interface ABI36_0_0EXLinearGradient ()

@end

@implementation ABI36_0_0EXLinearGradient

+ (Class)layerClass
{
  return [ABI36_0_0EXLinearGradientLayer class];
}

- (ABI36_0_0EXLinearGradientLayer *)gradientLayer
{
  return (ABI36_0_0EXLinearGradientLayer *)self.layer;
}

- (void)setColors:(NSArray *)colorStrings
{
  NSMutableArray *colors = [NSMutableArray arrayWithCapacity:colorStrings.count];
  for (NSString *colorString in colorStrings) {
    UIColor *convertedColor = [ABI36_0_0UMUtilities UIColor:colorString];
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
