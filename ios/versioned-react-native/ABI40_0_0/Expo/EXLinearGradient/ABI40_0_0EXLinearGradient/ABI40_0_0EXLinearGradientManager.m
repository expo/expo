// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXLinearGradient/ABI40_0_0EXLinearGradientManager.h>
#import <ABI40_0_0EXLinearGradient/ABI40_0_0EXLinearGradient.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMUIManager.h>

@interface ABI40_0_0EXLinearGradientManager ()

@end

@implementation ABI40_0_0EXLinearGradientManager

ABI40_0_0UM_EXPORT_MODULE(ExpoLinearGradientManager);

- (NSString *)viewName
{
  return @"ExpoLinearGradient";
}

- (UIView *)view
{
  return [[ABI40_0_0EXLinearGradient alloc] init];
}

ABI40_0_0UM_VIEW_PROPERTY(colors, NSArray *, ABI40_0_0EXLinearGradient) {
  [view setColors:value];
}

// NOTE: startPoint and endPoint assume that the value is an array with exactly two floats

ABI40_0_0UM_VIEW_PROPERTY(startPoint, NSArray *, ABI40_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setStartPoint:point];
}

ABI40_0_0UM_VIEW_PROPERTY(endPoint, NSArray *, ABI40_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setEndPoint:point];
}

ABI40_0_0UM_VIEW_PROPERTY(locations, NSArray *, ABI40_0_0EXLinearGradient) {
  [view setLocations:value];
}

@end
