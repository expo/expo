// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScreenOrientation.h"
#import "EXScopedModuleRegistry.h"

#import <UIKit/UIKit.h>
#import <sys/utsname.h>
#import "React/RCTAccessibilityManager.h"

@interface EXScreenOrientation ()

@property (nonatomic, weak) id<EXScreenOrientationScopedModuleDelegate> kernelOrientationServiceDelegate;

@end

static int INVALID_MASK = 0;

@implementation RCTConvert (OrientationLock)
RCT_ENUM_CONVERTER(EXOrientationLock, [EXScreenOrientation getStrToOrientationLockDict],
                   DEFAULT_LOCK, integerValue)
@end


@implementation EXScreenOrientation

bool hasListeners;

EX_EXPORT_SCOPED_MODULE(ExpoScreenOrientation, ScreenOrientationManager);

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

RCT_EXPORT_METHOD(lockAsync:(EXOrientationLock)orientationLock
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [self orientationLockJSToNative:orientationLock];
  if (orientationMask == INVALID_MASK) {
    return reject(@"ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK", [NSString stringWithFormat:@"Invalid screen orientation lock %@", [self orientationLockToString:orientationLock]], nil);
  }
  if (![self doesSupportOrientationMask:orientationMask]) {
    return reject(@"ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK", [NSString stringWithFormat:@"Cannot apply orientation lock %@ because this device does not support the PORTRAIT_DOWN orientation", [self orientationLockToString:orientationLock]], nil);
  }
  [_kernelOrientationServiceDelegate screenOrientationModule:self
                     didChangeSupportedInterfaceOrientations:orientationMask];
  resolve(nil);
}


RCT_EXPORT_METHOD(lockPlatformAsync:(NSArray *)allowedOrientations
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // combine all the allowedOrientations into one bitmask
  UIInterfaceOrientationMask allowedOrientationsMask = 0;
  for (NSString * allowedOrientation in allowedOrientations ){
    UIInterfaceOrientationMask orientationMask = [self orientationJSToNative: [self stringToOrientation:allowedOrientation]];
    allowedOrientationsMask = allowedOrientationsMask | orientationMask;
  }
  
  [_kernelOrientationServiceDelegate screenOrientationModule:self
                     didChangeSupportedInterfaceOrientations:allowedOrientationsMask];
  resolve(nil);
}

RCT_REMAP_METHOD(unlockAsync,
                  unlockAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self lockAsync:DEFAULT_LOCK resolver:resolve rejecter:reject];
}

RCT_REMAP_METHOD(getOrientationLockAsync,
                 getOrientationLockAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [_kernelOrientationServiceDelegate supportedInterfaceOrientationsForVisibleApp];
  EXOrientationLock orientationLock = [self orientationLockNativeToJS:orientationMask];
  resolve([self orientationLockToString:orientationLock]);
}

RCT_REMAP_METHOD(getPlatformOrientationLockAsync,
                 getPlatformOrientationLockAsyncResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [_kernelOrientationServiceDelegate supportedInterfaceOrientationsForVisibleApp];
  NSArray * singleOrientations = @[@(UIInterfaceOrientationMaskPortrait),
                            @(UIInterfaceOrientationMaskPortraitUpsideDown),
                            @(UIInterfaceOrientationMaskLandscapeLeft),
                            @(UIInterfaceOrientationMaskLandscapeRight)];
  // If the particular orientation is supported, we add it to the array of allowedOrientations
  NSMutableArray * allowedOrientations = [[NSMutableArray alloc] init];
  for (NSNumber * wrappedSingleOrientation in singleOrientations) {
    UIInterfaceOrientationMask singleOrientationMask = [wrappedSingleOrientation intValue];
    UIInterfaceOrientationMask supportedOrientation = orientationMask & singleOrientationMask;
    if (supportedOrientation == singleOrientationMask){
      EXOrientation orientation = [self orientationNativeToJS: (UIInterfaceOrientationMask) singleOrientationMask];
      [allowedOrientations addObject:[self orientationToString:orientation]];
    }
  }
  resolve([allowedOrientations copy]);
}

RCT_EXPORT_METHOD(doesSupportAsync:(EXOrientationLock)orientationLock
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self supportsOrientationLockAsync:orientationLock resolver:resolve rejecter:reject];
}

RCT_EXPORT_METHOD(supportsOrientationLockAsync:(EXOrientationLock) orientationLock
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [self orientationLockJSToNative:orientationLock];
  if (orientationMask == INVALID_MASK) {
    resolve(@NO);
  } else if ([self doesSupportOrientationMask:orientationMask]) {
    resolve(@YES);
  } else {
    resolve(@NO);
  }
}

RCT_REMAP_METHOD(getOrientationAsync,
                 getOrientationAsyncResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  UITraitCollection * traitCollection = [_kernelOrientationServiceDelegate getTraitCollection];
  resolve([self getOrientationInformation:traitCollection]);
}

+ (NSDictionary *)getStrToOrientationDict
{
  static NSDictionary* strToOrientationDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    strToOrientationDict = @{@"PORTRAIT" : @(PORTRAIT),
                             @"PORTRAIT_UP" : @(PORTRAIT_UP),
                             @"PORTRAIT_DOWN" : @(PORTRAIT_DOWN),
                             @"LANDSCAPE" : @(LANDSCAPE),
                             @"LANDSCAPE_LEFT" : @(LANDSCAPE_LEFT),
                             @"LANDSCAPE_RIGHT" : @(LANDSCAPE_RIGHT),
                             @"UNKNOWN": @(UNKNOWN)
                             };
  });
  return strToOrientationDict;
}

+ (NSDictionary *)getOrientationToStrDict
{
  static NSMutableDictionary* orientationToStrDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationToStrDict = [[NSMutableDictionary alloc] init];
    NSDictionary * strToOrientation = [EXScreenOrientation getStrToOrientationDict];
    for(NSString * str in strToOrientation) {
      NSNumber * wrappedOrientation = [strToOrientation objectForKey:str];
      orientationToStrDict[wrappedOrientation] = str;
    }
  });
  return orientationToStrDict;
}

+ (NSDictionary *)getStrToOrientationLockDict
{
  static NSDictionary* strToOrientationLockDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    strToOrientationLockDict = @{ @"DEFAULT" : @(DEFAULT_LOCK),
                                  @"ALL" : @(ALL_LOCK),
                                  @"PORTRAIT" : @(PORTRAIT_LOCK),
                                  @"PORTRAIT_UP" : @(PORTRAIT_UP_LOCK),
                                  @"PORTRAIT_DOWN" : @(PORTRAIT_DOWN_LOCK),
                                  @"LANDSCAPE" : @(LANDSCAPE_LOCK),
                                  @"LANDSCAPE_LEFT" : @(LANDSCAPE_LEFT_LOCK),
                                  @"LANDSCAPE_RIGHT" : @(LANDSCAPE_RIGHT_LOCK),
                                  @"OTHER" : @(OTHER_LOCK),
                                  @"ALL_BUT_UPSIDE_DOWN": @(ALL_BUT_UPSIDE_DOWN_LOCK)
                                  };
  });
  return strToOrientationLockDict;
}

+ (NSDictionary *)getOrientationLockToStrDict
{
  static NSMutableDictionary* orientationLockToStrDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    orientationLockToStrDict = [[NSMutableDictionary alloc] init];
    NSDictionary * strToOrientationLock = [EXScreenOrientation getStrToOrientationLockDict];
    for(NSString * str in strToOrientationLock) {
      NSNumber * wrappedOrientationLock = [strToOrientationLock objectForKey:str];
      orientationLockToStrDict[wrappedOrientationLock] = str;
    }
  });
  return orientationLockToStrDict;
}

// Will be called when this module's first listener is added.
-(void)startObserving {
  hasListeners = YES;
  [_kernelOrientationServiceDelegate addOrientationChangeListener:self.experienceId subscriberModule:self];
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
  hasListeners = NO;
  [_kernelOrientationServiceDelegate removeOrientationChangeListener:self.experienceId];
}

- (void) handleScreenOrientationChange: (UITraitCollection *)traitCollection {
  
  UIInterfaceOrientationMask orientationMask = [_kernelOrientationServiceDelegate supportedInterfaceOrientationsForVisibleApp];
  if (hasListeners) {
    EXOrientationLock orientationLock = [self orientationLockNativeToJS:orientationMask];
    [self sendEventWithName:@"expoDidUpdateDimensions" body:@{
                                                              @"orientationInfo": [self getOrientationInformation:traitCollection],
                                                              @"orientationLock": [self orientationLockToString:orientationLock]
                                                              }];
  }
}

- (NSDictionary *) getOrientationInformation: (UITraitCollection *)traitCollection {
  EXOrientation orientation = [self traitCollectionToOrientation:traitCollection];
  return @{
           @"orientation": [self orientationToString:orientation],
            @"verticalSizeClass": [self sizeClassToString: traitCollection.verticalSizeClass],
            @"horizontalSizeClass": [self sizeClassToString: traitCollection.horizontalSizeClass]
            };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"expoDidUpdateDimensions", @"expoDidUpdatePhysicalDimensions"];
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

- (NSString *) sizeClassToString: (UIUserInterfaceSizeClass) sizeClass
{
  if (sizeClass == UIUserInterfaceSizeClassCompact){
    return @"COMPACT";
  } else if (sizeClass == UIUserInterfaceSizeClassRegular){
    return @"REGULAR";
  } else {
    return @"UNSPECIFIED";
  }
}

- (EXOrientation) traitCollectionToOrientation: (UITraitCollection *) traitCollection
{
  UIUserInterfaceSizeClass verticalSizeClass = traitCollection.verticalSizeClass;
  UIUserInterfaceSizeClass horizontalSizeClass = traitCollection.horizontalSizeClass;
  
  if (verticalSizeClass == UIUserInterfaceSizeClassRegular && horizontalSizeClass == UIUserInterfaceSizeClassCompact){
    return PORTRAIT;
  } else if (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassCompact){
    return LANDSCAPE;
  } else if (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassRegular) {
    return LANDSCAPE; // iPhone 7 plus
  } else {
    return UNKNOWN;
  }
}

- (EXOrientation) orientationNativeToJS:(UIInterfaceOrientationMask) orientationMask
{
  if (orientationMask == (UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown)) {
    return PORTRAIT;
  } else if (orientationMask == UIInterfaceOrientationMaskPortrait) {
    return PORTRAIT_UP;
  } else if (orientationMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
    return PORTRAIT_DOWN;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscape) {
    return LANDSCAPE;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeLeft) {
    return LANDSCAPE_LEFT;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeRight) {
    return LANDSCAPE_RIGHT;
  } else {
    return UNKNOWN;
  }
}

- (EXOrientationLock) orientationLockNativeToJS:(UIInterfaceOrientationMask) orientationMask
{
  if (orientationMask == UIInterfaceOrientationMaskAllButUpsideDown){
    return DEFAULT_LOCK;
  } else if (orientationMask == UIInterfaceOrientationMaskAll) {
    return ALL_LOCK;
  } else if (orientationMask == (UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown)) {
    return PORTRAIT_LOCK;
  } else if (orientationMask == UIInterfaceOrientationMaskPortrait) {
    return PORTRAIT_UP_LOCK;
  } else if (orientationMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
    return PORTRAIT_DOWN_LOCK;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscape) {
    return LANDSCAPE_LOCK;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeLeft) {
    return LANDSCAPE_LEFT_LOCK;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeRight) {
    return LANDSCAPE_RIGHT_LOCK;
  } else {
    return OTHER_LOCK;
  }
}

- (UIInterfaceOrientationMask) orientationJSToNative:(EXOrientation)orientation
{
  if (orientation == PORTRAIT) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientation == PORTRAIT_UP) {
    return UIInterfaceOrientationMaskPortrait;
  } else if (orientation == PORTRAIT_DOWN) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientation == LANDSCAPE) {
    return UIInterfaceOrientationMaskLandscape;
  } else if (orientation == LANDSCAPE_LEFT) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if (orientation == LANDSCAPE_RIGHT) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else {
    return INVALID_MASK;
  }
}

- (UIInterfaceOrientationMask) orientationLockJSToNative:(EXOrientationLock)orientationLock
{
  if (orientationLock == DEFAULT_LOCK) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if (orientationLock == ALL_LOCK) {
    return UIInterfaceOrientationMaskAll;
  } else if (orientationLock == PORTRAIT_LOCK) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientationLock == PORTRAIT_UP_LOCK) {
    return UIInterfaceOrientationMaskPortrait;
  } else if (orientationLock == PORTRAIT_DOWN_LOCK) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientationLock == LANDSCAPE_LOCK) {
    return UIInterfaceOrientationMaskLandscape;
  } else if (orientationLock == LANDSCAPE_LEFT_LOCK) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if (orientationLock == LANDSCAPE_RIGHT_LOCK) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else if (orientationLock == ALL_BUT_UPSIDE_DOWN_LOCK) { // legacy
    return UIInterfaceOrientationMaskAllButUpsideDown;
  }else {
    return INVALID_MASK;
  }
}

- (EXOrientation) stringToOrientation:(NSString *) orientationStr
{
  return [[[EXScreenOrientation getStrToOrientationDict] objectForKey:orientationStr] intValue];
}

- (NSString *) orientationToString:(EXOrientation) orientation
{
  return [[EXScreenOrientation getOrientationToStrDict] objectForKey:@(orientation)];
}


- (EXOrientationLock) stringToOrientationLock:(NSString *) orientationLockStr
{
  return [[[EXScreenOrientation getStrToOrientationLockDict] objectForKey:orientationLockStr] intValue];
}

- (NSString *) orientationLockToString:(EXOrientationLock) orientationLock
{
  return [[EXScreenOrientation getOrientationLockToStrDict] objectForKey:@(orientationLock)];
}

@end
