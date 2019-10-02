// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXLinearGradient/EXLinearGradientManager.h>
#import <EXLinearGradient/EXLinearGradient.h>
#import <UMCore/UMUIManager.h>

@interface EXLinearGradientManager ()

@end

@implementation EXLinearGradientManager

UM_EXPORT_MODULE(ExpoLinearGradientManager);

- (NSString *)viewName
{
  return @"ExpoLinearGradient";
}

- (UIView *)view
{
  return [[EXLinearGradient alloc] init];
}

UM_VIEW_PROPERTY(colors, NSArray *, EXLinearGradient) {
  [view setColors:value];
}

// NOTE: startPoint and endPoint assume that the value is an array with exactly two floats

UM_VIEW_PROPERTY(startPoint, NSArray *, EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setStartPoint:point];
}

UM_VIEW_PROPERTY(endPoint, NSArray *, EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setEndPoint:point];
}

UM_VIEW_PROPERTY(locations, NSArray *, EXLinearGradient) {
  [view setLocations:value];
}

@end
