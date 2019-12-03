// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI34_0_0EXScreenOrientation.h"
#import "ABI34_0_0EXScopedModuleRegistry.h"

#import <UIKit/UIKit.h>
#import <sys/utsname.h>

@interface ABI34_0_0EXScreenOrientation ()

@property (nonatomic, weak) id<ABI34_0_0EXScreenOrientationScopedModuleDelegate> kernelOrientationServiceDelegate;

@end

static int INVALID_MASK = 0;

@implementation ABI34_0_0RCTConvert (OrientationLock)
ABI34_0_0RCT_ENUM_CONVERTER(ABI34_0_0EXOrientationLock, [ABI34_0_0EXScreenOrientation getStringToOrientationLockJSDict],
                   ABI34_0_0EXOrientationDefaultLock, integerValue)
@end


@implementation ABI34_0_0EXScreenOrientation {
  bool hasListeners;
}

ABI34_0_0EX_EXPORT_SCOPED_MODULE(ExpoScreenOrientation, ScreenOrientationManager);

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

ABI34_0_0RCT_EXPORT_METHOD(lockAsync:(ABI34_0_0EXOrientationLock)orientationLock
                  resolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
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


ABI34_0_0RCT_EXPORT_METHOD(lockPlatformAsync:(NSArray <NSString *> *)allowedOrientations
                  resolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
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

ABI34_0_0RCT_REMAP_METHOD(unlockAsync,
                 unlockAsyncWithResolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
{
  [self lockAsync:ABI34_0_0EXOrientationDefaultLock resolver:resolve rejecter:reject];
}

ABI34_0_0RCT_REMAP_METHOD(getOrientationLockAsync,
                 getOrientationLockAsyncWithResolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
{
  UIInterfaceOrientationMask orientationMask = [_kernelOrientationServiceDelegate supportedInterfaceOrientationsForVisibleApp];
  ABI34_0_0EXOrientationLock orientationLock = [self orientationLockNativeToJS:orientationMask];
  resolve([self orientationLockToString:orientationLock]);
}

ABI34_0_0RCT_REMAP_METHOD(getPlatformOrientationLockAsync,
                 getPlatformOrientationLockAsyncResolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
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
      ABI34_0_0EXOrientation orientation = [self orientationNativeToJS: (UIInterfaceOrientationMask) singleOrientationMask];
      [allowedOrientations addObject:[self orientationToString:orientation]];
    }
  }
  resolve([allowedOrientations copy]);
}

ABI34_0_0RCT_EXPORT_METHOD(doesSupportAsync:(ABI34_0_0EXOrientationLock)orientationLock
                  resolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
{
  [self supportsOrientationLockAsync:orientationLock resolver:resolve rejecter:reject];
}

ABI34_0_0RCT_EXPORT_METHOD(supportsOrientationLockAsync:(ABI34_0_0EXOrientationLock)orientationLock
                  resolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
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

ABI34_0_0RCT_REMAP_METHOD(getOrientationAsync,
                 getOrientationAsyncResolver:(ABI34_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI34_0_0RCTPromiseRejectBlock)reject)
{
  UITraitCollection *traitCollection = [_kernelOrientationServiceDelegate getTraitCollection];
  resolve([self getOrientationInformation:traitCollection]);
}

+ (NSDictionary *)getStringToOrientationJSDict
{
  static NSDictionary*strToOrientationDict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    strToOrientationDict = @{@"PORTRAIT" : @(ABI34_0_0EXOrientationPortrait),
                             @"PORTRAIT_UP" : @(ABI34_0_0EXOrientationPortraitUp),
                             @"PORTRAIT_DOWN" : @(ABI34_0_0EXOrientationPortraitDown),
                             @"LANDSCAPE" : @(ABI34_0_0EXOrientationLandscape),
                             @"LANDSCAPE_LEFT" : @(ABI34_0_0EXOrientationLandscapeLeft),
                             @"LANDSCAPE_RIGHT" : @(ABI34_0_0EXOrientationLandscapeRight),
                             @"UNKNOWN": @(ABI34_0_0EXOrientationUnknown)
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
    NSDictionary *strToOrientation = [ABI34_0_0EXScreenOrientation getStringToOrientationJSDict];
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
    strToOrientationLockDict = @{ @"DEFAULT" : @(ABI34_0_0EXOrientationDefaultLock),
                                  @"ALL" : @(ABI34_0_0EXOrientationAllLock),
                                  @"PORTRAIT" : @(ABI34_0_0EXOrientationPortraitLock),
                                  @"PORTRAIT_UP" : @(ABI34_0_0EXOrientationPortraitUpLock),
                                  @"PORTRAIT_DOWN" : @(ABI34_0_0EXOrientationPortraitDownLock),
                                  @"LANDSCAPE" : @(ABI34_0_0EXOrientationLandscapeLock),
                                  @"LANDSCAPE_LEFT" : @(ABI34_0_0EXOrientationLandscapeLeftLock),
                                  @"LANDSCAPE_RIGHT" : @(ABI34_0_0EXOrientationLandscapeRightLock),
                                  @"OTHER" : @(ABI34_0_0EXOrientationOtherLock),
                                  @"ALL_BUT_UPSIDE_DOWN": @(ABI34_0_0EXOrientationAllButUpsideDownLock)
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
    NSDictionary *strToOrientationLock = [ABI34_0_0EXScreenOrientation getStringToOrientationLockJSDict];
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
    ABI34_0_0EXOrientationLock orientationLock = [self orientationLockNativeToJS:orientationMask];
    [self sendEventWithName:@"expoDidUpdateDimensions" body:@{
                                                              @"orientationInfo": [self getOrientationInformation:traitCollection],
                                                              @"orientationLock": [self orientationLockToString:orientationLock]
                                                              }];
  }
}

- (NSDictionary *)getOrientationInformation:(UITraitCollection *)traitCollection
{
  ABI34_0_0EXOrientation orientation = [self traitCollectionToOrientation:traitCollection];
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

- (ABI34_0_0EXOrientation)traitCollectionToOrientation:(UITraitCollection *)traitCollection
{
  UIUserInterfaceSizeClass verticalSizeClass = traitCollection.verticalSizeClass;
  UIUserInterfaceSizeClass horizontalSizeClass = traitCollection.horizontalSizeClass;
  
  if (verticalSizeClass == UIUserInterfaceSizeClassRegular && horizontalSizeClass == UIUserInterfaceSizeClassCompact){
    return ABI34_0_0EXOrientationPortrait;
  } else if (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassCompact){
    return ABI34_0_0EXOrientationLandscape;
  } else if (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassRegular) {
    return ABI34_0_0EXOrientationLandscape; // iPhone 7 plus
  } else {
    return ABI34_0_0EXOrientationUnknown;
  }
}

- (ABI34_0_0EXOrientation)orientationNativeToJS:(UIInterfaceOrientationMask)orientationMask
{
  if (orientationMask == (UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown)) {
    return ABI34_0_0EXOrientationPortrait;
  } else if (orientationMask == UIInterfaceOrientationMaskPortrait) {
    return ABI34_0_0EXOrientationPortraitUp;
  } else if (orientationMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
    return ABI34_0_0EXOrientationPortraitDown;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscape) {
    return ABI34_0_0EXOrientationLandscape;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeLeft) {
    return ABI34_0_0EXOrientationLandscapeLeft;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeRight) {
    return ABI34_0_0EXOrientationLandscapeRight;
  } else {
    return ABI34_0_0EXOrientationUnknown;
  }
}

- (ABI34_0_0EXOrientationLock)orientationLockNativeToJS:(UIInterfaceOrientationMask)orientationMask
{
  if (orientationMask == UIInterfaceOrientationMaskAllButUpsideDown){
    return ABI34_0_0EXOrientationDefaultLock;
  } else if (orientationMask == UIInterfaceOrientationMaskAll) {
    return ABI34_0_0EXOrientationAllLock;
  } else if (orientationMask == (UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown)) {
    return ABI34_0_0EXOrientationPortraitLock;
  } else if (orientationMask == UIInterfaceOrientationMaskPortrait) {
    return ABI34_0_0EXOrientationPortraitUpLock;
  } else if (orientationMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
    return ABI34_0_0EXOrientationPortraitDownLock;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscape) {
    return ABI34_0_0EXOrientationLandscapeLock;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeLeft) {
    return ABI34_0_0EXOrientationLandscapeLeftLock;
  } else if (orientationMask == UIInterfaceOrientationMaskLandscapeRight) {
    return ABI34_0_0EXOrientationLandscapeRightLock;
  } else {
    return ABI34_0_0EXOrientationOtherLock;
  }
}

- (UIInterfaceOrientationMask)orientationJSToNative:(ABI34_0_0EXOrientation)orientation
{
  if (orientation == ABI34_0_0EXOrientationPortrait) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientation == ABI34_0_0EXOrientationPortraitUp) {
    return UIInterfaceOrientationMaskPortrait;
  } else if (orientation == ABI34_0_0EXOrientationPortraitDown) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientation == ABI34_0_0EXOrientationLandscape) {
    return UIInterfaceOrientationMaskLandscape;
  } else if (orientation == ABI34_0_0EXOrientationLandscapeLeft) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if (orientation == ABI34_0_0EXOrientationLandscapeRight) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else {
    return INVALID_MASK;
  }
}

- (UIInterfaceOrientationMask)orientationLockJSToNative:(ABI34_0_0EXOrientationLock)orientationLock
{
  if (orientationLock == ABI34_0_0EXOrientationDefaultLock) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if (orientationLock == ABI34_0_0EXOrientationAllLock) {
    return UIInterfaceOrientationMaskAll;
  } else if (orientationLock == ABI34_0_0EXOrientationPortraitLock) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientationLock == ABI34_0_0EXOrientationPortraitUpLock) {
    return UIInterfaceOrientationMaskPortrait;
  } else if (orientationLock == ABI34_0_0EXOrientationPortraitDownLock) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if (orientationLock == ABI34_0_0EXOrientationLandscapeLock) {
    return UIInterfaceOrientationMaskLandscape;
  } else if (orientationLock == ABI34_0_0EXOrientationLandscapeLeftLock) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if (orientationLock == ABI34_0_0EXOrientationLandscapeRightLock) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else if (orientationLock == ABI34_0_0EXOrientationAllButUpsideDownLock) { // legacy
    return UIInterfaceOrientationMaskAllButUpsideDown;
  }else {
    return INVALID_MASK;
  }
}

- (ABI34_0_0EXOrientation)stringToOrientation:(NSString *)orientationString
{
  return [[[ABI34_0_0EXScreenOrientation getStringToOrientationJSDict] objectForKey:orientationString] intValue];
}

- (NSString *)orientationToString:(ABI34_0_0EXOrientation)orientation
{
  return [[ABI34_0_0EXScreenOrientation getOrientationJSToStringDict] objectForKey:@(orientation)];
}


- (ABI34_0_0EXOrientationLock)stringToOrientationLock:(NSString *)orientationLockString
{
  return [[[ABI34_0_0EXScreenOrientation getStringToOrientationLockJSDict] objectForKey:orientationLockString] intValue];
}

- (NSString *)orientationLockToString:(ABI34_0_0EXOrientationLock)orientationLock
{
  return [[ABI34_0_0EXScreenOrientation getOrientationLockJSToStringDict] objectForKey:@(orientationLock)];
}

@end
