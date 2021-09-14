// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXScreenOrientation/EXScreenOrientationUtilities.h>

#import <sys/utsname.h>

@implementation EXScreenOrientationUtilities

# pragma mark - helpers

+ (BOOL)isIPad
{
  return [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad;
}

+ (BOOL)doesDeviceSupportOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if ((UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) // UIInterfaceOrientationMaskPortraitUpsideDown is part of orientationMask
      && [self doesDeviceHaveNotch])
  {
    // device does not support UIInterfaceOrientationMaskPortraitUpsideDown and it was requested via orientationMask
    return false;
  }
  
  return true;
}

// https://medium.com/@cafielo/how-to-detect-notch-screen-in-swift-56271827625d
+ (BOOL)doesDeviceHaveNotch {
  static BOOL bottomSafeAreaInsetIsPositive = false;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
     dispatch_sync(dispatch_get_main_queue(), ^{
      bottomSafeAreaInsetIsPositive = ([[[UIApplication sharedApplication] delegate] window].safeAreaInsets.bottom ?: 0.0) > 0.0;
    });
  });
    
  return bottomSafeAreaInsetIsPositive;
}

+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation
{
  return 1 << orientation;
}

+ (UIInterfaceOrientation)interfaceOrientationFromDeviceOrientation:(UIDeviceOrientation)deviceOrientation
{
   switch (deviceOrientation) {
     case UIDeviceOrientationPortrait:
       return UIInterfaceOrientationPortrait;
     case UIDeviceOrientationPortraitUpsideDown:
       return UIInterfaceOrientationPortraitUpsideDown;
     // UIDevice and UIInterface landscape orientations are switched
     case UIDeviceOrientationLandscapeLeft:
       return UIInterfaceOrientationLandscapeRight;
     case UIDeviceOrientationLandscapeRight:
       return UIInterfaceOrientationLandscapeLeft;
     default:
       return UIInterfaceOrientationUnknown;
   }
}

+ (BOOL)doesOrientationMask:(UIInterfaceOrientationMask)orientationMask containOrientation:(UIInterfaceOrientation)orientation
{
  // This is how the mask is created from the orientation
  UIInterfaceOrientationMask maskFromOrientation = [self maskFromOrientation:orientation];
  return (maskFromOrientation & orientationMask);
}

+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if (UIInterfaceOrientationMaskPortrait & orientationMask) {
    return UIInterfaceOrientationPortrait;
  } else if (UIInterfaceOrientationMaskLandscapeLeft & orientationMask) {
    return UIInterfaceOrientationLandscapeLeft;
  } else if (UIInterfaceOrientationMaskLandscapeRight & orientationMask) {
    return UIInterfaceOrientationLandscapeRight;
  } else if (UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) {
    return UIInterfaceOrientationPortraitUpsideDown;
  }
  return UIInterfaceOrientationUnknown;
}

+ (NSMutableDictionary *)inverted:(NSDictionary *)dictionary
{
  NSMutableDictionary *invertedDictionary = [NSMutableDictionary new];
  [dictionary enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
      invertedDictionary[value] = key;
  }];
  return invertedDictionary;
}

# pragma mark - import/export

+ (NSDictionary *)orientationLockMap
{
  static NSDictionary *orientationLockMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationLockMap = @{
      @0 : @(UIInterfaceOrientationMaskAllButUpsideDown),
      @1 : @(UIInterfaceOrientationMaskAll),
      @2 : @(UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown),
      @3 : @(UIInterfaceOrientationMaskPortrait),
      @4 : @(UIInterfaceOrientationMaskPortraitUpsideDown),
      @5 : @(UIInterfaceOrientationMaskLandscape),
      @6 : @(UIInterfaceOrientationMaskLandscapeLeft),
      @7 : @(UIInterfaceOrientationMaskLandscapeRight),
    };
  });
  
  return orientationLockMap;
}

+ (NSDictionary *)orientationMap
{
  static NSDictionary *orientationMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationMap = @{
      @(UIInterfaceOrientationPortrait)           : @1,
      @(UIInterfaceOrientationPortraitUpsideDown) : @2,
      @(UIInterfaceOrientationLandscapeLeft)      : @3,
      @(UIInterfaceOrientationLandscapeRight)     : @4,
    };
  });
  
  return orientationMap;
}

+ (UIInterfaceOrientationMask)importOrientationLock:(NSNumber *)orientationLock
{
  return [[self orientationLockMap][orientationLock] integerValue] ?: 0;
}

+ (NSNumber *)exportOrientationLock:(UIInterfaceOrientationMask)orientationMask
{
  static NSMutableDictionary *exportOrientationLockMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    exportOrientationLockMap = [self inverted:[EXScreenOrientationUtilities orientationLockMap]];
    exportOrientationLockMap[@(UIInterfaceOrientationMaskAllButUpsideDown)] = @0; // UIInterfaceOrientationMaskAllButUpsideDown is default value
  });
  
  NSNumber *exportedOrientation = exportOrientationLockMap[@(orientationMask)];
  if (!exportedOrientation) {
    if (orientationMask & UIInterfaceOrientationMaskAll) {
      return @(8);
    }
    return @(9);
  }
  
  return exportedOrientation;
}

+ (NSNumber *)exportOrientation:(UIInterfaceOrientation)orientation
{
  return [self orientationMap][@(orientation)] ?: @(UIInterfaceOrientationUnknown);
}

+ (UIInterfaceOrientation)importOrientation:(NSNumber *)orientation
{
  static NSDictionary *exportOrientationMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    exportOrientationMap = [self inverted:[self orientationMap]];
  });
  return [exportOrientationMap[orientation] intValue] ?: UIInterfaceOrientationUnknown;
}

@end
