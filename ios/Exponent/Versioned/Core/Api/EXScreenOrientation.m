// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScreenOrientation.h"
#import "EXScopedModuleRegistry.h"

#import <UIKit/UIKit.h>
#import <sys/utsname.h>

@interface EXScreenOrientation ()

@property (nonatomic, weak) id<EXScreenOrientationScopedModuleDelegate> kernelOrientationServiceDelegate;

@end

static int INVALID_MASK = 0;

@implementation RCTConvert (OrientationLock)
RCT_ENUM_CONVERTER(EXOrientationLock, [EXScreenOrientation getStringToOrientationLockJSDict],
                   EXOrientationDefaultLock, integerValue)
@end


@implementation EXScreenOrientation {
  bool hasListeners;
}

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
    return reject(@"ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK", [NSString stringWithFormat:@"This device does not support this orientation %@", [self orientationLockToString:orientationLock]], nil);
  }
  [_kernelOrientationServiceDelegate screenOrientationModule:self
                     didChangeSupportedInterfaceOrientations:orientationMask];
  resolve(nil);
}


RCT_EXPORT_METHOD(lockPlatformAsync:(NSArray <NSString *> *)allowedOrientations
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // combine all the allowedOrientations into one bitmask
  UIInterfaceOrientationMask allowedOrientationsMask = 0;
  for (NSString *allowedOrientation in allowedOrientations) {
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
  [self lockAsync:EXOrientationDefaultLock resolver:resolve rejecter:reject];
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
  NSArray *singleOrientations = @[@(UIInterfaceOrientationMaskPortrait),
                                   @(UIInterfaceOrientationMaskPortraitUpsideDown),
                                   @(UIInterfaceOrientationMaskLandscapeLeft),
                                   @(UIInterfaceOrientationMaskLandscapeRight)];
  // If the particular orientation is supported, we add it to the array of allowedOrientations
  NSMutableArray *allowedOrientations = [[NSMutableArray alloc] init];
  for (NSNumber *wrappedSingleOrientation in singleOrientations) {
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

RCT_EXPORT_METHOD(supportsOrientationLockAsync:(EXOrientationLock)orientationLock
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
  UITraitCollection *traitCollection = [_kernelOrientationServiceDelegate getTraitCollection];
  resolve([self getOrientationInformation:traitCollection]);
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
    NSDictionary *strToOrientation = [EXScreenOrientation getStringToOrientationJSDict];
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
    NSDictionary *strToOrientationLock = [EXScreenOrientation getStringToOrientationLockJSDict];
    for(NSString *str in strToOrientationLock) {
      NSNumber *wrappedOrientationLock = [strToOrientationLock objectForKey:str];
      orientationLockToStrDict[wrappedOrientationLock] = str;
    }
  });
  return orientationLockToStrDict;
}

// Will be called when this module's first listener is added.
-(void)startObserving
{
  hasListeners = YES;
  [_kernelOrientationServiceDelegate addOrientationChangeListener:self.experienceId subscriberModule:self];
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving
{
  hasListeners = NO;
  [_kernelOrientationServiceDelegate removeOrientationChangeListener:self.experienceId];
}

- (void)handleScreenOrientationChange:(UITraitCollection *)traitCollection
{
  
  UIInterfaceOrientationMask orientationMask = [_kernelOrientationServiceDelegate supportedInterfaceOrientationsForVisibleApp];
  if (hasListeners) {
    EXOrientationLock orientationLock = [self orientationLockNativeToJS:orientationMask];
    [self sendEventWithName:@"expoDidUpdateDimensions" body:@{
                                                              @"orientationInfo": [self getOrientationInformation:traitCollection],
                                                              @"orientationLock": [self orientationLockToString:orientationLock]
                                                              }];
  }
}

- (NSDictionary *)getOrientationInformation:(UITraitCollection *)traitCollection
{
  EXOrientation orientation = [self traitCollectionToOrientation:traitCollection];
  return @{
           @"orientation": [self orientationToString:orientation],
           @"verticalSizeClass": [self stringFromSizeClass:traitCollection.verticalSizeClass],
           @"horizontalSizeClass": [self stringFromSizeClass:traitCollection.horizontalSizeClass]
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

- (NSString *)stringFromSizeClass:(UIUserInterfaceSizeClass)sizeClass
{
  if (sizeClass == UIUserInterfaceSizeClassCompact){
    return @"COMPACT";
  } else if (sizeClass == UIUserInterfaceSizeClassRegular){
    return @"REGULAR";
  } else {
    return @"UNSPECIFIED";
  }
}

- (EXOrientation)traitCollectionToOrientation:(UITraitCollection *)traitCollection
{
  UIUserInterfaceSizeClass verticalSizeClass = traitCollection.verticalSizeClass;
  UIUserInterfaceSizeClass horizontalSizeClass = traitCollection.horizontalSizeClass;
  
  if (verticalSizeClass == UIUserInterfaceSizeClassRegular && horizontalSizeClass == UIUserInterfaceSizeClassCompact){
    return EXOrientationPortrait;
  } else if (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassCompact){
    return EXOrientationLandscape;
  } else if (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassRegular) {
    return EXOrientationLandscape; // iPhone 7 plus
  } else {
    return EXOrientationUnknown;
  }
}

- (EXOrientation)orientationNativeToJS:(UIInterfaceOrientationMask)orientationMask
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

- (EXOrientationLock)orientationLockNativeToJS:(UIInterfaceOrientationMask)orientationMask
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

- (UIInterfaceOrientationMask)orientationJSToNative:(EXOrientation)orientation
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

- (UIInterfaceOrientationMask)orientationLockJSToNative:(EXOrientationLock)orientationLock
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

- (EXOrientation)stringToOrientation:(NSString *)orientationString
{
  return [[[EXScreenOrientation getStringToOrientationJSDict] objectForKey:orientationString] intValue];
}

- (NSString *)orientationToString:(EXOrientation)orientation
{
  return [[EXScreenOrientation getOrientationJSToStringDict] objectForKey:@(orientation)];
}


- (EXOrientationLock)stringToOrientationLock:(NSString *)orientationLockString
{
  return [[[EXScreenOrientation getStringToOrientationLockJSDict] objectForKey:orientationLockString] intValue];
}

- (NSString *)orientationLockToString:(EXOrientationLock)orientationLock
{
  return [[EXScreenOrientation getOrientationLockJSToStringDict] objectForKey:@(orientationLock)];
}

@end
