// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXLinearGradient/ABI37_0_0EXLinearGradientManager.h>
#import <ABI37_0_0EXLinearGradient/ABI37_0_0EXLinearGradient.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUIManager.h>

@interface ABI37_0_0EXLinearGradientManager ()

@end

@implementation ABI37_0_0EXLinearGradientManager

ABI37_0_0UM_EXPORT_MODULE(ExpoLinearGradientManager);

- (NSString *)viewName
{
  return @"ExpoLinearGradient";
}

- (UIView *)view
{
  return [[ABI37_0_0EXLinearGradient alloc] init];
}

ABI37_0_0UM_VIEW_PROPERTY(colors, NSArray *, ABI37_0_0EXLinearGradient) {
  [view setColors:value];
}

// NOTE: startPoint and endPoint assume that the value is an array with exactly two floats

ABI37_0_0UM_VIEW_PROPERTY(startPoint, NSArray *, ABI37_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setStartPoint:point];
}

ABI37_0_0UM_VIEW_PROPERTY(endPoint, NSArray *, ABI37_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setEndPoint:point];
}

ABI37_0_0UM_VIEW_PROPERTY(locations, NSArray *, ABI37_0_0EXLinearGradient) {
  [view setLocations:value];
}

@end
