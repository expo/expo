// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXLinearGradient/ABI38_0_0EXLinearGradientManager.h>
#import <ABI38_0_0EXLinearGradient/ABI38_0_0EXLinearGradient.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMUIManager.h>

@interface ABI38_0_0EXLinearGradientManager ()

@end

@implementation ABI38_0_0EXLinearGradientManager

ABI38_0_0UM_EXPORT_MODULE(ExpoLinearGradientManager);

- (NSString *)viewName
{
  return @"ExpoLinearGradient";
}

- (UIView *)view
{
  return [[ABI38_0_0EXLinearGradient alloc] init];
}

ABI38_0_0UM_VIEW_PROPERTY(colors, NSArray *, ABI38_0_0EXLinearGradient) {
  [view setColors:value];
}

// NOTE: startPoint and endPoint assume that the value is an array with exactly two floats

ABI38_0_0UM_VIEW_PROPERTY(startPoint, NSArray *, ABI38_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setStartPoint:point];
}

ABI38_0_0UM_VIEW_PROPERTY(endPoint, NSArray *, ABI38_0_0EXLinearGradient) {
  CGPoint point = CGPointMake([[value objectAtIndex:0] floatValue], [[value objectAtIndex:1] floatValue]);
  [view setEndPoint:point];
}

ABI38_0_0UM_VIEW_PROPERTY(locations, NSArray *, ABI38_0_0EXLinearGradient) {
  [view setLocations:value];
}

@end
