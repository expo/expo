// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXScreenOrientation/EXScreenOrientationUtilities.h>

#import <sys/utsname.h>

@implementation EXScreenOrientationUtilities

# pragma mark - helpers

+ (BOOL)doesSupportOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if ((UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) // UIInterfaceOrientationMaskPortraitUpsideDown is part of orientationMask
      && ![self doesDeviceHaveNotch])
  {
    // device does not support UIInterfaceOrientationMaskPortraitUpsideDown and it was requested via orientationMask
    return false;
  }
  
  return true;
}

+ (BOOL)doesDeviceHaveNotch {
  if (@available(iOS 11.0, *)) {
    return ([[[UIApplication sharedApplication] delegate] window].safeAreaInsets.top ?: 0.0) > 20.0;
  }
  
  return false;
}

+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation
{
  switch (orientation) {
    case UIInterfaceOrientationPortrait:
      return UIInterfaceOrientationMaskPortrait;
    case UIInterfaceOrientationPortraitUpsideDown:
      return UIInterfaceOrientationMaskPortraitUpsideDown;
    case UIInterfaceOrientationLandscapeLeft:
        return UIInterfaceOrientationMaskLandscapeLeft;
    case UIInterfaceOrientationLandscapeRight:
      return UIInterfaceOrientationMaskLandscapeRight;
    default:
      return 0;
  }
}

+ (UIInterfaceOrientation)UIDeviceOrientationToUIInterfaceOrientation:(UIDeviceOrientation)deviceOrientation
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
  UIInterfaceOrientationMask maskFromOrientation = (1 << orientation);
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

# pragma mark - import/export

+ (UIInterfaceOrientationMask)importOrientationLock:(NSNumber *)orientationLock
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
      @10: @(UIInterfaceOrientationMaskAllButUpsideDown)
    };
  });
  
  return [orientationLockMap[orientationLock] integerValue] ?: 0;
}

+ (NSNumber *)exportOrientationLock:(UIInterfaceOrientationMask)orientationMask
{
  static NSDictionary *orientationLockMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationLockMap = @{
      @(UIInterfaceOrientationMaskAllButUpsideDown)   : @0,
      @(UIInterfaceOrientationMaskAll)                : @1,
      @(UIInterfaceOrientationMaskPortrait
      | UIInterfaceOrientationMaskPortraitUpsideDown) : @2,
      @(UIInterfaceOrientationMaskPortrait)           : @3,
      @(UIInterfaceOrientationMaskPortraitUpsideDown) : @4,
      @(UIInterfaceOrientationMaskLandscape)          : @5,
      @(UIInterfaceOrientationMaskLandscapeLeft)      : @6,
      @(UIInterfaceOrientationMaskLandscapeRight)     : @7,
      @(UIInterfaceOrientationMaskAllButUpsideDown)   : @10
    };
  });
  
  return orientationLockMap[@(orientationMask)] ?: @(8);
}

+ (NSNumber *)exportOrientation:(UIInterfaceOrientation)orientation
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
  
  return orientationMap[@(orientation)] ?: @(UIInterfaceOrientationUnknown);
}

+ (UIInterfaceOrientation)importOrientation:(NSNumber *)orientation
{
  static NSDictionary *orientationMap = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationMap = @{
      @1 : @(UIInterfaceOrientationPortrait),
      @2 : @(UIInterfaceOrientationPortraitUpsideDown),
      @3 : @(UIInterfaceOrientationLandscapeLeft),
      @4 : @(UIInterfaceOrientationLandscapeRight),
    };
  });
  
  return [orientationMap[orientation] intValue] ?: UIInterfaceOrientationUnknown;
}

@end
