// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXLinearGradient/ABI43_0_0EXLinearGradientManager.h>
#import <ABI43_0_0EXLinearGradient/ABI43_0_0EXLinearGradient.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>

@interface ABI43_0_0EXLinearGradientManager ()

@end

@implementation ABI43_0_0EXLinearGradientManager

ABI43_0_0EX_EXPORT_MODULE(ExpoLinearGradientManager);

- (NSString *)viewName
{
  return @"ExpoLinearGradient";
}

- (UIView *)view
{
  return [[ABI43_0_0EXLinearGradient alloc] init];
}

ABI43_0_0EX_VIEW_PROPERTY(colors, NSArray *, ABI43_0_0EXLinearGradient) {
  [view setColors:value];
}

// NOTE: startPoint and endPoint assume that the value is an array with exactly two floats

ABI43_0_0EX_VIEW_PROPERTY(startPoint, NSArray *, ABI43_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setStartPoint:point];
}

ABI43_0_0EX_VIEW_PROPERTY(endPoint, NSArray *, ABI43_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setEndPoint:point];
}

ABI43_0_0EX_VIEW_PROPERTY(locations, NSArray *, ABI43_0_0EXLinearGradient) {
  [view setLocations:value];
}

@end
