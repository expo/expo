// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXLinearGradient/EXLinearGradientManager.h>
#import <EXLinearGradient/EXLinearGradient.h>
#import <ExpoModulesCore/EXUIManager.h>

@interface EXLinearGradientManager ()

@end

@implementation EXLinearGradientManager

EX_EXPORT_MODULE(ExpoLinearGradientManager);

- (NSString *)viewName
{
  return @"ExpoLinearGradient";
}

- (UIView *)view
{
  return [[EXLinearGradient alloc] init];
}

EX_VIEW_PROPERTY(colors, NSArray *, EXLinearGradient) {
  [view setColors:value];
}

// NOTE: startPoint and endPoint assume that the value is an array with exactly two floats

EX_VIEW_PROPERTY(startPoint, NSArray *, EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setStartPoint:point];
}

EX_VIEW_PROPERTY(endPoint, NSArray *, EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setEndPoint:point];
}

EX_VIEW_PROPERTY(locations, NSArray *, EXLinearGradient) {
  [view setLocations:value];
}

@end
