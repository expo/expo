// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXScreenOrientation/EXScreenOrientationUtilities.h>

#import <sys/utsname.h>

static int INVALID_MASK = 0;

@implementation EXScreenOrientationUtilities

+ (BOOL)doesSupportOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if ((UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) // UIInterfaceOrientationMaskPortraitUpsideDown is part of orientationMask
      && ![EXScreenOrientationUtilities doesDeviceSupportOrientationPortraitUpsideDown])
  {
    // device does not support UIInterfaceOrientationMaskPortraitUpsideDown and it was requested via orientationMask
    return FALSE;
  }
  
  return TRUE;
}

+ (BOOL)doesDeviceSupportOrientationPortraitUpsideDown
{
  struct utsname systemInfo;
  uname(&systemInfo);
  NSString *deviceIdentifier = [NSString stringWithCString:systemInfo.machine
                                                  encoding:NSUTF8StringEncoding];
  return ![EXScreenOrientationUtilities doesDeviceHaveNotch:deviceIdentifier];
}

+ (BOOL)doesDeviceHaveNotch:(NSString *)deviceIdentifier
{
  NSArray<NSString *> *devicesWithNotchIdentifiers = @[
                                                       @"iPhone10,3", // iPhoneX
                                                       @"iPhone10,6", // iPhoneX
                                                       @"iPhone11,2", // iPhoneXs
                                                       @"iPhone11,6", // iPhoneXsMax
                                                       @"iPhone11,4", // iPhoneXsMax
                                                       @"iPhone11,8", // iPhoneXr
                                                       ];
  NSArray<NSString *> *simulatorsIdentifiers = @[
                                                 @"i386",
                                                 @"x86_64",
                                                 ];
  
  if ([devicesWithNotchIdentifiers containsObject:deviceIdentifier]) {
    return YES;
  }
  
  if ([simulatorsIdentifiers containsObject:deviceIdentifier]) {
    return [self doesDeviceHaveNotch:[[[NSProcessInfo processInfo] environment] objectForKey:@"SIMULATOR_MODEL_IDENTIFIER"]];
  }
  return NO;
}

+ (NSDictionary *)getStringToOrientationJSDict
{
  static NSDictionary*strToOrientationDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    strToOrientationDict = @{@"PORTRAIT" : @(EXOrientationPortrait),
                             @"PORTRAIT_UP" : @(EXOrientationPortraitUp),
                             @"PORTRAIT_DOWN" : @(EXOrientationPortraitDown),
                             @"LANDSCAPE" : @(EXOrientationLandscape),
                             @"LANDSCAPE_LEFT" : @(EXOrientationLandscapeLeft),
                             @"LANDSCAPE_RIGHT" : @(EXOrientationLandscapeRight),
                             @"UNKNOWN": @(EXOrientationUnknown)
                             };
  });
  return strToOrientationDict;
}

+ (NSDictionary *)getOrientationJSToStringDict
{
  static NSMutableDictionary*orientationToStrDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationToStrDict = [[NSMutableDictionary alloc] init];
    NSDictionary *strToOrientation = [EXScreenOrientationUtilities getStringToOrientationJSDict];
    for(NSString *str in strToOrientation) {
      NSNumber *wrappedOrientation = [strToOrientation objectForKey:str];
      orientationToStrDict[wrappedOrientation] = str;
    }
  });
  return orientationToStrDict;
}

+ (NSDictionary *)getStringToOrientationLockJSDict
{
  static NSDictionary*strToOrientationLockDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    strToOrientationLockDict = @{ @"DEFAULT" : @(EXOrientationDefaultLock),
                                  @"ALL" : @(EXOrientationAllLock),
                                  @"PORTRAIT" : @(EXOrientationPortraitLock),
                                  @"PORTRAIT_UP" : @(EXOrientationPortraitUpLock),
                                  @"PORTRAIT_DOWN" : @(EXOrientationPortraitDownLock),
                                  @"LANDSCAPE" : @(EXOrientationLandscapeLock),
                                  @"LANDSCAPE_LEFT" : @(EXOrientationLandscapeLeftLock),
                                  @"LANDSCAPE_RIGHT" : @(EXOrientationLandscapeRightLock),
                                  @"OTHER" : @(EXOrientationOtherLock),
                                  @"ALL_BUT_UPSIDE_DOWN": @(EXOrientationAllButUpsideDownLock)
                                  };
  });
  return strToOrientationLockDict;
}

+ (NSDictionary *)getOrientationLockJSToStringDict
{
  static NSMutableDictionary*orientationLockToStrDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationLockToStrDict = [[NSMutableDictionary alloc] init];
    NSDictionary *strToOrientationLock = [EXScreenOrientationUtilities getStringToOrientationLockJSDict];
    for(NSString *str in strToOrientationLock) {
      NSNumber *wrappedOrientationLock = [strToOrientationLock objectForKey:str];
      orientationLockToStrDict[wrappedOrientationLock] = str;
    }
  });
  return orientationLockToStrDict;
}

+ (EXOrientation)orientationNativeToJS:(UIInterfaceOrientationMask)orientationMask
{
  if (orientationMask == (UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown)) {
    return EXOrientationPortrait;
  } else if (orientationMask == UIInterfaceOrientationMaskPortrait) {
    return EXOrientationPortraitUp;
  } else if (orientationMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
    return EXOrientationPortraitDown;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscape) {
    return EXOrientationLandscape;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeLeft) {
    return EXOrientationLandscapeLeft;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeRight) {
    return EXOrientationLandscapeRight;
  } else {
    return EXOrientationUnknown;
  }
}

+ (EXOrientationLock)orientationLockNativeToJS:(UIInterfaceOrientationMask)orientationMask
{
  if (orientationMask == UIInterfaceOrientationMaskAllButUpsideDown){
    return EXOrientationDefaultLock;
  } else if (orientationMask == UIInterfaceOrientationMaskAll) {
    return EXOrientationAllLock;
  } else if (orientationMask == (UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown)) {
    return EXOrientationPortraitLock;
  } else if (orientationMask == UIInterfaceOrientationMaskPortrait) {
    return EXOrientationPortraitUpLock;
  } else if (orientationMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
    return EXOrientationPortraitDownLock;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscape) {
    return EXOrientationLandscapeLock;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeLeft) {
    return EXOrientationLandscapeLeftLock;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeRight) {
    return EXOrientationLandscapeRightLock;
  } else {
    return EXOrientationOtherLock;
  }
}

+ (UIInterfaceOrientationMask)orientationJSToNative:(EXOrientation)orientation
{
  if (orientation == EXOrientationPortrait) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientation == EXOrientationPortraitUp) {
    return UIInterfaceOrientationMaskPortrait;
  } else if (orientation == EXOrientationPortraitDown) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientation == EXOrientationLandscape) {
    return UIInterfaceOrientationMaskLandscape;
  } else if (orientation == EXOrientationLandscapeLeft) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if (orientation == EXOrientationLandscapeRight) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else {
    return INVALID_MASK;
  }
}

+ (UIInterfaceOrientationMask)orientationLockJSToNative:(EXOrientationLock)orientationLock
{
  if (orientationLock == EXOrientationDefaultLock) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if (orientationLock == EXOrientationAllLock) {
    return UIInterfaceOrientationMaskAll;
  } else if (orientationLock == EXOrientationPortraitLock) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientationLock == EXOrientationPortraitUpLock) {
    return UIInterfaceOrientationMaskPortrait;
  } else if (orientationLock == EXOrientationPortraitDownLock) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientationLock == EXOrientationLandscapeLock) {
    return UIInterfaceOrientationMaskLandscape;
  } else if (orientationLock == EXOrientationLandscapeLeftLock) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if (orientationLock == EXOrientationLandscapeRightLock) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else if (orientationLock == EXOrientationAllButUpsideDownLock) { // legacy
    return UIInterfaceOrientationMaskAllButUpsideDown;
  }else {
    return INVALID_MASK;
  }
}

+ (EXOrientation)stringToOrientation:(NSString *)orientationString
{
  return [[[EXScreenOrientationUtilities getStringToOrientationJSDict] objectForKey:orientationString] intValue];
}

+ (NSString *)orientationToString:(EXOrientation)orientation
{
  return [[EXScreenOrientationUtilities getOrientationJSToStringDict] objectForKey:@(orientation)];
}


+ (EXOrientationLock)stringToOrientationLock:(NSString *)orientationLockString
{
  return [[[EXScreenOrientationUtilities getStringToOrientationLockJSDict] objectForKey:orientationLockString] intValue];
}

+ (NSString *)orientationLockToString:(EXOrientationLock)orientationLock
{
  return [[EXScreenOrientationUtilities getOrientationLockJSToStringDict] objectForKey:@(orientationLock)];
}

+ (NSString *)UIInterfaceOrientationToEXOrientation:(UIInterfaceOrientation)screenOrientation
{
    switch (screenOrientation) {
      case UIInterfaceOrientationPortrait:
        return [self orientationToString:EXOrientationPortraitUp];
      case UIInterfaceOrientationPortraitUpsideDown:
        return [self orientationToString:EXOrientationPortraitDown];
      case UIInterfaceOrientationLandscapeRight:
        return [self orientationToString:EXOrientationLandscapeRight];
      case UIInterfaceOrientationLandscapeLeft:
        return [self orientationToString:EXOrientationLandscapeLeft];
      default:
        return [self orientationToString:EXOrientationUnknown];
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
  // it is how the mask is created from the orientation
  UIInterfaceOrientationMask maskFromOrientation = (1 << orientation);
  return (maskFromOrientation & orientationMask);
}

+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  UIInterfaceOrientation defaultOrientation = UIInterfaceOrientationUnknown;
  if (UIInterfaceOrientationMaskPortrait & orientationMask) {
    defaultOrientation = UIInterfaceOrientationPortrait;
  } else if (UIInterfaceOrientationMaskLandscapeLeft & orientationMask) {
    defaultOrientation = UIInterfaceOrientationLandscapeLeft;
  } else if (UIInterfaceOrientationMaskLandscapeRight & orientationMask) {
    defaultOrientation = UIInterfaceOrientationLandscapeRight;
  } else if (UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) {
    defaultOrientation = UIInterfaceOrientationPortraitUpsideDown;
  }
  return defaultOrientation;
}

@end
