// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScreenOrientation.h"
#import "EXScopedModuleRegistry.h"

#import <UIKit/UIKit.h>
#import <sys/utsname.h>

@interface EXScreenOrientation ()

@property (nonatomic, weak) id<EXScreenOrientationScopedModuleDelegate> kernelOrientationServiceDelegate;

@end

static int INVALID_MASK = 0;

@implementation EXScreenOrientation

EX_EXPORT_SCOPED_MODULE(ExponentScreenOrientation, ScreenOrientationManager);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelOrientationServiceDelegate = kernelServiceInstance;
  }
  return self;
}

RCT_EXPORT_METHOD(allowAsync:(NSString *)orientation
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [self orientationMaskFromOrientation:orientation];
  if (orientationMask == INVALID_MASK) {
    return reject(@"E_INVALID_ORIENTATION", [NSString stringWithFormat:@"Invalid screen orientation %@", orientation], nil);
  }
  if (![self doesSupportOrientationMask:orientationMask]) {
    return reject(@"E_UNSUPPORTED_ORIENTATION", [NSString stringWithFormat:@"This device does not support this orientation %@", orientation], nil);
  }
  [_kernelOrientationServiceDelegate screenOrientationModule:self
                     didChangeSupportedInterfaceOrientations:orientationMask];
  resolve(nil);
}

RCT_EXPORT_METHOD(doesSupportAsync:(NSString *)orientation
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [self orientationMaskFromOrientation:orientation];
  if (orientationMask == INVALID_MASK) {
    return reject(@"E_INVALID_ORIENTATION", [NSString stringWithFormat:@"Invalid screen orientation %@", orientation], nil);
  }
  if ([self doesSupportOrientationMask:orientationMask]) {
    resolve(@YES);
  } else {
    resolve(@NO);
  }
}

- (BOOL)doesSupportOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if ((UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) // UIInterfaceOrientationMaskPortraitUpsideDown is part of orientationMask
      && ![self doesDeviceSupportOrientationPortraitUpsideDown])
  {
    // device does not support UIInterfaceOrientationMaskPortraitUpsideDown and it was requested via orientationMask
    return FALSE;
  }
  
  return TRUE;
}

- (BOOL)doesDeviceSupportOrientationPortraitUpsideDown
{
  struct utsname systemInfo;
  uname(&systemInfo);
  NSString *deviceIdentifier = [NSString stringWithCString:systemInfo.machine
                                                  encoding:NSUTF8StringEncoding];
  return ![self doesDeviceHaveNotch:deviceIdentifier];
}
- (BOOL)doesDeviceHaveNotch:(NSString *)deviceIdentifier
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

- (UIInterfaceOrientationMask)orientationMaskFromOrientation:(NSString *)orientation
{
  if ([orientation isEqualToString:@"ALL"]) {
    return UIInterfaceOrientationMaskAll;
  } else if ([orientation isEqualToString:@"ALL_BUT_UPSIDE_DOWN"]) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if ([orientation isEqualToString:@"LANDSCAPE"]) {
    return UIInterfaceOrientationMaskLandscape;
  } else if ([orientation isEqualToString:@"LANDSCAPE_LEFT"]) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if ([orientation isEqualToString:@"LANDSCAPE_RIGHT"]) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else if ([orientation isEqualToString:@"PORTRAIT"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([orientation isEqualToString:@"PORTRAIT_UP"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([orientation isEqualToString:@"PORTRAIT_DOWN"]) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else {
    return INVALID_MASK;
  }
}

@end
