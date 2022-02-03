// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXLinearGradient/ABI42_0_0EXLinearGradientManager.h>
#import <ABI42_0_0EXLinearGradient/ABI42_0_0EXLinearGradient.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUIManager.h>

@interface ABI42_0_0EXLinearGradientManager ()

@end

@implementation ABI42_0_0EXLinearGradientManager

ABI42_0_0UM_EXPORT_MODULE(ExpoLinearGradientManager);

- (NSString *)viewName
{
  return @"ExpoLinearGradient";
}

- (UIView *)view
{
  return [[ABI42_0_0EXLinearGradient alloc] init];
}

ABI42_0_0UM_VIEW_PROPERTY(colors, NSArray *, ABI42_0_0EXLinearGradient) {
  [view setColors:value];
}

// NOTE: startPoint and endPoint assume that the value is an array with exactly two floats

ABI42_0_0UM_VIEW_PROPERTY(startPoint, NSArray *, ABI42_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setStartPoint:point];
}

ABI42_0_0UM_VIEW_PROPERTY(endPoint, NSArray *, ABI42_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setEndPoint:point];
}

ABI42_0_0UM_VIEW_PROPERTY(locations, NSArray *, ABI42_0_0EXLinearGradient) {
  [view setLocations:value];
}

@end
